# app/retriever.py
from rag.hybrid_retrieve.hybrid import HybridRetrieverWithNeo4j

retriever = None

def init_retriever():
    global retriever
    retriever = HybridRetrieverWithNeo4j(
        model_path="./app/models/colbert/",
        neo4j_uri="neo4j://localhost:7687",
        neo4j_user="neo4j",
        neo4j_password="12qwaszx"
    )
