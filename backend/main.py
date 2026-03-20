from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import models
from routes import users, exercises

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Academia App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(exercises.router)


@app.get("/")
def root():
    return {"message": "Academia App API rodando"}
