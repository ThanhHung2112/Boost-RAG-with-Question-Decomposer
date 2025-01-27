from langdetect import detect

from fastapi.responses import JSONResponse
from rag.hybrid_retrieve.hybrid import HybridRetrieverWithNeo4j
import json
import shutil
# from rag.topic_model.LDA import LDATopicModelling
from rag.topic_model.HDP import HDPTopicModeler
from rag.topic_model.FAST import FASTopicModel
from question_decompose.question_decomposer import QuestionDecomposer
from llm.get_llm_response import generate_response, translate_message_based_llm
from helpers.text_standardize import format_conversation, remove_duplicate_contexts
from crawler.crawl_url import crawl_url_content
import os
from config import settings

colbert_path = settings.COLBERT_MODEL
neo4j_uri = settings.NEO4J_URI
neo4j_user = settings.NEO4J_USER
neo4j_password = settings.NEO4J_PASSWORD
decomposer_model_path = settings.DECOMPOSER_MODEL
device = settings.DEVICE

decomposer = QuestionDecomposer(model_path=decomposer_model_path, device=device)

fastopic_modeler = FASTopicModel(
    neo4j_uri=neo4j_uri, neo4j_user=neo4j_user, neo4j_password=neo4j_password
)

retriever = HybridRetrieverWithNeo4j(
    model_path=colbert_path,
    neo4j_uri=neo4j_uri,
    neo4j_user=neo4j_user,
    neo4j_password=neo4j_password,
)


def index_pdf(chatID: str, docID: str, pdf_path: str) -> dict:
    """Index a PDF file to the database and generate topics."""

    try:
        retriever.index_pdf(pdf_path=pdf_path, chat_id=chatID, doc_id=docID)
    except Exception as e:
        return JSONResponse({"Indexing failed": str(e)}, status_code=500)

    try:
        fastopic_modeler.generate_topics(chat_id=chatID, doc_id=docID)
    except Exception as e:
        return JSONResponse({"Topic Modelling failed": str(e)}, status_code=500)

    return {"status": "success"}



def index_url_content(chatID: str, docID: str, url: str) -> dict:
    """Index a URL content to the database."""
    md_path = "./markdown/full_content.md"
    content = crawl_url_content(url)

    try:
        retriever.index_markdown(md_path=md_path, chat_id=chatID, doc_id=docID)
        print("Indexing markdown content to Neo4j successful")
    except Exception as e:
        return JSONResponse({"Indexing markdown failed": str(e)}, status_code=500)

    try:
        fastopic_modeler.generate_topics_with_best_k(
            chat_id=chatID, doc_id=docID, max_topics=6
        )
        print("Topic Modelling successful")
    except Exception as e:
        return JSONResponse({"Topic Modelling failed": str(e)}, status_code=500)

    remove_folder("./markdown/")
    return {"status": "success"}


def remove_folder(folder_path: str) -> None:
    """Remove all files in the folder but not the folder itself."""
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)

    return

def remove_nodes_from_neo4j(chat_id: str, document_id: str = None) -> dict:
    """Remove nodes from Neo4j database based on chat_id."""
    retriever.remove_nodes(chat_id, document_id)
    return {"status": "success"}


def get_response(chatID: str, message: str, language: str, llm: str) -> str:
    """Get response from the LLM model."""
    # detect language
    message_language = detect(message)
    if message_language != "en":
        message = translate_message_based_llm(message)
    prompt = generate_prompt(chatID, message, language)
    print("=" * 10)
    print("Prompt:", prompt)
    print("=" * 10)
    response = generate_response(prompt, llm)

    return response


def truncate_contexts(contexts, max_tokens):
    """
    Truncate context sections to fit within token limit.

    Args:
        contexts (list): List of context sections
        max_tokens (int): Maximum number of tokens allowed

    Returns:
        list: Truncated context sections
    """
    truncated_contexts = []
    current_tokens = 0

    for context in contexts:
        context_tokens = len(context.split())  # Simple token estimation
        if current_tokens + context_tokens <= max_tokens:
            truncated_contexts.append(context)
            current_tokens += context_tokens
        else:
            break

    return truncated_contexts

def create_error_prompt(message, language):
    """
    Create a fallback prompt in case of critical errors.

    Args:
        message (str): Original user message
        language (str): Response language

    Returns:
        str: Error handling prompt
    """
    base_error_prompt = f"""
Unable to process the query: '{message}'

Please rephrase your question or try again later.
"""

    if language.lower() == "vi":
        base_error_prompt += "\nXin vui lòng diễn đạt lại câu hỏi hoặc thử lại sau."

    return base_error_prompt

def generate_prompt(chatID: str, message: str, language: str = "en") -> str:
    """
    Generates a structured prompt for the chatbot based on retrieved context and user message.

    Args:
        chatID (str): The chat session identifier
        message (str): The user's question or message
        language (str): Language for response (default: English)

    Returns:
        str: Formatted prompt for the chatbot
    """
    history_conversation = format_conversation(chatID)
    # Decompose message into sub-questions
    sub_questions = decomposer(message)
    sub_questions.append(message)
    # Number of top results to retrieve
    K = 10

    # Retrieve contexts with deduplication
    contexts = []
    unique_contexts = set()  # Set to track unique contexts
    if not any("bachelor" in sub_question.lower() for sub_question in sub_questions):
        for i, sub_question in enumerate(sub_questions, 1):
            print("Sub-question",sub_question)
            # Retrieve chunks similar to the sub-question
            retrieved_chunks = retriever.find_similar_chunks(query=sub_question, chat_id=chatID, top_k=K)
            # retrieved_chunks = retriever.topic_retrieve(query=sub_question, chat_id=chatID, top_k=K)
            print(retrieved_chunks)
            # Format retrieved chunks with deduplication
            for j, (chunk, _) in enumerate(retrieved_chunks, 1):
                # Create a normalized version of the chunk for comparison
                normalized_chunk = chunk.strip().lower()

                # Only add if the chunk is not already in unique contexts
                if normalized_chunk not in unique_contexts:
                    context_section = f"INFORMATION {i}.{j}:\n{chunk}"
                    contexts.append(context_section)
                    unique_contexts.add(normalized_chunk)

            # Optional logging
            with open(f"log_{chatID}.txt", "w") as f:
                f.write(str(contexts))

    # Add special context for "Bachelor of Engineering"
    if any("bachelor" in sub_question.lower() for sub_question in sub_questions):
        special_context = """
INFORMATION X.1:
4. How does the Bachelor system differ from the Engineering system in Data Science & AI?
The Engineering program has a longer duration compared to the Bachelor program.
The Engineering program includes more project-based courses than the Bachelor program.
If continuing to a Master's degree:
Students with a Bachelor's degree need 2 years to complete the program.
Students with an Engineering degree only need 1 year.
"""
        contexts.append(special_context)

    # Truncate contexts if needed (optional)
    max_tokens = 2000  # Adjust based on your requirements
    contexts = truncate_contexts(contexts, max_tokens)

    # System prompt remains the same as in the original code
    system_prompt = """
YOUR NAME is RAGSY, an AI assistant. You are tasked with answering user questions based on the provided information. Follow these guidelines:

1. You are an AI assistant. Use the provided information and the context of the conversation to answer questions whenever applicable.
2. If the required information is not provided, and the user's query is factual or specific, respond that you cannot answer the question.
3. For casual or general user statements (e.g., greetings, expressions of boredom), respond naturally and appropriately without referencing the provided information.
4. Avoid meta-comments like "Based on the context" or "I can answer your question."
5. Do not use external knowledge or make assumptions beyond the given information.
6. Provide clear, concise, and context-specific answers. Do not restate the question unless necessary.
7. If multiple contexts contain relevant information, synthesize them and explicitly cite the context sections used (e.g., "According to INFORMATION 1 and INFORMATION 2...").

Use the conversation history to:
- Maintain coherence and continuity in responses.
- Understand the user's intent from prior interactions.

When responding:
- Be specific, factual, and directly relevant to the user's question.
- Engage naturally, as though you are a human conversational partner.
- Avoid drawing attention to the process or limitations unless explicitly required.
- Don't let human know you was given contexts to answer the question (do not say "Based on the context..."). You can say "as provided in the information" Never mention "INFORMATION 1" or "INFORMATION 2" in your response.

When the user makes casual remarks or greetings:
- Respond in a friendly, conversational tone without referencing the information retrieval process.

### Conversation History
The conversation history so far is:
{history_conversation}

now let continue the conversation with the user
bot:
"""

    # Language-specific modifications
    if language.lower() == "vi":
        system_prompt += "\nPlease answer the question in Vietnamese.\nGiờ hãy trả lời câu hỏi bằng tiếng việt cho tôi nhé"

    # Combine elements into final prompt
    final_prompt = f"""{chr(10).join(contexts)}

{system_prompt.format(history_conversation=history_conversation)}"""

    return final_prompt
