import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import BertModel, BertTokenizer
import string
import json
import numpy as np

from rag.hybrid_retrieve.colbert import ColBERT
from config import settings
def load_colbert_model(model_path=settings.COLBERT_MODEL):
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
