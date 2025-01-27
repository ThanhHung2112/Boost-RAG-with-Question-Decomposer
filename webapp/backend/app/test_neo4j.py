from rag.hybrid_retrieve.hybrid import HybridRetrieverWithNeo4j

rag = HybridRetrieverWithNeo4j(
    model_path="./app/models/colbert/",
    neo4j_uri="neo4j://localhost:7687",
    neo4j_user="neo4j",
    neo4j_password="12qwaszx"
)

# Index a PDF
pdf_path = "./app/pdfs/DT.pdf"
chat_id = "001"
doc_id = "001"

rag.index_pdf(pdf_path, chat_id, doc_id)