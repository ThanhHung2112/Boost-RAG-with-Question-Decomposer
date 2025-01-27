"""
ColBERT model for hybrid retrieval.

This model is used to score documents based on the similarity between query and document tokens. The model uses a BERT encoder to encode query and document tokens, and then computes similarity scores using the MaxSim operation. The final score is computed by summing the maximum similarity scores for each query token.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import BertModel, BertTokenizer
import string
import json
import numpy as np

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