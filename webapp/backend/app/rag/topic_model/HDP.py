import re
import json
import numpy as np
from typing import List, Tuple, Union
import logging

# Probabilistic modeling libraries
from gensim.models import HdpModel
from gensim.corpora import Dictionary

# Neo4j libraries
from py2neo import Graph, Node, Relationship, NodeMatcher
import nltk
from nltk.corpus import stopwords

# Download the NLTK stopwords if not already done
nltk.download('stopwords', quiet=True)

class HDPTopicModeler:
    def __init__(self,
                 neo4j_uri="neo4j://localhost:7687",
                 neo4j_user="neo4j",
                 neo4j_password="12qwaszx"):
        """
        Initialize HDP Topic Modeler with Neo4j connection
        """
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Set up Neo4j connection
        try:
            self.graph = Graph(neo4j_uri, auth=(neo4j_user, neo4j_password))
            self.node_matcher = NodeMatcher(self.graph)
            self.logger.info("Successfully connected to Neo4j database")
        except Exception as e:
            self.logger.error(f"Failed to connect to Neo4j database: {str(e)}")
            raise

        # Initialize stopwords list
        self.stop_words = set(stopwords.words('english'))

    def _extract_topic_words(self, topic_input: Union[str, tuple]) -> List[str]:
        """
        Extract only words from topic representation

        Handles both string and tuple inputs
        """
        # Convert input to string if it's a tuple
        if isinstance(topic_input, tuple):
            topic_str = str(topic_input[1]) if len(topic_input) > 1 else str(topic_input)
        else:
            topic_str = str(topic_input)

        # Use regex to extract words
        words = re.findall(r'\*(\w+)', topic_str)

        # Fallback to splitting if regex fails
        if not words:
            words = re.findall(r'\b\w+\b', topic_str)

        return words[:10]  # Limit to top 10 words to prevent overload

    def _preprocess_chunks(self, chat_id: str, doc_id: str) -> Tuple[List[List[str]], Dictionary]:
        """
        Retrieve and preprocess document chunks for topic modeling
        """
        # Cypher query to fetch chunks
        cypher_query = """
        MATCH (c:Chunk)
        WHERE c.chat_id = $chat_id AND c.doc_id = $doc_id
        RETURN c.text
        """

        # Execute query
        results = self.graph.run(cypher_query, chat_id=chat_id, doc_id=doc_id)

        # Collect tokens
        all_tokens = []
        for record in results:
            # Tokenize the text
            text = record["c.text"]

            # Ensure text is a string
            if not isinstance(text, str):
                text = str(text)

            # Tokenize and clean
            tokens = text.lower().split()

            # Remove stopwords
            tokens = [token for token in tokens if token not in self.stop_words]

            # Filter out any empty or None tokens
            tokens = [token for token in tokens if token]

            if tokens:
                all_tokens.append(tokens)

        # Create dictionary
        dictionary = Dictionary(all_tokens)

        return all_tokens, dictionary

    def generate_topics(self, chat_id: str, doc_id: str, num_topics: int = 5):
        """
        Generate topics for a specific document using HDP
        """
        # Preprocess chunks
        tokens, dictionary = self._preprocess_chunks(chat_id, doc_id)

        # Check if we have enough tokens for topic modeling
        if not tokens:
            self.logger.warning("No tokens found for topic modeling")
            return

        # Convert tokens to bag-of-words corpus
        corpus = [dictionary.doc2bow(doc) for doc in tokens]

        # Train HDP model
        hdp_model = HdpModel(
            corpus=corpus,
            id2word=dictionary,
            max_chunks=num_topics
        )

        # Check if document node exists, create if not
        existing_doc = list(self.node_matcher.match("Document", chat_id=chat_id, doc_id=doc_id))
        if not existing_doc:
            document_node = Node("Document", chat_id=chat_id, doc_id=doc_id)
            self.graph.create(document_node)
        else:
            document_node = existing_doc[0]

        # Delete existing topic relationships
        delete_query = """
        MATCH (d:Document)-[r:HAS_TOPIC]->(t:Topic)
        WHERE d.chat_id = $chat_id AND d.doc_id = $doc_id
        DELETE r, t
        """
        self.graph.run(delete_query, chat_id=chat_id, doc_id=doc_id)

        # Extract and store topics
        topics = hdp_model.print_topics(num_topics=num_topics)

        for topic_idx, topic_input in enumerate(topics):
            # Extract only words
            topic_words = self._extract_topic_words(topic_input)

            # Create topic node
            topic_node = Node("Topic",
                              chat_id=chat_id,
                              doc_id=doc_id,
                              topic_id=str(topic_idx),
                              topic_words=', '.join(topic_words))

            # Create relationship between document and topic
            doc_topic_rel = Relationship(document_node, "HAS_TOPIC", topic_node)

            # Create in graph
            self.graph.create(topic_node)
            self.graph.create(doc_topic_rel)

            # Debug logging
            self.logger.info(f"Created topic node {topic_node} with words: {topic_words}")

            # Link chunks to topics
            self._link_chunks_to_topics(chat_id, doc_id, topic_idx, topic_words, topic_node)

    def _link_chunks_to_topics(self,
                            chat_id: str,
                            doc_id: str,
                            topic_idx: int,
                            topic_keywords: List[str],
                            topic_node: Node):
        """
        Link document chunks to topics based on word overlap
        """
        try:
            # Updated query to handle topic_keywords correctly
            query = """
            MATCH (c:Chunk)
            WHERE c.chat_id = $chat_id AND c.doc_id = $doc_id
            WITH c,
                [word IN split(lower(c.text), ' ') | word] AS chunk_tokens
            WITH c,
                $topic_keywords AS topic_keywords,
                size([keyword IN $topic_keywords WHERE keyword IN chunk_tokens]) AS overlap,
                size($topic_keywords) AS total_topic_keywords
            WITH c,
                toFloat(overlap) / toFloat(total_topic_keywords) AS relevance
            WHERE relevance > 0.3
            WITH c, relevance
            MATCH (t:Topic)
            WHERE t.chat_id = $chat_id
            AND t.doc_id = $doc_id
            AND t.topic_id = $topic_idx
            CREATE (c)-[r:BELONGS_TO_TOPIC {relevance: relevance}]->(t)
            RETURN count(r) AS relationships_created
            """


            # Execute the query
            result = self.graph.run(
                query,
                chat_id=chat_id,
                doc_id=doc_id,
                topic_keywords=topic_keywords,
                topic_idx=str(topic_idx)
            )
            relationships_created = result.evaluate()

            # Debug logging
            self.logger.info(f"Linked {relationships_created} chunks to topic {topic_idx} with keywords: {topic_keywords}")

        except Exception as e:
            self.logger.error(f"Error linking chunks to topic: {str(e)}")
            self.logger.error(f"Topic keywords: {topic_keywords}")
            self.logger.error(f"Topic index: {topic_idx}")
            raise

# Example usage
# hdp_modeler = HDPTopicModeler(
#     neo4j_uri="neo4j://localhost:7687",
#     neo4j_user="neo4j",
#     neo4j_password="12qwaszx"
# )

# # rag.index_pdf(pdf_path, chat_id, doc_id)
# # Generate topics for a specific document
# hdp_modeler.generate_topics(chat_id="001", doc_id="001")