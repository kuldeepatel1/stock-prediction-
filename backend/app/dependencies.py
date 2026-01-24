from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import joblib
import os

def load_all_models(model_dir: str) -> dict:
    models = {}
    for filename in os.listdir(model_dir):
        if filename.endswith(".pkl"):
            ticker = filename.replace(".pkl", "")
            path = os.path.join(model_dir, filename)
            try:
                models[ticker] = joblib.load(path)
            except Exception as e:
                print(f"[!] Failed to load model for {ticker}: {e}")
    return models

def create_app() -> FastAPI:
    app = FastAPI(title="Stock Prediction API")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Load all models once at startup
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    app.state.models = load_all_models(model_dir)

    return app
