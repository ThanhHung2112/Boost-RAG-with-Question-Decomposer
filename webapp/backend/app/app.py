from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import job_router
import uvicorn
from retriever import init_retriever  # Import the init function
from fastopic_modeler import init_fastopic_modeler  # Import the init function

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# @app.on_event("startup")
# async def startup_event():
#     init_retriever()  # Initialize the retriever here
#     init_fastopic_modeler()

app.include_router(job_router, prefix="/jobs", tags=["jobs"])