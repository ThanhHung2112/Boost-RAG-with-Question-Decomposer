import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import BertModel, BertTokenizer
import string
import json
import numpy as np


from torch.utils.data import DataLoader
from transformers import BertTokenizer
from datasets import load_dataset
from sklearn.metrics import ndcg_score
from tqdm import tqdm

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

def load_colbert_model(model_path="./colbert_checkpoints/final_model"):
    """
    Load a trained ColBERT model from a checkpoint
    """
    # Read the config to recreate the model architecture
    with open(f"{model_path}/config.json", "r") as f:
        config = json.load(f)

    # Recreate the model with the same configuration
    model = ColBERT(
        query_maxlen=config.get('query_maxlen', 128),
        doc_maxlen=config.get('doc_maxlen', 128),
        mask_punctuation=config.get('mask_punctuation', True),
        dim=config.get('dim', 128),
        similarity_metric=config.get('similarity_metric', 'cosine')
    )

    # Load the model weights
    model.load_state_dict(torch.load(f"{model_path}/pytorch_model.bin", map_location=torch.device('cpu')))

    # Load the tokenizer
    tokenizer = BertTokenizer.from_pretrained(model_path)

    # Set model to evaluation mode
    model.eval()
    return model, tokenizer

def compute_maxsim_score(Q, D):
    """
    Compute MaxSim score between query and document embeddings
    """
    # Compute similarity matrix between query and document tokens
    similarities = Q @ D.T  # [num_query_tokens, num_doc_tokens]

    # Take the maximum similarity for each query token
    max_similarities, _ = similarities.max(dim=1)

    return max_similarities

def embed_colbert_style(model, tokenizer, text, max_length, is_query=False):
    """
    Embed text in ColBERT style: token-level embeddings
    """
    # Tokenize the text
    encoding = tokenizer(
        text,
        padding='max_length',
        truncation=True,
        max_length=max_length,
        return_tensors='pt'
    )

    # Get token-level embeddings
    with torch.no_grad():
        if is_query:
            embeddings = model.forward_query(
                input_ids=encoding['input_ids'],
                attention_mask=encoding['attention_mask']
            )
        else:
            embeddings = model.forward_doc(
                input_ids=encoding['input_ids'],
                attention_mask=encoding['attention_mask']
            )

    # Decode tokens
    tokens = tokenizer.convert_ids_to_tokens(encoding['input_ids'].squeeze())

    return embeddings.squeeze(0), tokens, encoding['attention_mask'].squeeze(0)

def embed_colbert_style(model, tokenizer, input_ids, attention_mask, max_length, is_query=False):
    """
    Embed text in ColBERT style: token-level embeddings

    Args:
        model: ColBERT model
        tokenizer: Tokenizer (can be string or tokenizer object)
        input_ids: Input token IDs
        attention_mask: Attention mask
        max_length: Maximum sequence length
        is_query: Whether this is a query embedding (default False)
    """
    # Ensure input_ids and attention_mask are tensors
    if not isinstance(input_ids, torch.Tensor):
        input_ids = torch.tensor(input_ids)
    if not isinstance(attention_mask, torch.Tensor):
        attention_mask = torch.tensor(attention_mask)

    # Ensure input_ids and attention_mask have correct dimensions
    input_ids = input_ids.unsqueeze(0) if input_ids.dim() == 1 else input_ids
    attention_mask = attention_mask.unsqueeze(0) if attention_mask.dim() == 1 else attention_mask

    # Get token-level embeddings
    with torch.no_grad():
        if is_query:
            embeddings = model.forward_query(
                input_ids=input_ids,
                attention_mask=attention_mask
            )
        else:
            embeddings = model.forward_doc(
                input_ids=input_ids,
                attention_mask=attention_mask
            )

    # Decode tokens
    if isinstance(tokenizer, str):
        tokenizer = BertTokenizer.from_pretrained(tokenizer)

    tokens = tokenizer.convert_ids_to_tokens(input_ids.squeeze())

    return embeddings.squeeze(0), tokens, attention_mask.squeeze(0)

def prepare_test_dataset(dataset, tokenizer, max_length=128):
    """
    Prepare test dataset for ColBERT evaluation
    """
    prepared_data = []

    for i in range(len(dataset)):
        query = dataset['query'][i]
        passages = {
            'passage_text': dataset['passages'][i]['passage_text'],
            'is_selected': dataset['passages'][i]['is_selected']
        }

        # Process passages
        passage_texts = passages['passage_text']
        is_selected = passages['is_selected']

        # Find first positive and first negative passage
        pos_passage = None
        neg_passage = None

        for text, selected in zip(passage_texts, is_selected):
            if selected == 1 and pos_passage is None:
                pos_passage = text
            if selected == 0 and neg_passage is None:
                neg_passage = text

            if pos_passage and neg_passage:
                break

        # Default to first passages if not found
        pos_passage = pos_passage or passage_texts[0]
        neg_passage = neg_passage or passage_texts[-1]

        # Tokenize query and passages
        query_encoding = tokenizer(
            query,
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        )

        pos_encoding = tokenizer(
            str(pos_passage),
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        )

        neg_encoding = tokenizer(
            str(neg_passage),
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        )

        prepared_data.append({
            "query_input_ids": query_encoding["input_ids"].squeeze(),
            "query_attention_mask": query_encoding["attention_mask"].squeeze(),
            "pos_input_ids": pos_encoding["input_ids"].squeeze(),
            "pos_attention_mask": pos_encoding["attention_mask"].squeeze(),
            "neg_input_ids": neg_encoding["input_ids"].squeeze(),
            "neg_attention_mask": neg_encoding["attention_mask"].squeeze()
        })

    return prepared_data


def evaluate_colbert(model, test_dataset, k=10):
    """
    Evaluate ColBERT model on test dataset with token-level similarity computation and progress bar.
    """
    # Explicitly set device and move model
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)

    metrics = {
        f"MRR@{k}": 0.0,
        f"MAP@{k}": 0.0,
        f"Recall@{k}": 0.0,
        f"Precision@{k}": 0.0,
        f"NDCG@{k}": 0.0
    }

    all_scores, all_labels = [], []

    # Evaluate model on the test dataset with progress bar
    with torch.no_grad():
        progress_bar = tqdm(test_dataset, desc=f"Evaluating ColBERT (k={k})", unit="sample")
        for sample in progress_bar:
            # Ensure tensors are on the right device
            query_input_ids = sample["query_input_ids"].to(device)
            query_attention_mask = sample["query_attention_mask"].to(device)

            # Embed query tokens
            query_emb = model.forward_query(
                input_ids=query_input_ids.unsqueeze(0),
                attention_mask=query_attention_mask.unsqueeze(0)
            )
            query_emb = query_emb.squeeze(0)

            # Filter out padding tokens
            valid_query_mask = query_attention_mask.bool()
            query_emb_filtered = query_emb[valid_query_mask]

            # Embed positive and negative passages
            passage_scores, passage_labels = [], []

            for passage_input_ids, passage_attention_mask, label in zip(
                [sample["pos_input_ids"], sample["neg_input_ids"]],
                [sample["pos_attention_mask"], sample["neg_attention_mask"]],
                [1, 0]
            ):
                # Move passage tensors to device
                passage_input_ids = passage_input_ids.to(device)
                passage_attention_mask = passage_attention_mask.to(device)

                # Embed passage tokens
                passage_emb = model.forward_doc(
                    input_ids=passage_input_ids.unsqueeze(0),
                    attention_mask=passage_attention_mask.unsqueeze(0)
                )
                passage_emb = passage_emb.squeeze(0)

                # Filter out padding tokens
                valid_passage_mask = passage_attention_mask.bool()
                passage_emb_filtered = passage_emb[valid_passage_mask]

                # Compute MaxSim score
                # Ensure both embeddings are on CPU for numpy operations
                query_emb_np = query_emb_filtered.cpu().numpy()
                passage_emb_np = passage_emb_filtered.cpu().numpy()

                # Compute similarities
                similarities = query_emb_np @ passage_emb_np.T
                max_similarities = similarities.max(axis=1)

                # Aggregate score (e.g., mean of MaxSim scores)
                score = max_similarities.mean()

                passage_scores.append(score)
                passage_labels.append(label)

            all_scores.append(passage_scores)
            all_labels.append(passage_labels)

            # Update progress bar with current metrics
            progress_bar.set_postfix({
                "Best Score": max(passage_scores),
                "Label": passage_labels[np.argmax(passage_scores)]
            })

    # Convert scores and labels to numpy arrays
    all_scores = np.array(all_scores)
    all_labels = np.array(all_labels)

    # Compute metrics (reuse existing metric computation logic)
    mrr_scores, map_scores, recall_scores, precision_scores, ndcg_scores = [], [], [], [], []

    for scores, labels in zip(all_scores, all_labels):
        # Ensure k doesn't exceed the number of available samples
        actual_k = min(k, len(scores))

        sorted_indices = np.argsort(scores)[::-1]
        sorted_labels = labels[sorted_indices]

        # MRR@K
        relevant_ranks = np.where(sorted_labels[:actual_k] == 1)[0]
        mrr_scores.append(1 / (relevant_ranks[0] + 1) if len(relevant_ranks) > 0 else 0)

        # MAP@K
        relevant_count = 0
        precision_sum = 0.0
        for j, label in enumerate(sorted_labels[:actual_k]):
            if label == 1:
                relevant_count += 1
                precision_sum += relevant_count / (j + 1)
        map_scores.append(precision_sum / max(np.sum(labels == 1), 1))

        # Recall@K
        recall = np.sum(sorted_labels[:actual_k] == 1) / max(np.sum(labels == 1), 1)
        recall_scores.append(recall)

        # Precision@K
        precision = np.sum(sorted_labels[:actual_k] == 1) / actual_k
        precision_scores.append(precision)

        # NDCG@K
        # Pad or truncate labels to actual_k length
        padded_labels = np.zeros(actual_k)
        padded_labels[:len(sorted_labels[:actual_k])] = sorted_labels[:actual_k]

        dcg = np.sum((2**padded_labels - 1) / np.log2(np.arange(1, actual_k + 1) + 1))

        # Create ideal DCG with sorted labels
        ideal_labels = np.sort(labels)[::-1][:actual_k]
        padded_ideal_labels = np.zeros(actual_k)
        padded_ideal_labels[:len(ideal_labels)] = ideal_labels

        idcg = np.sum((2**padded_ideal_labels - 1) / np.log2(np.arange(1, actual_k + 1) + 1))
        ndcg_scores.append(dcg / max(idcg, 1e-10))

    # Aggregate metrics
    metrics[f"MRR@{k}"] = np.mean(mrr_scores)
    metrics[f"MAP@{k}"] = np.mean(map_scores)
    metrics[f"Recall@{k}"] = np.mean(recall_scores)
    metrics[f"Precision@{k}"] = np.mean(precision_scores)
    metrics[f"NDCG@{k}"] = np.mean(ndcg_scores)

    return metrics

# Load dataset
print("Loading dataset")
ds = load_dataset("microsoft/ms_marco", "v2.1")
test_dataset = ds["test"]

print("Loading ColBERT model")
# Load ColBERT model
model, tokenizer = load_colbert_model("./colbert_checkpoints/final_model")

print("Preparing test dataset")
# Prepare test dataset
prepared_test_data = prepare_test_dataset(test_dataset, tokenizer)

# # Evaluate model with default K=10
# evaluation_results = evaluate_colbert(model, prepared_test_data)

# Optional: Evaluate with different K values
# evaluation_results_k1 = evaluate_colbert(model, prepared_test_data, k=1)
evaluation_results_k3 = evaluate_colbert(model, prepared_test_data, k=3)
# evaluation_results_k5 = evaluate_colbert(model, prepared_test_data, k=5)

# Save results
results_to_save = {
    # "k1_results": evaluation_results_k1,
    "k3_results": evaluation_results_k3,
    # "k5_results": evaluation_results_k5,
}

with open('evaluation_results_k3.json', 'w') as f:
    json.dump(results_to_save, f, indent=2)