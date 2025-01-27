"""
HybridRetrieverWithStorage

HybridRetrieverWithStorage is a hybrid retrieval system that combines two retrieval
systems: BM25 and ColBERT. It uses BM25 to retrieve documents from the MS MARCO
dataset, and ColBERT to score the retrieved documents. The system stores the retrieved
documents in a Neo4j database and allows for session management.
"""

import torch
import numpy as np
import fitz  # PyMuPDF
from tqdm import tqdm
from typing import List, Tuple, Union, Optional, Tuple
import json

# Replace py2neo with neo4j library
from neo4j import GraphDatabase

# Other existing imports remain the same
import torch
import torch.nn as nn
from transformers import BertTokenizer

from semantic_chunking import SemanticChunker
from rank_bm25 import BM25Okapi

from rag.hybrid_retrieve.model_service import load_colbert_model, embed_colbert_style

# Logging
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HybridRetrieverWithNeo4j:
    def __init__(
        self,
        model_path,
        neo4j_uri,
        neo4j_user,
        neo4j_password,
    ):
        """
        Initialize ColBERT RAG system with Neo4j integration

        Args:
            model_path: Path to the ColBERT model checkpoint
            neo4j_uri: Neo4j database URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
        """
        # Load ColBERT model and tokenizer
        self.model, self.tokenizer = load_colbert_model(model_path)

        # Initialize Semantic Chunker
        self.semantic_chunker = SemanticChunker()
        self.bm25 = None

        # Set up Neo4j connection
        try:
            self.driver = GraphDatabase.driver(
                neo4j_uri, auth=(neo4j_user, neo4j_password)
            )
            with self.driver.session() as session:
                session.run("RETURN 1")  # Simple test query
            logger.info("Successfully connected to Neo4j database")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j database: {str(e)}")
            raise

    def create_node(self, session, label, properties):
        """
        Create a node with dynamic properties
        """
        # Construct the CREATE query dynamically
        property_strings = [f"{key}: ${key}" for key in properties.keys()]
        property_str = ", ".join(property_strings)

        query = f"CREATE (n:{label} {{{property_str}}})"
        session.run(query, properties)

    def __del__(self):
        """
        Ensure driver is closed when object is deleted
        """
        if hasattr(self, "driver"):
            self.driver.close()

    def text_formatter(self, text: str) -> str:
        """
        Format text by removing newlines and stripping whitespace
        """
        return text.replace("\n", " ").strip()

    def semantic_chunking(
        self, text: str, max_chunk_size: int = 256, overlap: int = 50
    ) -> List[str]:
        """
        Chunk text semantically using SemanticChunker

        Args:
            text: Input text to chunk
            max_chunk_size: Maximum number of words per chunk
            overlap: Number of words to overlap between chunks (currently unused)

        Returns:
            List of semantic chunks
        """
        # Use the existing SemanticChunker with configurable parameters
        chunker = SemanticChunker(
            max_chunk_size=max_chunk_size, similarity_threshold=0.3
        )

        # Perform semantic chunking
        chunks = chunker.semantic_chunk(text)

        return chunks

    def embed_chunk(self, chunk: str) -> Tuple[torch.Tensor, List[str]]:
        """
        Embed a chunk using ColBERT embeddings

        Args:
            chunk: Text chunk to embed

        Returns:
            Tuple of (embeddings, tokens)
        """
        # Temporarily move model to CPU to avoid device issues
        original_device = next(self.model.parameters()).device
        self.model = self.model.cpu()

        try:
            with torch.no_grad():
                chunk_emb, chunk_tokens, chunk_mask = embed_colbert_style(
                    self.model, self.tokenizer, chunk, max_length=self.model.doc_maxlen
                )

            # Filter out padding tokens
            valid_chunk_mask = chunk_mask.bool()
            chunk_emb = chunk_emb[valid_chunk_mask]
            chunk_tokens = [
                token for token, mask in zip(chunk_tokens, valid_chunk_mask) if mask
            ]

        finally:
            # Move model back to original device
            self.model = self.model.to(original_device)

        return chunk_emb, chunk_tokens


    def initialize_bm25(self, chat_id: str):
        """
        Initialize BM25 indexer from existing chunks in Neo4j for a specific chat
        """
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (c:Chunk)
                WHERE c.chat_id = $chat_id
                RETURN c.text AS text
                """,
                {"chat_id": chat_id}
            )

            all_chunks = [record["text"] for record in result]
            all_tokenized_chunks = [chunk.lower().split() for chunk in all_chunks]

            if all_tokenized_chunks:
                self.bm25 = BM25Okapi(all_tokenized_chunks)
                logger.info(f"BM25 initialized with {len(all_chunks)} documents for chat {chat_id}")
            else:
                logger.warning(f"No chunks found for chat {chat_id}. BM25 not initialized.")
    def index_pdf(self, pdf_path: str, chat_id: str, doc_id: str):
        """
        Index a PDF document into Neo4j using ColBERT token-level embeddings
        """
        doc = fitz.open(pdf_path)
        total_chunks = 0

        # Prepare chunks for BM25 initialization
        all_chunks = []
        all_tokenized_chunks = []

        # Start a session
        with self.driver.session() as session:
            for page_number, page in tqdm(enumerate(doc), desc="Processing pages"):
                text = self.text_formatter(page.get_text())
                if not text.strip():
                    continue

                # Chunk the text
                chunks = self.semantic_chunking(text)

                for chunk in chunks:
                    # Tokenize chunk for BM25
                    tokenized_chunk = self.tokenizer.tokenize(chunk)
                    all_chunks.append(chunk)
                    all_tokenized_chunks.append(tokenized_chunk)

                    # Embed the chunk
                    chunk_emb, chunk_tokens = self.embed_chunk(chunk)

                    # Compute token and word counts
                    token_count = len(chunk_tokens)
                    word_count = len(chunk.split())

                    # Serialize embeddings to JSON string
                    # Convert tensor to numpy for serialization
                    embedding_json = json.dumps(chunk_emb.numpy().tolist())

                    # Prepare node properties
                    node_properties = {
                        "chat_id": chat_id,
                        "doc_id": doc_id,
                        "text": chunk,
                        "token_count": token_count,
                        "word_count": word_count,
                        "tokens": chunk_tokens,
                        "embeddings": embedding_json,
                    }

                    try:
                        # Create node in Neo4j
                        self.create_node(session, "Chunk", node_properties)
                        total_chunks += 1
                    except Exception as e:
                        logger.error(f"Error creating node for chunk: {str(e)}")

        # Initialize BM25
        self.bm25 = BM25Okapi(all_tokenized_chunks)

        logger.info(f"Indexed {total_chunks} chunks for document {doc_id}")
        logger.info(f"BM25 initialized with {len(all_chunks)} documents")

    def find_similar_chunks(
        self, query: str, chat_id: str, top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Find similar chunks using hybrid retrieval across all documents in a chat
        """
        try:
            # Ensure BM25 is initialized
            if self.bm25 is None:
                self.initialize_bm25(chat_id)

                # If still no BM25 (no chunks), raise an error or return an empty list
                if self.bm25 is None:
                    logger.warning(f"No chunks found for chat {chat_id}")
                    return []

            # Embed query using ColBERT
            query_emb, query_tokens = self.embed_chunk(query)

            # Neo4j query to find chunks
            with self.driver.session() as session:
                result = session.run(
                    """
                    MATCH (c:Chunk)
                    WHERE c.chat_id = $chat_id
                    RETURN c.text AS text, c.tokens AS tokens, c.embeddings AS embeddings, c.doc_id AS doc_id
                    """,
                    {"chat_id": chat_id},
                )

                chunks = []
                for record in result:
                    chunk_text = record["text"]
                    chunk_tokens = record["tokens"]
                    chunk_embeddings = torch.tensor(json.loads(record["embeddings"]))
                    doc_id = record["doc_id"]

                    # Compute token-level similarities
                    similarities = query_emb @ chunk_embeddings.T
                    max_similarities = similarities.max(dim=1)[0]
                    colbert_score = max_similarities.sum().item()

                    # Compute BM25 score
                    query_tokens = query.lower().split()
                    tokenized_chunk = chunk_text.lower().split()
                    bm25_score = self.bm25.get_scores(tokenized_chunk)[0]

                    # Combine scores
                    hybrid_score = colbert_score + bm25_score

                    chunks.append((chunk_text, float(hybrid_score), doc_id))

                # Sort and return top-k chunks
                chunks.sort(key=lambda x: x[1], reverse=True)
                return [(chunk, score) for chunk, score, _ in chunks[:top_k]]

        except Exception as e:
            logger.error(f"Error in find_similar_chunks: {str(e)}")
            return []

    def topic_retrieve(
        self, query: str, chat_id: str, top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Retrieve chunks by classifying query into existing topics or falling back to general retrieval
        """
        # Ensure BM25 is initialized
        if self.bm25 is None:
            raise ValueError("BM25 not initialized. Call index_pdf() first.")

        # First, get existing topics
        topic_classification_query = """
            MATCH (t:Topic)
            WHERE t.chat_id = $chat_id
            RETURN t.topic_id, t.topic_words
            """

        topic_results = self.graph.run(topic_classification_query, chat_id=chat_id)
        topics = list(topic_results)

        # If no topics found, fall back to standard retrieval
        if not topics:
            print("No topics found. Falling back to standard retrieval.")
            return self.find_similar_chunks(query, chat_id, top_k)

        # Score topics based on keyword similarity
        topic_scores = []
        for topic in topics:
            topic_words = topic["t.topic_words"].split(", ")
            keyword_match = sum(word.lower() in query.lower() for word in topic_words)
            topic_scores.append(
                (topic["t.topic_id"], topic["t.topic_words"], keyword_match)
            )

        # Sort topics by score, descending
        topic_scores.sort(key=lambda x: x[2], reverse=True)

        # If top topic has zero keyword match, fall back to standard retrieval
        if topic_scores[0][2] == 0:
            print("No strong topic match. Falling back to standard retrieval.")
            return self.find_similar_chunks(query, chat_id, top_k)

        # Proceed with top topic retrieval
        top_topic_id, top_topic_words, top_topic_score = topic_scores[0]

        # Print topic classification details
        print("Topic Classification:")
        print(f"Top Topic ID: {top_topic_id}")
        print(f"Topic Words: {top_topic_words}")
        print(f"Keyword Match Score: {top_topic_score}")

        # Retrieve chunks linked to top topic and unlinked chunks
        retrieval_query = """
            MATCH (c:Chunk)
            WHERE c.chat_id = $chat_id
            AND (
                NOT exists((c)-[:BELONGS_TO_TOPIC]->(:Topic))
                OR
                exists((c)-[:BELONGS_TO_TOPIC]->(:Topic {topic_id: $topic_id}))
            )
            RETURN c.text, c.tokens, c.embeddings, c.doc_id
            """

        results = self.graph.run(
            retrieval_query, chat_id=chat_id, topic_id=top_topic_id
        )

        # Embed query
        query_emb, _ = self.embed_chunk(query)

        chunks = []
        for record in results:
            chunk_text = record["c.text"]
            chunk_tokens = record["c.tokens"]
            chunk_embeddings = torch.tensor(json.loads(record["c.embeddings"]))
            doc_id = record["c.doc_id"]

            # Compute token-level similarities
            similarities = query_emb @ chunk_embeddings.T
            max_similarities = similarities.max(dim=1)[0]
            colbert_score = max_similarities.sum().item()

            # Compute BM25 score
            query_tokens = query.lower().split()
            tokenized_chunk = chunk_text.lower().split()
            bm25_score = self.bm25.get_scores(tokenized_chunk)[0]

            # Combine scores
            hybrid_score = colbert_score + bm25_score

            chunks.append((chunk_text, float(hybrid_score), doc_id))

        # Sort and return top-k chunks
        chunks.sort(key=lambda x: x[1], reverse=True)
        return [(chunk, score) for chunk, score, _ in chunks[:top_k]]

    def remove_nodes(self, chat_id: str, document_id: Optional[str] = None) -> dict:
        """
        Remove nodes based on chat_id and optional document_id
        """
        try:
            with self.driver.session() as session:
                # If both chat_id and document_id are provided
                if document_id:
                    result = session.run(
                        """
                        MATCH (n)
                        WHERE n.chat_id = $chat_id AND n.doc_id = $document_id
                        DETACH DELETE n
                        RETURN count(n) AS deleted_nodes_count
                        """,
                        {"chat_id": chat_id, "document_id": document_id},
                    )
                    deleted_count = result.single()["deleted_nodes_count"]

                    return {
                        "success": True,
                        "deleted_nodes_count": deleted_count,
                        "scope": "specific_document",
                        "chat_id": chat_id,
                        "document_id": document_id,
                    }

                # If only chat_id is provided
                else:
                    result = session.run(
                        """
                        MATCH (n)
                        WHERE n.chat_id = $chat_id
                        DETACH DELETE n
                        RETURN count(n) AS deleted_nodes_count
                        """,
                        {"chat_id": chat_id},
                    )
                    deleted_count = result.single()["deleted_nodes_count"]

                    return {
                        "success": True,
                        "deleted_nodes_count": deleted_count,
                        "scope": "entire_chat",
                        "chat_id": chat_id,
                    }

        except Exception as e:
            logger.error(f"Error removing nodes: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "chat_id": chat_id,
                "document_id": document_id,
            }

    def index_markdown(self, md_path: str, chat_id: str, doc_id: str):
        """
        Index a Markdown document into Neo4j using ColBERT token-level embeddings

        This method processes a Markdown file, chunks its content semantically,
        and stores each chunk as a node in Neo4j with ColBERT embeddings and metadata.

        Args:
            md_path (str): Path to the Markdown file to be indexed
            chat_id (str): Unique identifier for the current conversation/session
            doc_id (str): Unique identifier for the document being indexed
        """
        # Read Markdown file content
        try:
            with open(md_path, 'r', encoding='utf-8') as file:
                markdown_content = file.read()
        except IOError as e:
            logger.error(f"Error reading Markdown file {md_path}: {str(e)}")
            raise

        # Clean and format the text
        text = self.text_formatter(markdown_content)
        if not text.strip():
            logger.warning(f"No content found in Markdown file {md_path}")
            return

        # Chunk the Markdown text
        chunks = self.semantic_chunking(text)
        total_chunks = 0

        # Prepare chunks for BM25 initialization
        all_chunks = []
        all_tokenized_chunks = []

        # Start a Neo4j session
        with self.driver.session() as session:
            for chunk in tqdm(chunks, desc="Processing Markdown chunks"):
                # Tokenize chunk for BM25
                tokenized_chunk = self.tokenizer.tokenize(chunk)
                all_chunks.append(chunk)
                all_tokenized_chunks.append(tokenized_chunk)

                # Embed the chunk using ColBERT
                chunk_emb, chunk_tokens = self.embed_chunk(chunk)

                # Compute token and word counts
                token_count = len(chunk_tokens)
                word_count = len(chunk.split())

                # Serialize embeddings to JSON string
                embedding_json = json.dumps(chunk_emb.numpy().tolist())

                # Prepare node properties
                node_properties = {
                    "chat_id": chat_id,
                    "doc_id": doc_id,
                    "text": chunk,
                    "token_count": token_count,
                    "word_count": word_count,
                    "tokens": chunk_tokens,
                    "embeddings": embedding_json,
                    "source_type": "markdown"  # Add a source type identifier
                }

                try:
                    # Create node in Neo4j
                    self.create_node(session, "Chunk", node_properties)
                    total_chunks += 1
                except Exception as e:
                    logger.error(f"Error creating node for Markdown chunk: {str(e)}")

        # Initialize or update BM25 with Markdown chunks
        if self.bm25 is None:
            self.bm25 = BM25Okapi(all_tokenized_chunks)
        else:
            # If BM25 already exists, extend it with new chunks
            self.bm25.corpus.extend(all_tokenized_chunks)
            self.bm25.doc_len.extend([len(chunk) for chunk in all_tokenized_chunks])
            self.bm25.avgdl = sum(self.bm25.doc_len) / len(self.bm25.doc_len)
            self.bm25.corpus_size += len(all_tokenized_chunks)
            self.bm25.idf = self.bm25._calculate_idf()

        logger.info(f"Indexed {total_chunks} chunks from Markdown document {doc_id}")
        logger.info(f"BM25 updated with {len(all_chunks)} total documents")
