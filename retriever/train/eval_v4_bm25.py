import torch
import torch.nn as nn
import numpy as np
import json
from typing import List, Dict, Any

from transformers import BertTokenizer
from datasets import load_dataset
from tqdm import tqdm
from rank_bm25 import BM25Okapi

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
    def __init__(
        self,
        query_maxlen=128,
        doc_maxlen=128,
        mask_punctuation=True,
        dim=128,
        similarity_metric="cosine",
        model_name="bert-base-uncased",
    ):
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
            self.skiplist = {
                w: True
                for symbol in string.punctuation
                for w in [
                    symbol,
                    self.tokenizer.encode(symbol, add_special_tokens=False)[0],
                ]
            }

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
            mask = (
                torch.tensor(self.mask(input_ids), device=input_ids.device)
                .unsqueeze(2)
                .float()
            )
            D = D * mask

        D = torch.nn.functional.normalize(D, p=2, dim=2)
        return D

    def forward(
        self, query_input_ids, query_attention_mask, doc_input_ids, doc_attention_mask
    ):
        # Get query and document embeddings
        Q = self.forward_query(query_input_ids, query_attention_mask)
        D = self.forward_doc(doc_input_ids, doc_attention_mask)

        # Compute similarity scores
        if self.similarity_metric == "cosine":
            # MaxSim operation
            similarity = Q @ D.permute(0, 2, 1)  # [B, LQ, LD]
            max_sim = similarity.max(dim=-1)[0]  # [B, LQ]
            score = max_sim.sum(dim=1)  # [B]
        else:  # L2 distance
            # Compute squared L2 distance and take max negated score
            distance = ((Q.unsqueeze(2) - D.unsqueeze(1)) ** 2).sum(-1)
            max_sim = -1.0 * distance.max(-1)[0]
            score = max_sim.sum(dim=1)

        return score

    def mask(self, input_ids):
        # Create mask for punctuation and padding tokens
        mask = [
            [(x not in self.skiplist) and (x != 0) for x in d]
            for d in input_ids.cpu().tolist()
        ]
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
        query_maxlen=config.get("query_maxlen", 128),
        doc_maxlen=config.get("doc_maxlen", 128),
        mask_punctuation=config.get("mask_punctuation", True),
        dim=config.get("dim", 128),
        similarity_metric=config.get("similarity_metric", "cosine"),
    )

    # Load the model weights
    model.load_state_dict(
        torch.load(f"{model_path}/pytorch_model.bin", map_location=torch.device("cpu"))
    )

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


def prepare_test_dataset(dataset, tokenizer, max_length=128):
    """
    Prepare test dataset for ColBERT evaluation
    """
    prepared_data = []

    for i in range(len(dataset)):
        query = dataset["query"][i]
        passages = {
            "passage_text": dataset["passages"][i]["passage_text"],
            "is_selected": dataset["passages"][i]["is_selected"],
        }

        # Process passages
        passage_texts = passages["passage_text"]
        is_selected = passages["is_selected"]

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
            return_tensors="pt",
        )

        pos_encoding = tokenizer(
            str(pos_passage),
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )

        neg_encoding = tokenizer(
            str(neg_passage),
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )

        prepared_data.append(
            {
                "query_input_ids": query_encoding["input_ids"].squeeze(),
                "query_attention_mask": query_encoding["attention_mask"].squeeze(),
                "pos_input_ids": pos_encoding["input_ids"].squeeze(),
                "pos_attention_mask": pos_encoding["attention_mask"].squeeze(),
                "neg_input_ids": neg_encoding["input_ids"].squeeze(),
                "neg_attention_mask": neg_encoding["attention_mask"].squeeze(),
            }
        )

    return prepared_data


def embed_colbert_style(model, tokenizer, text, max_length, is_query=False):
    """
    Embed text in ColBERT style: token-level embeddings
    """
    # Tokenize the text
    encoding = tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=max_length,
        return_tensors="pt",
    )

    # Get token-level embeddings
    with torch.no_grad():
        if is_query:
            embeddings = model.forward_query(
                input_ids=encoding["input_ids"],
                attention_mask=encoding["attention_mask"],
            )
        else:
            embeddings = model.forward_doc(
                input_ids=encoding["input_ids"],
                attention_mask=encoding["attention_mask"],
            )

    # Decode tokens
    tokens = tokenizer.convert_ids_to_tokens(encoding["input_ids"].squeeze())

    return embeddings.squeeze(0), tokens, encoding["attention_mask"].squeeze(0)


def embed_colbert_style(
    model, tokenizer, input_ids, attention_mask, max_length, is_query=False
):
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
    attention_mask = (
        attention_mask.unsqueeze(0) if attention_mask.dim() == 1 else attention_mask
    )

    # Get token-level embeddings
    with torch.no_grad():
        if is_query:
            embeddings = model.forward_query(
                input_ids=input_ids, attention_mask=attention_mask
            )
        else:
            embeddings = model.forward_doc(
                input_ids=input_ids, attention_mask=attention_mask
            )

    # Decode tokens
    if isinstance(tokenizer, str):
        tokenizer = BertTokenizer.from_pretrained(tokenizer)

    tokens = tokenizer.convert_ids_to_tokens(input_ids.squeeze())

    return embeddings.squeeze(0), tokens, attention_mask.squeeze(0)


import torch
import torch.nn as nn
import numpy as np
import json
import re
from typing import List, Dict, Any

from transformers import BertTokenizer
from datasets import load_dataset
from tqdm import tqdm
from rank_bm25 import BM25Okapi


class ColBERTBM25Evaluator:
    def __init__(self, model, tokenizer, k=10):
        """
        Initialize hybrid evaluator with ColBERT model and BM25

        Args:
            model: Trained ColBERT model
            tokenizer: BERT tokenizer
            k: Number of top results to evaluate
        """
        self.model = model
        self.tokenizer = tokenizer
        self.k = k
        self.device = torch.device(
            "mps" if torch.backends.mps.is_available() else "cpu"
        )
        self.model.to(self.device)

    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text for BM25 tokenization

        Args:
            text: Input text to preprocess

        Returns:
            List of preprocessed tokens
        """
        # Remove special tokens and convert to lowercase
        text = re.sub(r"\[CLS\]|\[SEP\]", "", text).lower()
        # Split into tokens, removing non-alphanumeric characters
        tokens = re.findall(r"\b\w+\b", text)
        return tokens

    def prepare_bm25_corpus(self, test_dataset):
        """
        Prepare corpus for BM25 indexing

        Args:
            test_dataset: MS MARCO test dataset

        Returns:
            BM25 corpus and corresponding passages
        """
        bm25_corpus = []
        bm25_passages = []

        for i in range(len(test_dataset)):
            # Get passages for this sample
            passages = test_dataset["passages"][i]["passage_text"]

            for passage in passages:
                # Preprocess passage for BM25
                tokenized_passage = self.preprocess_text(str(passage))

                # Only add non-empty tokenized passages
                if tokenized_passage:
                    bm25_corpus.append(tokenized_passage)
                    bm25_passages.append(passage)

        return BM25Okapi(bm25_corpus), bm25_passages

    def compute_hybrid_scores(
            self,
            query_input_ids: torch.Tensor,
            query_attention_mask: torch.Tensor,
            passage_input_ids: torch.Tensor,
            passage_attention_mask: torch.Tensor,
            bm25_obj: Any,
            bm25_passages: List[str],
            alpha: float = 0.5
        ) -> float:
        """
        Compute hybrid score combining ColBERT and BM25

        Args:
            query_input_ids: Tokenized query input IDs
            query_attention_mask: Query attention mask
            passage_input_ids: Tokenized passage input IDs
            passage_attention_mask: Passage attention mask
            bm25_obj: BM25 indexer
            bm25_passages: List of passages for BM25
            alpha: Weight for ColBERT vs BM25 score

        Returns:
            Hybrid similarity score
        """
        # ColBERT embedding
        query_emb = self.model.forward_query(
            input_ids=query_input_ids.unsqueeze(0).to(self.device),
            attention_mask=query_attention_mask.unsqueeze(0).to(self.device),
        ).squeeze(0)

        passage_emb = self.model.forward_doc(
            input_ids=passage_input_ids.unsqueeze(0).to(self.device),
            attention_mask=passage_attention_mask.unsqueeze(0).to(self.device),
        ).squeeze(0)

        # Filter out padding tokens
        valid_query_mask = query_attention_mask.bool()
        valid_passage_mask = passage_attention_mask.bool()

        query_emb_filtered = query_emb[valid_query_mask].cpu().numpy()
        passage_emb_filtered = passage_emb[valid_passage_mask].cpu().numpy()

        # ColBERT MaxSim score
        similarities = query_emb_filtered @ passage_emb_filtered.T
        colbert_score = similarities.max(axis=1).mean()

        # BM25 score
        # Decode and preprocess query and passage
        query_tokens = self.preprocess_text(
            self.tokenizer.decode(query_input_ids[valid_query_mask])
        )
        passage_text = self.tokenizer.decode(passage_input_ids[valid_passage_mask])

        # Find closest matching passage
        try:
            # Try to find the exact passage
            idx = bm25_passages.index(passage_text)
        except ValueError:
            # If exact match fails, find closest match or use first occurrence
            idx = next((i for i, p in enumerate(bm25_passages) if passage_text in p), 0)

        # Compute BM25 score
        bm25_score = bm25_obj.get_scores(query_tokens)[idx]

        # Hybrid score
        hybrid_score = alpha * colbert_score + (1 - alpha) * bm25_score
        return hybrid_score

    def evaluate(self, test_dataset, prepared_test_data):
        # Prepare BM25 corpus
        bm25_obj, bm25_passages = self.prepare_bm25_corpus(test_dataset)

        metrics = {
            f"Hybrid_MRR@{self.k}": 0.0,
            f"Hybrid_MAP@{self.k}": 0.0,
            f"Hybrid_Recall@{self.k}": 0.0,
            f"Hybrid_Precision@{self.k}": 0.0,
            f"Hybrid_NDCG@{self.k}": 0.0,
        }

        all_scores, all_labels = [], []

        # Evaluate model on the test dataset with progress bar
        with torch.no_grad():
            progress_bar = tqdm(
                prepared_test_data,
                desc=f"Evaluating Hybrid ColBERT-BM25 (k={self.k})",
                unit="sample",
            )
            for sample in progress_bar:
                passage_scores, passage_labels = [], []

                for passage_input_ids, passage_attention_mask, label in zip(
                    [sample["pos_input_ids"], sample["neg_input_ids"]],
                    [sample["pos_attention_mask"], sample["neg_attention_mask"]],
                    [1, 0],
                ):
                    # Compute hybrid score
                    hybrid_score = self.compute_hybrid_scores(
                        sample["query_input_ids"],
                        sample["query_attention_mask"],
                        passage_input_ids,
                        passage_attention_mask,
                        bm25_obj,
                        bm25_passages,
                    )

                    passage_scores.append(hybrid_score)
                    passage_labels.append(label)

                all_scores.append(passage_scores)
                all_labels.append(passage_labels)

                # Update progress bar
                progress_bar.set_postfix(
                    {
                        "Best Score": max(passage_scores),
                        "Label": passage_labels[np.argmax(passage_scores)],
                    }
                )

        # Compute and return metrics
        mrr_scores, map_scores, recall_scores, precision_scores, ndcg_scores = (
            [],
            [],
            [],
            [],
            [],
        )

        for scores, labels in zip(all_scores, all_labels):
            # Convert labels to NumPy array
            scores = np.array(scores)
            labels = np.array(labels)

            actual_k = min(self.k, len(scores))

            sorted_indices = np.argsort(scores)[::-1]
            sorted_labels = labels[sorted_indices]

            # MRR@K
            relevant_ranks = np.where(sorted_labels[:actual_k] == 1)[0]
            mrr_scores.append(
                1 / (relevant_ranks[0] + 1) if len(relevant_ranks) > 0 else 0
            )

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
            padded_labels = np.zeros(actual_k)
            padded_labels[: len(sorted_labels[:actual_k])] = sorted_labels[:actual_k]

            dcg = np.sum(
                (2**padded_labels - 1) / np.log2(np.arange(1, actual_k + 1) + 1)
            )

            ideal_labels = np.sort(labels)[::-1][:actual_k]
            padded_ideal_labels = np.zeros(actual_k)
            padded_ideal_labels[: len(ideal_labels)] = ideal_labels

            idcg = np.sum(
                (2**padded_ideal_labels - 1) / np.log2(np.arange(1, actual_k + 1) + 1)
            )
            ndcg_scores.append(dcg / max(idcg, 1e-10))

        # Aggregate metrics
        metrics[f"Hybrid_MRR@{self.k}"] = np.mean(mrr_scores)
        metrics[f"Hybrid_MAP@{self.k}"] = np.mean(map_scores)
        metrics[f"Hybrid_Recall@{self.k}"] = np.mean(recall_scores)
        metrics[f"Hybrid_Precision@{self.k}"] = np.mean(precision_scores)
        metrics[f"Hybrid_NDCG@{self.k}"] = np.mean(ndcg_scores)

        return metrics


def main():
    print("Loading dataset")
    ds = load_dataset("microsoft/ms_marco", "v2.1")
    test_dataset = ds["test"][:20000000000]

    print("Loading ColBERT model")
    model, tokenizer = load_colbert_model("./colbert_checkpoints/final_model")

    print("Preparing test dataset")
    prepared_test_data = prepare_test_dataset(test_dataset, tokenizer)

    # Evaluate model with different settings
    evaluator_k3 = ColBERTBM25Evaluator(model, tokenizer, k=1)
    evaluation_results_hybrid_k3 = evaluator_k3.evaluate(test_dataset, prepared_test_data)

    # Evaluate with different alpha values for hybrid scoring
    alpha_values = [0.3, 0.5, 0.7]
    hybrid_results = {}

    for alpha in alpha_values:
        evaluator = ColBERTBM25Evaluator(model, tokenizer, k=1)
        hybrid_results[f"alpha_{alpha}"] = evaluator.evaluate(test_dataset, prepared_test_data)

    # Save results
    results_to_save = {
        "hybrid_k3_results": evaluation_results_hybrid_k3,
        "hybrid_alpha_results": hybrid_results
    }

    with open('hybrid_evaluation_results.json', 'w') as f:
        json.dump(results_to_save, f, indent=2)

if __name__ == "__main__":
    main()