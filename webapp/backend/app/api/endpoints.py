from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
import base64
import json
from datetime import datetime
from fastapi import APIRouter, UploadFile, Form
from typing import Optional
import rq
from redis import Redis
from dotenv import load_dotenv
import os
from typing import List, Literal

from llm.naming_conversation import get_conversation_name
from helpers.services import index_pdf, remove_nodes_from_neo4j, index_url_content
from typing import Optional
from helpers.services import get_response

LANGUAGES = Literal["vi", "en"]
TOPIC_MODEL = Literal["LDA", "HDP", "FASTopic"]
LLM = Literal["gemma2:9b", "gemma2:2b", "mistral-nemo", "gemma2:27b"]
load_dotenv()

job_router = APIRouter()
redis_conn = Redis(socket_timeout=500)
queue = rq.Queue("default", connection=redis_conn)

os.makedirs("./pdfs", exist_ok=True)


@job_router.get(
    "/get-conversation-name", description="Get the name of the conversation"
)
async def conversation_name(message: str = None):
    try:
        conversation_name = get_conversation_name(message)
        return JSONResponse({"conversation_name": conversation_name}, status_code=200)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@job_router.post("/index-pdf", description="Index a PDF file to the database")
async def index_pdf_to_neoj4(
    chatID: str = Form(...),
    docID: str = Form(...),
    file: UploadFile = None,
    url: str = Form(None),
    base64_file: str = Form(None),
    is_base64: bool = Form(False),
    topic_model: TOPIC_MODEL = "FASTopic",
    number_of_topics: int = Form(None),
    language: LANGUAGES = "en",
):

    try:
        if is_base64 and base64_file:
            file_content = base64.b64decode(base64_file)
            file_name = "base64_uploaded.pdf"
        elif file:
            file_content = await file.read()
            file_name = file.filename

            pdf_path = os.path.join("./app/pdfs", f"{chatID}_{docID}_{file_name}")
            with open(pdf_path, "wb") as pdf_file:
                pdf_file.write(file_content)

            index_pdf_job = queue.enqueue(
                index_pdf, chatID, docID, pdf_path, job_timeout=3600
            )

            return JSONResponse(
                {"job_id": index_pdf_job.get_id()},
                status_code=200,
            )

        elif url:
            print(1)
            index_url_content_job = queue.enqueue(
                index_url_content, chatID, docID, url, job_timeout=3600
            )

            return JSONResponse(
                {"job_id": index_url_content_job.get_id()},
                status_code=200,
            )

        else:
            return JSONResponse({"error": "Please provide a file"}, status_code=400)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@job_router.post("/index-data-priority", description="Index a PDF file to the database")
async def index_pdf_to_neoj4(
    chatID: str = Form(...),
    docID: str = Form(...),
    file: UploadFile = None,
    url: str = Form(None),
    base64_file: str = Form(None),
    is_base64: bool = Form(False),
    topic_model: TOPIC_MODEL = "FASTopic",
    number_of_topics: int = Form(None),
    language: LANGUAGES = "en",
):

    try:
        if is_base64 and base64_file:
            file_content = base64.b64decode(base64_file)
            file_name = "base64_uploaded.pdf"
        elif file:
            file_content = await file.read()
            file_name = file.filename

            pdf_path = os.path.join("./app/pdfs", f"{chatID}_{docID}_{file_name}")
            with open(pdf_path, "wb") as pdf_file:
                pdf_file.write(file_content)

            result = index_pdf(chatID=chatID, docID=docID, pdf_path=pdf_path)

            return JSONResponse(
                {"status": "success"},
                status_code=200,
            )

        elif url:
            print("index from url")
            index_url_content(chatID=chatID, docID=docID, url=url)

            return JSONResponse(
                {"status": "success"},
                status_code=200,
            )

        else:
            return JSONResponse({"error": "Please provide a file"}, status_code=400)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@job_router.get(
    "/index-pdf-status", description="Get the status of the PDF indexing job"
)
async def index_pdf_status(job_id: str):
    try:
        job = queue.fetch_job(job_id)
        if job:
            return JSONResponse({"status": job.get_status()}, status_code=200)
        else:
            return JSONResponse({"error": "Job not found"}, status_code=404)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@job_router.delete(
    "/remove-document", description="Remove nodes from Neo4j database based on chat_id"
)
async def remove_document(chat_id: str, document_id: Optional[str] = None):
    try:
        if not document_id:
            os.remove(f"./app/json/history_{chat_id}.json")
        # Remove document from Neo4j
        remove_nodes_from_neo4j(chat_id, document_id)
        return JSONResponse({"status": "success"}, status_code=200)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@job_router.get("/get_response", description="Get the response of the PDF indexing job")
async def get_chat_response(
    chatID: str, llm: LLM = "gemma2:27b", language: LANGUAGES = "en", message: str = None
):
    try:
        os.makedirs("./app/json", exist_ok=True)
        history_file = f"./app/json/history_{chatID}.json"

        if os.path.exists(history_file):
            with open(history_file, "r") as file:
                chat_history = json.load(file)
        else:
            chat_history = {}

        user_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        chat_history[user_datetime] = {"user": message}
        with open(history_file, "w") as file:
            json.dump(chat_history, file, indent=4)

        # Call the function to get a response
        response_message = get_response(chatID=chatID, message=message, language=language, llm=llm)

        bot_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        chat_history[bot_datetime] = {"bot": response_message}

        # Save updated history back to the file
        with open(history_file, "w") as file:
            json.dump(chat_history, file, indent=4)

        return JSONResponse({"response": response_message}, status_code=200)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)