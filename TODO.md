# Fix Current Price Display Issue

## Problem
The Current Price shows "₹1,500.00" instead of fetching real stock current price from the backend.

## Root Cause
The backend's yfinance API call fails or returns empty data, falling back to `current_price = 1500.0`

## Solution Implemented

### ✅ Step 1: Fix Backend `backend/app/routes/predict.py` - Improved current price fetching
- Added multiple fallback methods for fetching current price:
  1. yf.Ticker() with fast_info
  2. yf.Ticker().history() 
  3. yf.download() with .NS suffix
  4. yf.download() without .NS suffix
- Added proper error logging
- Added HTTPException instead of falling back to ₹1,500

### ✅ Step 2: Added new `/api/quote` endpoint in `backend/app/main.py`
- Created a dedicated endpoint to fetch current stock price
- Returns currentPrice, previousClose, change, changePercent
- Supports NSE stocks with automatic .NS suffix handling
- Multiple fallback methods for reliability

### ✅ Step 3: Updated Frontend `src/services/api.ts`
- Added `fetchCurrentPrice()` function to call the new quote endpoint
- Updated `fetchPrediction()` to properly handle errors
- Mock mode now returns realistic prices based on historical data

### ✅ Step 4: Updated `src/pages/Dashboard.tsx`
- Added `fetchCurrentPrice` import
- Added a new useQuery hook to fetch current price separately
- Added auto-refresh every 60 seconds
- Created `mergedPrediction` that uses the separately fetched current price
- Passes the correct current price to PredictionCard

## Testing
To test the fix:
1. Start the backend: `cd backend && python -m uvicorn app.main:app --reload`
2. Start the frontend: `npm run dev`
3. Select a stock like ICICIBANK.NS
4. Check that the Current Price now shows real stock price instead of ₹1,500.00

## Files Modified
1. `backend/app/routes/predict.py` - Enhanced current price fetching
2. `backend/app/main.py` - Added /api/quote endpoint
3. `src/services/api.ts` - Added fetchCurrentPrice function
4. `src/pages/Dashboard.tsx` - Added current price fetching and merging

