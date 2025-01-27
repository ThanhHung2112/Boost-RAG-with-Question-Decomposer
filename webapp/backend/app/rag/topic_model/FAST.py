import re
import json
import numpy as np
from typing import List, Tuple, Union
import logging

# FASTopic and related imports
from fastopic import FASTopic
from topmost.preprocessing import Preprocessing

# Neo4j libraries
from py2neo import Graph, Node, Relationship, NodeMatcher

# Gensim imports
from gensim.models.coherencemodel import CoherenceModel
from gensim.corpora import Dictionary
import re
import json
import numpy as np
from typing import List, Tuple, Union
import logging

# FASTopic and related imports
from fastopic import FASTopic
from topmost.preprocessing import Preprocessing

# Neo4j libraries
from neo4j import GraphDatabase


class FASTopicModel:
    def __init__(
        self,
        neo4j_uri="neo4j://localhost:7687",
        neo4j_user="neo4j",
        neo4j_password="12qwaszx",
    ):
        """
        Initialize FASTopic Topic Modeler with Neo4j connection
        """
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Set up Neo4j connection
        try:
            self.driver = GraphDatabase.driver(
                neo4j_uri, auth=(neo4j_user, neo4j_password)
            )
            self.logger.info("Successfully connected to Neo4j database")
        except Exception as e:
            self.logger.error(f"Failed to connect to Neo4j database: {str(e)}")
            raise

        # Initialize preprocessing
        self.preprocessing = Preprocessing(stopwords="English")

    def close(self):
        """
        Close the Neo4j driver connection
        """
        if hasattr(self, "driver"):
            self.driver.close()

    def _extract_chunks(self, chat_id: str, doc_id: str) -> List[str]:
        """
        Retrieve document chunks for topic modeling
        """
        # Cypher query to fetch chunks
        cypher_query = """
        MATCH (c:Chunk)
        WHERE c.chat_id = $chat_id AND c.doc_id = $doc_id
        RETURN c.text
        """

        # Execute query
        with self.driver.session() as session:
            result = session.run(cypher_query, chat_id=chat_id, doc_id=doc_id)
            chunks = [record["c.text"] for record in result if record["c.text"]]

        return chunks

    def _preprocess_documents(
        self, chunks: List[str]
    ) -> Tuple[List[List[str]], Dictionary]:
        """
        Preprocess documents with error handling and flexibility

        Returns:
        - Preprocessed texts (list of tokenized documents)
        - Gensim Dictionary
        """
        try:
            # Attempt preprocessing
            preprocessed_docs = self.preprocessing.preprocess(chunks)

            # Flexible text extraction
            if isinstance(preprocessed_docs, dict):
                # Try different keys for preprocessed texts
                possible_keys = ["texts", "preprocessed", "tokenized"]
                for key in possible_keys:
                    if key in preprocessed_docs:
                        preprocessed_texts = preprocessed_docs[key]
                        break
                else:
                    # Fallback: basic preprocessing
                    self.logger.warning(
                        "Could not find preprocessed texts. Falling back to basic preprocessing."
                    )
                    preprocessed_texts = [doc.lower().split() for doc in chunks]
            elif isinstance(preprocessed_docs, list):
                # If already a list of tokenized documents
                preprocessed_texts = preprocessed_docs
            else:
                # Last resort fallback
                preprocessed_texts = [doc.lower().split() for doc in chunks]

            # Ensure preprocessed_texts is a list of lists
            if not preprocessed_texts or not isinstance(preprocessed_texts[0], list):
                raise ValueError(
                    "Preprocessing did not result in a list of tokenized documents"
                )

            # Create dictionary
            dictionary = Dictionary(preprocessed_texts)

            return preprocessed_texts, dictionary

        except Exception as e:
            self.logger.error(f"Error in document preprocessing: {str(e)}")
            # Fallback to basic preprocessing
            preprocessed_texts = [doc.lower().split() for doc in chunks]
            dictionary = Dictionary(preprocessed_texts)
            return preprocessed_texts, dictionary

    def generate_topics(
        self,
        chat_id: str,
        doc_id: str,
        num_topics: int = 5,
        coherence_method: str = "c_v",
    ):
        """
        Generate topics for a specific document using FASTopic
        """
        # Retrieve chunks
        chunks = self._extract_chunks(chat_id, doc_id)

        if not chunks:
            self.logger.warning("No chunks found for topic modeling")
            return

        try:
            # Preprocess documents with error handling
            preprocessed_texts, dictionary = self._preprocess_documents(chunks)

            # Validate model initialization and topic extraction
            # Generate topic distributions randomly (replace this with real modeling later)
            doc_topic_dist = np.random.rand(len(chunks), num_topics)
            doc_topic_dist /= doc_topic_dist.sum(axis=1)[:, np.newaxis]

            # Create unique topic keywords based on doc_topic_dist
            topic_top_words = []
            for topic_idx in range(num_topics):
                # Collect words from chunks where this topic is dominant
                topic_words = []
                for chunk_idx, text in enumerate(preprocessed_texts):
                    if np.argmax(doc_topic_dist[chunk_idx]) == topic_idx:
                        topic_words.extend(text)

                # Keep top 5 unique words for the topic
                topic_top_words.append(list(set(topic_words))[:5])

            # Use a session to perform database operations
            with self.driver.session() as session:
                # Create or find document node
                document_node_query = """
                MERGE (d:Document {chat_id: $chat_id, doc_id: $doc_id})
                RETURN d
                """
                document_node = session.run(
                    document_node_query, chat_id=chat_id, doc_id=doc_id
                ).single()

                # Delete existing topic relationships
                delete_query = """
                MATCH (d:Document)-[r:HAS_TOPIC]->(t:Topic)
                WHERE d.chat_id = $chat_id AND d.doc_id = $doc_id
                DELETE r, t
                """
                session.run(delete_query, chat_id=chat_id, doc_id=doc_id)

                # Create and link topic nodes
                for topic_idx, topic_words in enumerate(topic_top_words):
                    # Create topic node with unique topic words
                    create_topic_query = """
                    CREATE (t:Topic {
                        chat_id: $chat_id,
                        doc_id: $doc_id,
                        topic_id: $topic_id,
                        topic_words: $topic_words
                    })
                    WITH t
                    MATCH (d:Document {chat_id: $chat_id, doc_id: $doc_id})
                    CREATE (d)-[:HAS_TOPIC]->(t)
                    RETURN t
                    """
                    topic_node = session.run(
                        create_topic_query,
                        chat_id=chat_id,
                        doc_id=doc_id,
                        topic_id=str(topic_idx),
                        topic_words=", ".join(topic_words),
                    ).single()

                    # Link chunks to topics
                    self._link_chunks_to_topics(
                        chat_id, doc_id, topic_idx, topic_words, chunks, doc_topic_dist
                    )

        except Exception as e:
            self.logger.error(f"Comprehensive error in topic generation: {str(e)}")
            raise

    def _link_chunks_to_topics(
        self,
        chat_id: str,
        doc_id: str,
        topic_idx: int,
        topic_keywords: List[str],
        chunks: List[str],
        doc_topics,
    ):
        """
        Link document chunks to topics based on their topic probability distribution
        """
        try:
            # Convert to numpy array and ensure consistent shape
            if not isinstance(doc_topics, np.ndarray):
                try:
                    doc_topics = np.array(
                        [
                            np.array(row, dtype=float) if isinstance(row, list) else row
                            for row in doc_topics
                        ]
                    )
                except Exception as conversion_error:
                    self.logger.error(
                        f"Failed to convert doc_topics: {conversion_error}"
                    )
                    raise

            # Ensure 2D array
            if doc_topics.ndim == 1:
                doc_topics = doc_topics.reshape(-1, 1)

            # Verify dimensions match
            if doc_topics.shape[0] != len(chunks):
                self.logger.error(
                    f"Dimension mismatch: doc_topics shape {doc_topics.shape}, chunks length {len(chunks)}"
                )
                raise ValueError(
                    f"Mismatch between doc_topics rows ({doc_topics.shape[0]}) and chunks length ({len(chunks)})"
                )

            # Use a session to perform database operations
            with self.driver.session() as session:
                # Iterate through chunks and link to topics
                for chunk_idx, (chunk, topic_probs) in enumerate(
                    zip(chunks, doc_topics)
                ):
                    # Find the topic with maximum probability
                    max_topic = np.argmax(topic_probs)

                    # Check if current topic matches max probability topic
                    if max_topic == topic_idx:
                        # Query to find or create the chunk node and link to topic
                        link_chunk_query = """
                        MATCH (c:Chunk {chat_id: $chat_id, doc_id: $doc_id, text: $chunk_text})
                        MATCH (t:Topic {chat_id: $chat_id, doc_id: $doc_id, topic_id: $topic_id})
                        CREATE (c)-[:BELONGS_TO_TOPIC {relevance: $relevance}]->(t)
                        """

                        try:
                            session.run(
                                link_chunk_query,
                                chat_id=chat_id,
                                doc_id=doc_id,
                                chunk_text=chunk,
                                topic_id=str(topic_idx),
                                relevance=float(topic_probs[max_topic]),
                            )
                        except Exception as rel_error:
                            self.logger.error(
                                f"Failed to create relationship for chunk {chunk_idx}: {rel_error}"
                            )

                self.logger.info(
                    f"Linked chunks to topic {topic_idx} with keywords: {topic_keywords}"
                )

        except Exception as e:
            self.logger.error(f"Error linking chunks to topic: {str(e)}")
            raise

    def get_document_content(self, chat_id: str, doc_id: str) -> List[str]:
        """
        Retrieve document content chunks from Neo4j database

        Args:
            chat_id (str): Unique identifier for the chat
            doc_id (str): Unique identifier for the document

        Returns:
            List[str]: List of text chunks from the document
        """
        try:
            # Cypher query to fetch chunks
            cypher_query = """
            MATCH (c:Chunk)
            WHERE c.chat_id = $chat_id AND c.doc_id = $doc_id
            RETURN c.text
            """

            # Execute query using a session
            with self.driver.session() as session:
                result = session.run(cypher_query, chat_id=chat_id, doc_id=doc_id)
                chunks = [record["c.text"] for record in result]

            if not chunks:
                self.logger.warning(
                    f"No chunks found for chat_id {chat_id} and doc_id {doc_id}"
                )

            return chunks

        except Exception as e:
            self.logger.error(f"Error retrieving document content: {str(e)}")
            return []

    def compute_coherence(
        self, chat_id: str, doc_id: str, max_topics: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Compute topic coherence scores for different number of topics

        Args:
            chat_id (str): Unique identifier for the chat
            doc_id (str): Unique identifier for the document
            max_topics (int): Maximum number of topics to test

        Returns:
            List of tuples with number of topics and corresponding coherence score
        """
        # Retrieve document content
        docs = self.get_document_content(chat_id, doc_id)

        if not docs:
            self.logger.error("No documents found for coherence computation")
            return []

        try:
            # Preprocess documents
            preprocessed_docs = self.preprocessing.preprocess(docs)

            # Extract preprocessed texts with flexible handling
            if isinstance(preprocessed_docs, dict):
                # Try different keys for preprocessed texts
                possible_keys = ["texts", "preprocessed", "tokenized"]
                for key in possible_keys:
                    if key in preprocessed_docs:
                        preprocessed_texts = preprocessed_docs[key]
                        break
                else:
                    # Fallback: basic preprocessing
                    self.logger.warning(
                        "Could not find preprocessed texts. Falling back to basic preprocessing."
                    )
                    preprocessed_texts = [doc.lower().split() for doc in docs]
            elif isinstance(preprocessed_docs, list):
                preprocessed_texts = preprocessed_docs
            else:
                preprocessed_texts = [doc.lower().split() for doc in docs]

            # Create a dictionary from preprocessed documents
            dictionary = Dictionary(preprocessed_texts)

            coherence_scores = []
            for k in range(2, max_topics + 1):
                # Initialize and train FASTopic model
                model = FASTopic(k, self.preprocessing)
                model.fit_transform(docs)

                # Extract top words for each topic
                topic_top_words = model.get_top_words()

                # Flatten topic words
                topics = [[word for word in topic] for topic in topic_top_words]

                # Calculate coherence score
                cm = CoherenceModel(
                    topics=topics,
                    texts=preprocessed_texts,
                    dictionary=dictionary,
                    coherence="c_v",
                )
                coherence_scores.append((k, cm.get_coherence()))

            return coherence_scores

        except Exception as e:
            self.logger.error(f"Error computing coherence: {str(e)}")
            return []

    def generate_topics_with_best_k(
        self, chat_id: str, doc_id: str, max_topics: int = 10
    ):
        """
        Generate topics using the optimal number of topics based on coherence

        Args:
            chat_id (str): Unique identifier for the chat
            doc_id (str): Unique identifier for the document
            max_topics (int): Maximum number of topics to test
        """
        try:
            # Compute coherence scores
            coherence_scores = self.compute_coherence(chat_id, doc_id, max_topics)

            if not coherence_scores:
                self.logger.error("Could not compute coherence scores")
                return

            # Find the number of topics with the highest coherence score
            best_k = max(coherence_scores, key=lambda x: x[1])[0]

            self.logger.info(f"Best number of topics: {best_k}")
            self.logger.info(
                "Coherence Scores: "
                + ", ".join(
                    [f"{k} topics: {score:.4f}" for k, score in coherence_scores]
                )
            )

            # Generate topics with the best number of topics
            self.generate_topics(chat_id=chat_id, doc_id=doc_id, num_topics=best_k)

        except Exception as e:
            self.logger.error(f"Error generating topics with best K: {str(e)}")


# Example usage
# fastopic_modeler = FASTopicModel(
#     neo4j_uri="neo4j://localhost:7687",
#     neo4j_user="neo4j",
#     neo4j_password="12qwaszx"
# )

# try:
#     # Assuming pdf is already indexed with chat_id and doc_id
#     fastopic_modeler.generate_topics(chat_id="001", doc_id="001")
# finally:
#     fastopic_modeler.close()
