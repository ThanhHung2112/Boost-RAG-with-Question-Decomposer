import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from transformers import BertModel, BertTokenizer, BertConfig
from datasets import load_dataset
from tqdm import tqdm
import json
from datetime import datetime
import time
import string
import multiprocessing

# Ensure multiprocessing works correctly on macOS
if sys.platform == 'darwin':
    multiprocessing.set_start_method('spawn')

class ColBERT(nn.Module):
    def __init__(self,
                 query_maxlen=128,
                 doc_maxlen=128,
                 mask_punctuation=True,
                 dim=128,
                 similarity_metric='cosine',
                 model_name="bert-base-uncased"):
        super(ColBERT, self).__init__()

        # Configure punctuation masking
        self.query_maxlen = query_maxlen
        self.doc_maxlen = doc_maxlen
        self.similarity_metric = similarity_metric
        self.dim = dim
        self.mask_punctuation = mask_punctuation
        self.skiplist = {}

        if self.mask_punctuation:
            self.tokenizer = BertTokenizer.from_pretrained(model_name)
            self.skiplist = {w: True
                             for symbol in string.punctuation
                             for w in [symbol, self.tokenizer.encode(symbol, add_special_tokens=False)[0]]}

        # Load BERT model
        self.bert = BertModel.from_pretrained(model_name)

        # Projection layer
        self.linear = nn.Linear(self.bert.config.hidden_size, dim, bias=False)

    def forward_query(self, input_ids, attention_mask):
        # Encode query
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        Q = outputs.last_hidden_state  # [B, L, H]
        Q = self.linear(Q)  # [B, L, D]
        Q = torch.nn.functional.normalize(Q, p=2, dim=2)
        return Q

    def forward_doc(self, input_ids, attention_mask):
        # Encode document
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        D = outputs.last_hidden_state  # [B, L, H]
        D = self.linear(D)  # [B, L, D]

        # Apply masking if needed
        if self.mask_punctuation:
            mask = torch.tensor(self.mask(input_ids), device=input_ids.device).unsqueeze(2).float()
            D = D * mask

        D = torch.nn.functional.normalize(D, p=2, dim=2)
        return D

    def forward(self, query_input_ids, query_attention_mask, doc_input_ids, doc_attention_mask):
        # Get query and document embeddings
        Q = self.forward_query(query_input_ids, query_attention_mask)
        D = self.forward_doc(doc_input_ids, doc_attention_mask)

        # Compute similarity scores
        if self.similarity_metric == 'cosine':
            # MaxSim operation
            similarity = Q @ D.permute(0, 2, 1)  # [B, LQ, LD]
            max_sim = similarity.max(dim=-1)[0]  # [B, LQ]
            score = max_sim.sum(dim=1)  # [B]
        else:  # L2 distance
            # Compute squared L2 distance and take max negated score
            distance = ((Q.unsqueeze(2) - D.unsqueeze(1))**2).sum(-1)
            max_sim = -1.0 * distance.max(-1)[0]
            score = max_sim.sum(dim=1)

        return score

    def mask(self, input_ids):
        # Create mask for punctuation and padding tokens
        mask = [[(x not in self.skiplist) and (x != 0) for x in d] for d in input_ids.cpu().tolist()]
        return mask


def compute_loss(pos_scores, neg_scores, margin=0.1):
    """
    Compute margin ranking loss between positive and negative samples
    """
    loss = torch.max(torch.zeros_like(pos_scores), neg_scores - pos_scores + margin)
    return loss.mean()


class ColBERTDataset(Dataset):
    def __init__(self, data, tokenizer, max_length=128):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length
        # Get all required columns for indexing
        self.queries = data["query"]
        self.passages = data["passages"]

    def __len__(self):
        return len(self.queries)

    def __getitem__(self, idx):
        # Access data using column-first indexing
        query = self.queries[idx]
        passages = self.passages[idx]

        # Get positive and negative passages
        passage_texts = passages["passage_text"]
        is_selected = passages["is_selected"]

        # print("query", query)
        # print("passage_texts", passage_texts)
        # print("is_selected", is_selected)

        # Find the positive and negative passages
        pos_idx = None
        neg_idx = None

        # Find first positive and negative passages
        for i, selected in enumerate(is_selected):
            if selected == 1 and pos_idx is None:
                pos_idx = i
            elif selected == 0 and neg_idx is None:
                neg_idx = i
            if pos_idx is not None and neg_idx is not None:
                break

        # If no positive passage found, use first passage
        if pos_idx is None:
            pos_idx = 0
        # If no negative passage found, use last passage
        if neg_idx is None:
            neg_idx = -1

        pos_passage = passage_texts[pos_idx]
        neg_passage = passage_texts[neg_idx]

        # Tokenize query and passages
        query_encoding = self.tokenizer(
            query,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        pos_encoding = self.tokenizer(
            str(pos_passage),  # Ensure string type
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        neg_encoding = self.tokenizer(
            str(neg_passage),  # Ensure string type
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        return {
            "query_input_ids": query_encoding["input_ids"].squeeze(),
            "query_attention_mask": query_encoding["attention_mask"].squeeze(),
            "pos_input_ids": pos_encoding["input_ids"].squeeze(),
            "pos_attention_mask": pos_encoding["attention_mask"].squeeze(),
            "neg_input_ids": neg_encoding["input_ids"].squeeze(),
            "neg_attention_mask": neg_encoding["attention_mask"].squeeze(),
        }


def train(model, tokenizer, dataloader, epochs=1, learning_rate=2e-5):
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate)
    model.train()

    # Initialize training history
    training_history = {
        "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "model_config": {
            "learning_rate": learning_rate,
            "epochs": epochs,
            "batch_size": dataloader.batch_size,
            "query_maxlen": model.query_maxlen,
            "doc_maxlen": model.doc_maxlen,
            "dim": model.dim,
            "similarity_metric": model.similarity_metric,
            "mask_punctuation": model.mask_punctuation
        },
        "epochs": []
    }

    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)
    print("Training on device:", device)

    # Training loop
    for epoch in range(epochs):
        epoch_start_time = time.time()
        total_loss = 0
        batch_losses = []
        progress_bar = tqdm(dataloader, desc=f"Epoch {epoch+1}")

        for batch_idx, batch in enumerate(progress_bar):
            batch_start_time = time.time()

            # Move batch to device
            query_input_ids = batch["query_input_ids"].to(device)
            query_attention_mask = batch["query_attention_mask"].to(device)
            pos_input_ids = batch["pos_input_ids"].to(device)
            pos_attention_mask = batch["pos_attention_mask"].to(device)
            neg_input_ids = batch["neg_input_ids"].to(device)
            neg_attention_mask = batch["neg_attention_mask"].to(device)

            # Forward pass
            pos_scores = model(
                query_input_ids=query_input_ids,
                query_attention_mask=query_attention_mask,
                doc_input_ids=pos_input_ids,
                doc_attention_mask=pos_attention_mask
            )

            neg_scores = model(
                query_input_ids=query_input_ids,
                query_attention_mask=query_attention_mask,
                doc_input_ids=neg_input_ids,
                doc_attention_mask=neg_attention_mask
            )

            # Compute loss
            loss = compute_loss(pos_scores, neg_scores)

            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            batch_loss = loss.item()
            total_loss += batch_loss

            # Record batch information
            batch_info = {
                "batch_idx": batch_idx,
                "loss": batch_loss,
                "time_taken": time.time() - batch_start_time
            }
            batch_losses.append(batch_info)

            progress_bar.set_postfix({"loss": batch_loss})

        # Calculate epoch metrics
        avg_loss = total_loss / len(dataloader)
        epoch_time = time.time() - epoch_start_time

        # Record epoch information
        epoch_info = {
            "epoch_number": epoch + 1,
            "average_loss": avg_loss,
            "total_loss": total_loss,
            "time_taken": epoch_time,
            "batch_losses": batch_losses
        }
        training_history["epochs"].append(epoch_info)

        print(f"Epoch {epoch+1}, Average Loss: {avg_loss:.4f}, Time: {epoch_time:.2f}s")
        print("Saving model...")
        save_model_and_tokenizer(model, tokenizer, "./colbert_checkpoints", epoch=epoch+1)
        print(F"Model saved as colbert/colbert_model_{epoch+1}.pth")
        # Save training history after each epoch
        with open('training_history.json', 'w') as f:
            json.dump(training_history, f, indent=2)

    # Add end time to training history
    training_history["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    training_history["total_training_time"] = sum(epoch["time_taken"] for epoch in training_history["epochs"])

    save_model_and_tokenizer(model, tokenizer, "./colbert_checkpoints")
    # Save final training history
    with open('training_history.json', 'w') as f:
        json.dump(training_history, f, indent=2)


    return training_history

def save_model_and_tokenizer(model, tokenizer, path, epoch=None):
    """
    Save model and tokenizer in HuggingFace-like format
    """
    # Create directory if it doesn't exist
    os.makedirs(path, exist_ok=True)

    # Determine save path based on epoch
    if epoch is not None:
        model_path = os.path.join(path, f"model_epoch_{epoch}")
    else:
        model_path = os.path.join(path, "final_model")

    os.makedirs(model_path, exist_ok=True)

    # Save model weights
    torch.save(model.state_dict(), os.path.join(model_path, "pytorch_model.bin"))

    # Save in SafeTensors format
    try:
        from safetensors.torch import save_file
        save_file(model.state_dict(), os.path.join(model_path, "model.safetensors"))
    except ImportError:
        print("SafeTensors not available, skipping .safetensors save")

    # Save model configuration (create a config that captures the model's key parameters)
    config = {
        "query_maxlen": model.query_maxlen,
        "doc_maxlen": model.doc_maxlen,
        "mask_punctuation": model.mask_punctuation,
        "dim": model.dim,
        "similarity_metric": model.similarity_metric,
        "model_name": "bert-base-uncased",
        "model_type": "colbert"
    }

    with open(os.path.join(model_path, "config.json"), "w") as f:
        json.dump(config, f, indent=2)

    # Save tokenizer
    tokenizer.save_pretrained(model_path)

    print(f"Model and tokenizer saved to {model_path}")





import os
import torch
from transformers import BertTokenizer
from torch.utils.data import DataLoader

def load_colbert_model(checkpoint_path, device=None):
    """
    Load a previously trained ColBERT model from a checkpoint.

    Args:
        checkpoint_path (str): Path to the model checkpoint directory
        device (str, optional): Device to load the model on. Defaults to cuda if available, else cpu.

    Returns:
        tuple: (model, tokenizer)
    """
    # Determine device
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else
                               "mps" if torch.backends.mps.is_available() else "cpu")

    # Load config
    with open(os.path.join(checkpoint_path, "config.json"), "r") as f:
        config = json.load(f)

    # Recreate the model with the same configuration
    model = ColBERT(
        query_maxlen=config.get('query_maxlen', 128),
        doc_maxlen=config.get('doc_maxlen', 128),
        mask_punctuation=config.get('mask_punctuation', True),
        dim=config.get('dim', 128),
        similarity_metric=config.get('similarity_metric', 'cosine'),
        model_name=config.get('model_name', "bert-base-uncased")
    )

    # Load model weights
    model_weights_path = os.path.join(checkpoint_path, "pytorch_model.bin")
    model.load_state_dict(torch.load(model_weights_path, map_location=device))

    # Load tokenizer
    tokenizer = BertTokenizer.from_pretrained(checkpoint_path)

    # Move model to device
    model.to(device)

    print(f"Loaded model from {checkpoint_path}")
    print(f"Model configuration: {config}")

    return model, tokenizer

def continue_training(checkpoint_path, train_dataset, additional_epochs=1, batch_size=16):
    """
    Continue training a previously trained ColBERT model.

    Args:
        checkpoint_path (str): Path to the model checkpoint directory
        train_dataset (Dataset): Training dataset
        additional_epochs (int, optional): Number of additional epochs to train. Defaults to 1.
        batch_size (int, optional): Batch size for training. Defaults to 16.

    Returns:
        dict: Training history
    """
    # Load the model and tokenizer
    model, tokenizer = load_colbert_model(checkpoint_path)

    # Create DataLoader
    train_dataloader = DataLoader(
        ColBERTDataset(train_dataset, tokenizer),
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
    )

    # Continue training
    training_history = train(
        model,
        tokenizer,
        train_dataloader,
        epochs=additional_epochs
    )

    return training_history

# Example usage in main()
def main():
    # Path to the previously saved model
    checkpoint_path = "./results_1/final_model"

    # Continue training
    continue_training(
        checkpoint_path,
        train_dataset,
        additional_epochs=1  # Train for 2 more epochs
    )

# # Main execution block
# def main():
#     tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
#     colbert_model = ColBERT(
#         query_maxlen=128,
#         doc_maxlen=128,
#         mask_punctuation=True,
#         dim=128,
#         similarity_metric='cosine'
#     )

#     print("Model initialized.")

#     # Load dataset
#     # Initialize dataset and dataloader
#     train_dataloader = DataLoader(
#         ColBERTDataset(train_dataset, tokenizer),
#         batch_size=16,
#         shuffle=True,
#         num_workers=0,  # Set to 0 to avoid multiprocessing issues
#     )

#     print("Training...")
#     # Train the model
#     train_history = train(colbert_model, tokenizer, train_dataloader, epochs=1)

#     # # Save the model
#     # torch.save(colbert_model.state_dict(), "colbert_model_final.pth")
#     print("Training completed and model saved.")

print("loading dataset")
# Load the MS MARCO dataset
ds = load_dataset("microsoft/ms_marco", "v2.1")
samples = len(ds["train"])
print("length of dataset:", samples)

train_sample = int(samples* 0.5)
print("train_sample:", train_sample)
train_dataset = ds["train"][train_sample:] # For demonstration purposes


# Ensure the main block is only run when the script is executed directly
if __name__ == '__main__':
    main()