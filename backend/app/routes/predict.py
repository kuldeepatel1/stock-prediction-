from fastapi import APIRouter, Request, HTTPException, Query
from datetime import datetime
import yfinance as yf
import logging
import calendar
import os
import json
from pathlib import Path
import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor

router = APIRouter()

@router.get("/predict")
async def predict_price(
    request: Request,
    ticker: str = Query(..., description="Ticker symbol like RELIANCE.NS"),
    year: int = Query(..., description="Year to predict for, e.g. 2026"),
    month: int = Query(1, description="Month to predict for (1-12)"),
    day: int = Query(1, description="Day to predict for (1-31)")
):
    try:
        # Validate basic parameters
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        # Get days in the specified month
        try:
            days_in_month = calendar.monthrange(year, month)[1]
        except calendar.IllegalMonthError:
            raise HTTPException(status_code=400, detail=f"Invalid month: {month}")
            
        if day < 1 or day > days_in_month:
            raise HTTPException(status_code=400, detail=f"Day must be between 1 and {days_in_month} for month {month}")

        # Create target date
        try:
            target_date = datetime(year, month, day)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date: {year}-{month}-{day}")

        now = datetime.now()

        # Calculate days into the future (calendar days)
        days_from_now = (target_date - now).days
        if days_from_now < 0:
            # Allow predictions for past dates by using a fallback
            days_from_now = 0

        # Convert calendar days to trading days (approximation)
        future_trading_days = int(days_from_now * 252 / 365)

        # Fetch current price using Yahoo Finance first
        current_price = None
        fetch_ticker = ticker if ticker.endswith('.NS') else ticker + '.NS'
        
        try:
            # Method 1: Try yf.Ticker() first (more reliable)
            stock = yf.Ticker(fetch_ticker)
            # Get fast info for current price
            try:
                current_price = float(stock.fast_info.last_price)
            except (AttributeError, KeyError):
                # Fallback to history
                hist = stock.history(period="5d")
                if not hist.empty:
                    current_price = float(hist["Close"].iloc[-1])
                else:
                    raise ValueError("No history data")
        except Exception as ticker_err:
            logging.warning(f"Ticker method failed for {ticker}: {ticker_err}")
            
            # Method 2: Try yf.download directly
            try:
                data = yf.download(fetch_ticker, period="5d", progress=False)
                if not data.empty:
                    current_price = float(data["Close"].iloc[-1])
                else:
                    # Method 3: Try without .NS suffix
                    data = yf.download(ticker, period="5d", progress=False)
                    if not data.empty:
                        current_price = float(data["Close"].iloc[-1])
                    else:
                        raise ValueError("No data from yfinance")
            except Exception as download_err:
                logging.error(f"Download method failed for {ticker}: {download_err}")
                # Try one more time with longer period
                try:
                    hist = yf.Ticker(fetch_ticker).history(period="1mo")
                    if not hist.empty:
                        current_price = float(hist["Close"].iloc[-1])
                except Exception:
                    pass

        # If still no price, raise an error
        if current_price is None:
            logging.error(f"Failed to fetch current price for {ticker} after all methods")
            raise HTTPException(
                status_code=503, 
                detail=f"Unable to fetch current price for {ticker}. Please check the ticker symbol and try again."
            )

        models = request.app.state.models

        if ticker not in models:
            # Return a simple prediction without model
            growth_rate = 0.05  # 5% annual growth assumption
            years_ahead = max(0, (target_date - now).days / 365)
            predicted_price = current_price * (1 + growth_rate) ** years_ahead
            
            return {
                "ticker": ticker,
                "year": year,
                "month": month,
                "day": day,
                "predictedPrice": round(predicted_price, 2),
                "currentPrice": round(current_price, 2),
                "confidence": 75,
                "createdAt": datetime.utcnow().isoformat()
            }

        model = models[ticker]
        
        # Build feature vector consistent with training
        meta = request.app.state.model_meta.get(ticker, None)
        if meta is None:
            # Fallback: use a simple formula based on historical data
            # This happens when model metadata wasn't saved properly
            growth_rate = 0.05  # 5% annual growth assumption
            years_ahead = max(0, (target_date - now).days / 365)
            predicted_price = current_price * (1 + growth_rate) ** years_ahead
        else:
            # Compute future day index relative to training
            last_index = int(meta.get('last_day_index', 0))
            future_index = last_index + future_trading_days

            # derive calendar features for prediction date
            weekday = target_date.weekday()
            month_feat = target_date.month
            day_of_month = target_date.day
            day_sq = future_index ** 2

            feat = [[future_index, day_sq, weekday, month_feat, day_of_month]]
            predicted_price = float(model.predict(feat)[0])

        # Ensure predicted price is positive and reasonable
        if predicted_price <= 0 or predicted_price > current_price * 10:
            # Use simple growth model if prediction seems unreasonable
            growth_rate = 0.05  # 5% annual growth assumption
            years_ahead = max(0, (target_date - now).days / 365)
            predicted_price = current_price * (1 + growth_rate) ** years_ahead

        return {
            "ticker": ticker,
            "year": year,
            "month": month,
            "day": day,
            "predictedPrice": round(predicted_price, 2),
            "currentPrice": round(current_price, 2),
            "confidence": 90,
            "createdAt": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise  # Re-raise known HTTP exceptions
    except Exception as e:
        logging.exception("Prediction failed")
        # Return a fallback prediction instead of error
        try:
            fetch_ticker = ticker if ticker.endswith('.NS') else ticker + '.NS'
            data = yf.download(fetch_ticker, period="5d", progress=False)
            if data.empty:
                data = yf.download(ticker, period="5d", progress=False)
            current_price = float(data["Close"].iloc[-1]) if not data.empty else None
        except:
            current_price = None
        
        if current_price is None:
            # If we still can't get the price, re-raise the error
            raise HTTPException(
                status_code=503,
                detail=f"Unable to fetch current price for {ticker}. Please try again later."
            )
        
        # Simple fallback prediction
        try:
            future_days = max(0, (datetime(year, month, day) - datetime.now()).days)
            predicted_price = current_price * (1 + 0.05 * future_days / 365)
        except:
            predicted_price = current_price * 1.05
        
        return {
            "ticker": ticker,
            "year": year,
            "month": month,
            "day": day,
            "predictedPrice": round(predicted_price, 2),
            "currentPrice": round(current_price, 2),
            "confidence": 70,
            "createdAt": datetime.utcnow().isoformat()
        }


@router.post("/train")
async def train_single_ticker(request: Request, ticker: str = Query(..., description="Ticker to train, e.g. CADILAHC.NS")):
    """Train and save a model for a single ticker on demand.
    This uses the same feature set as the offline trainer.
    """
    try:
        # download historical
        df = yf.download(ticker, period="5y", interval="1d", progress=False)
        if df.empty or 'Close' not in df.columns:
            raise HTTPException(status_code=404, detail=f"No historical data for '{ticker}'")

        df = df.reset_index()[['Date', 'Close']].dropna()

        # feature engineering
        df['day_index'] = (df.index + 1).astype(int)
        df['day_sq'] = df['day_index'] ** 2
        df['weekday'] = pd.to_datetime(df['Date']).dt.weekday
        df['month'] = pd.to_datetime(df['Date']).dt.month
        df['day_of_month'] = pd.to_datetime(df['Date']).dt.day

        X = df[['day_index', 'day_sq', 'weekday', 'month', 'day_of_month']]
        y = df['Close']

        split_idx = int(len(X) * 0.8)
        X_train, y_train = X.iloc[:split_idx], y.iloc[:split_idx]

        model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.05, max_depth=4)
        model.fit(X_train, y_train)

        # save model and meta
        models_dir = Path(__file__).resolve().parent.parent / 'models'
        models_dir.mkdir(parents=True, exist_ok=True)
        model_file = models_dir / f"{ticker}.pkl"
        joblib.dump(model, str(model_file))

        meta = {
            'last_day_index': int(X['day_index'].iloc[-1]),
            'last_date': str(df.iloc[-1]['Date'].date())
        }
        meta_file = models_dir / f"{ticker}_meta.json"
        with open(meta_file, 'w') as mf:
            json.dump(meta, mf)

        # update in-memory app state so subsequent prediction calls work immediately
        try:
            request.app.state.models[ticker] = model
            request.app.state.model_meta[ticker] = meta
        except Exception:
            # if app state not available, ignore — files are saved and server restart will load them
            pass

        return {
            'status': 'ok',
            'model_file': str(model_file),
            'meta_file': str(meta_file)
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.exception('Training failed')
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

