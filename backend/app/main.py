from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import yfinance as yf
import os
import json
import joblib

from app.routes.predict import router as predict_router  # Your predict.py router

# --------------------------------------
# Initialize the FastAPI app
# --------------------------------------
app = FastAPI()

# Enable CORS (for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stock-price-prediction-system-lemon.vercel.app",
        "http://localhost:5173"  # optional: dev mode
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------
# Load all trained models from /models/
# --------------------------------------
models_dir = os.path.join(os.path.dirname(__file__), "models")
models = {}
model_meta = {}
if os.path.exists(models_dir):
    for filename in os.listdir(models_dir):
        if filename.endswith(".pkl"):
            try:
                model_path = os.path.join(models_dir, filename)
                ticker = filename.replace(".pkl", "")
                models[ticker] = joblib.load(model_path)
                # try load accompanying metadata
                meta_file = os.path.join(models_dir, f"{ticker}_meta.json")
                if os.path.exists(meta_file):
                    try:
                        with open(meta_file, 'r') as mf:
                            model_meta[ticker] = json.load(mf)
                    except Exception:
                        print(f"Warning: failed to load meta for {ticker}")
            except Exception as e:
                print(f"Warning: failed to load model {filename} — {e}")
else:
    print("Warning: models directory not found")


# Save to app state
app.state.models = models
app.state.model_meta = model_meta


# --------------------------------------
# Include route handlers
# --------------------------------------
app.include_router(predict_router, prefix="/api")

# --------------------------------------
# Pydantic schema for response
# --------------------------------------
class PredictionResponse(BaseModel):
    ticker: str
    year: int
    predicted_price: float


# --------------------------------------
# API: Get Companies List
# --------------------------------------
@app.get("/api/companies")
def get_companies():
    data_path = os.path.join(os.path.dirname(__file__), "data", "companies.json")
    try:
        with open(data_path, "r") as f:
            companies = json.load(f)
        return companies
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="companies.json not found")


# --------------------------------------
# API: Get Historical Stock Data
# --------------------------------------
@app.get("/api/historical")
def get_historical(ticker: str):
    try:
        df = yf.Ticker(ticker).history(period="5y")["Close"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch historical data: {str(e)}")

    records = [
        {"date": idx.strftime("%Y-%m-%d"), "close": float(val)}
        for idx, val in df.items()
    ]
    return records


# --------------------------------------
# API: Get Current Stock Price (Quote)
# --------------------------------------
@app.get("/api/quote")
def get_quote(ticker: str):
    """
    Fetch current stock price for a given ticker.
    Supports NSE stocks (with or without .NS suffix).
    """
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker symbol is required")
    
    # Ensure ticker has .NS suffix for NSE stocks
    fetch_ticker = ticker if ticker.endswith('.NS') else ticker + '.NS'
    
    current_price = None
    previous_close = None
    change = None
    change_percent = None
    
    try:
        # Method 1: Try yf.Ticker() with fast_info
        stock = yf.Ticker(fetch_ticker)
        
        try:
            current_price = float(stock.fast_info.last_price)
            previous_close = float(stock.fast_info.previous_close)
        except (AttributeError, KeyError, TypeError):
            # Method 2: Fallback to history
            hist = stock.history(period="5d")
            if not hist.empty:
                current_price = float(hist["Close"].iloc[-1])
                if len(hist) > 1:
                    previous_close = float(hist["Close"].iloc[-2])
            
        if current_price is None:
            # Method 3: Try yf.download
            data = yf.download(fetch_ticker, period="5d", progress=False)
            if not data.empty:
                current_price = float(data["Close"].iloc[-1])
                if len(data) > 1:
                    previous_close = float(data["Close"].iloc[-2])
            else:
                # Try without .NS suffix
                data = yf.download(ticker, period="5d", progress=False)
                if not data.empty:
                    current_price = float(data["Close"].iloc[-1])
                    if len(data) > 1:
                        previous_close = float(data["Close"].iloc[-2])
        
        # Calculate change
        if current_price is not None and previous_close is not None:
            change = round(current_price - previous_close, 2)
            change_percent = round((change / previous_close) * 100, 2)
        
        if current_price is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Unable to fetch quote for {ticker}. Please check the ticker symbol."
            )
        
        return {
            "ticker": ticker,
            "currentPrice": current_price,
            "previousClose": previous_close,
            "change": change,
            "changePercent": change_percent,
            "currency": "INR",
            "exchange": "NSE" if fetch_ticker.endswith('.NS') else "Unknown"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quote: {str(e)}")


# --------------------------------------
# API: Legacy Simple Prediction (optional fallback)
# --------------------------------------
@app.get("/api/predict-simple", response_model=PredictionResponse)
def predict_price(ticker: str, year: int):
    models = app.state.models
    if ticker not in models:
        raise HTTPException(status_code=404, detail=f"No model found for ticker '{ticker}'")

    model = models[ticker]

    try:
        # Adjust this feature engineering as per training
        future_days = (year - 2024) * 252
        pred = model.predict([[future_days]])[0]
    except Exception:
        raise HTTPException(status_code=500, detail="Model prediction failed")

    return PredictionResponse(
        ticker=ticker,
        year=year,
        predicted_price=round(float(pred), 2)
    )

@app.get("/")
def root():
    return {"status": "Backend is running"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

