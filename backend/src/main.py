import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config.database import engine, Base
from src.routes import auth, contacts, hazards, alerts, ws

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Emergency Response Platform API")

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(hazards.router)
app.include_router(alerts.router)
app.include_router(ws.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Aegis Backend API is running"}
