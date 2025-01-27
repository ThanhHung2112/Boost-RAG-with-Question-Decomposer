import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

API_HOST = os.getenv("API_HOST", "localhost")
API_HOST = os.getenv("API_PORT", 8000)
DEBUG = os.getenv("DEBUG", True)

if __name__ == "__main__":
    uvicorn.run("app:app", host="localhost", port=8000, reload=True)

    # from celery_app import celery_app # This imports and registers the task
    # celery_app.worker_main(['worker', '--loglevel=INFO'])