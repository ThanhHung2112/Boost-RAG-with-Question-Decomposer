# RAGSY - An Internal Knowledge-Based Chatbot with Enhanced Retrieval-Augmented Generation (RAG)

## Introduction
This repository presents an innovative approach to developing an internal knowledge-based chatbot using advanced Retrieval-Augmented Generation (RAG) techniques. The project addresses key limitations in traditional RAG architectures by introducing a novel semantic decomposition framework that significantly enhances information retrieval and response generation capabilities. The system is designed to provide accurate, contextually relevant responses by leveraging state-of-the-art natural language processing (NLP) models and intelligent retrieval strategies.

## Description
The chatbot system is built to handle complex user queries by decomposing them into granular sub-queries, enabling more comprehensive and precise information retrieval. The project integrates a hybrid retrieval method combining ColBERT and BM25 techniques to optimize retrieval performance. Additionally, a topic modeling approach using FASTopic is employed to efficiently cluster and retrieve data, making the system both powerful and practical for enterprise use.

Key features of the system include:
- **Semantic Query Decomposition**: Utilizes the T5 model and Sequence-to-Sequence architecture to break down complex queries into simpler sub-queries.
- **Hybrid Retrieval Method**: Combines ColBERT (for semantic matching) and BM25 (for keyword-based retrieval) to enhance the accuracy and relevance of retrieved information.
- **Topic Modeling**: Employs FASTopic for intelligent topic clustering, enabling faster and more efficient data retrieval.
- **Local Deployment**: The entire system is designed to run locally, ensuring data security and full control over the knowledge base, making it ideal for enterprise environments.

The system is particularly suited for organizations that require a secure, locally managed knowledge management solution. It provides a robust framework for building and maintaining an internal knowledge base, allowing businesses to leverage their proprietary data effectively.

## Key Components
1. **Query Decomposition Module**: Breaks down complex user queries into simpler, more manageable sub-queries.
2. **Hybrid Retrieval Engine**: Combines ColBERT and BM25 for optimized information retrieval.
3. **Topic Modeling with FASTopic**: Clusters data into topics for faster and more efficient retrieval.
4. **Local Deployment**: Ensures data security and full control over the knowledge base.

## Usage
The chatbot system is designed to be user-friendly, with a straightforward interface for querying the internal knowledge base. Users can interact with the chatbot to retrieve information, and administrators can easily update or modify the knowledge base as needed.

## Future Work
- Further optimization of retrieval algorithms for improved accuracy and speed.
- Expansion of the system's capabilities to handle more complex and diverse data sources.
- Enhanced topic modeling techniques for better clustering and retrieval.

This project represents a significant step forward in the development of intelligent, secure, and efficient knowledge management systems, offering a practical solution for enterprises looking to harness the power of AI for internal knowledge retrieval.
