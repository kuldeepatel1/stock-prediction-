import os
import json
import yfinance as yf
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
import joblib

DATA_FILE = "app/data/companies.json"
MODEL_DIR = "app/models"


def load_companies():
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def make_features(df):
    # df must have a Date column (datetime) and Close
    df = df.copy()
    df['date'] = pd.to_datetime(df['Date']).dt.date
    df['day_index'] = (df.index + 1).astype(int)
    df['day_sq'] = df['day_index'] ** 2
    df['weekday'] = pd.to_datetime(df['Date']).dt.weekday
    df['month'] = pd.to_datetime(df['Date']).dt.month
    df['day_of_month'] = pd.to_datetime(df['Date']).dt.day

    features = df[['day_index', 'day_sq', 'weekday', 'month', 'day_of_month']]
    return features, df['Close']


def train_model_for_company(ticker):
    print(f"[+] Training model for: {ticker}")
    try:
        df = yf.download(ticker, period="5y", interval="1d", progress=False)

        if df.empty or 'Close' not in df.columns:
            print(f"[-] No data for {ticker}")
            return

        df = df.reset_index()[['Date', 'Close']].dropna()

        X, y = make_features(df)

        # Time-series split (no shuffling)
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.05, max_depth=4)
        model.fit(X_train, y_train)

        os.makedirs(MODEL_DIR, exist_ok=True)
        model_file = os.path.join(MODEL_DIR, f"{ticker}.pkl")
        joblib.dump(model, model_file)

        # Save metadata needed for future predictions (last index and last date)
        last_row = df.iloc[-1]
        meta = {
            "last_day_index": int(X['day_index'].iloc[-1]),
            "last_date": str(last_row['Date'].date())
        }
        meta_file = os.path.join(MODEL_DIR, f"{ticker}_meta.json")
        with open(meta_file, 'w') as mf:
            json.dump(meta, mf)

        print(f"[✓] Model saved: {model_file}")
        print(f"[✓] Meta saved: {meta_file}")

    except Exception as e:
        print(f"[!] Error training {ticker}: {e}")


def main():
    companies = load_companies()
    for company in companies:
        train_model_for_company(company["ticker"])


if __name__ == "__main__":
    main()
