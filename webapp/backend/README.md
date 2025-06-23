# Boost RAG APIs

## Models

- [Question decomposer model](https://huggingface.co/thenHung/question_decomposer_t5)
- [Colbert Model](https://huggingface.co/thenHung/Colbert_reranking/)


## System Requirements:

- Redis
- Neo4j

## Usage

1. Create env and install dependencies.
```
conda create -n rag_api python=3.11
conda activate rag_api
pip install -r requirements.txt
```

2. Start API
```bash
python app
```

3. On another terminal, start worker

```bash
python app/worker.py
```


## Acknowledged

- [NLU I Information Retrieval](https://www.youtube.com/watch?v=EDVqG86AT0Q)
- [Retrieval Augmented Language Models](https://www.youtube.com/watch?v=mE7IDf2SmJg&t=3368s)
- [Neural IR](https://www.youtube.com/watch?v=KQMuiO59rGM&list=LL&index=7)
- [gemma2](https://ollama.com/library/gemma2)
- [neo4j](https://neo4j.com/)
- [T5](https://paperswithcode.com/paper/exploring-the-limits-of-transfer-learning)
- [ColBERT](https://github.com/stanford-futuredata/ColBERT)
