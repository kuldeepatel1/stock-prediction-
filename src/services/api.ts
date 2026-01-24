// src/services/api.ts

import type { Company, HistoricalData, Prediction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


/**
 * Helper: call your FastAPI backend at `${API_BASE_URL}${path}`,
 * or fall back to the provided mock generator if no API_BASE_URL is set.
 */
async function callOrMock<T>(path: string, mockFn: () => T): Promise<T> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) {
      throw new Error(`API error (${res.status}): ${res.statusText}`);
    }
    return res.json();
  } else {
    // Simulate network latency in dev/mock mode
    await new Promise((r) => setTimeout(r, 500));
    return mockFn();
  }
}

// ——————————————————————————————————————————————
// Mock data & generators
// ——————————————————————————————————————————————

const mockCompanies: Company[] = [
  { ticker: 'RELIANCE', name: 'Reliance Industries Limited' },
  { ticker: 'TCS',      name: 'Tata Consultancy Services Limited' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Limited' },
  { ticker: 'INFY',     name: 'Infosys Limited' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever Limited' },
  { ticker: 'ICICIBANK',  name: 'ICICI Bank Limited' },
  { ticker: 'KOTAKBANK',  name: 'Kotak Mahindra Bank Limited' },
  { ticker: 'LT',         name: 'Larsen & Toubro Limited' },
  { ticker: 'SBIN',       name: 'State Bank of India' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel Limited' },
  { ticker: 'ASIANPAINT', name: 'Asian Paints Limited' },
  { ticker: 'MARUTI',     name: 'Maruti Suzuki India Limited' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance Limited' },
  { ticker: 'HCLTECH',    name: 'HCL Technologies Limited' },
  { ticker: 'AXISBANK',   name: 'Axis Bank Limited' },
  { ticker: 'ITC',        name: 'ITC Limited' },
  { ticker: 'WIPRO',      name: 'Wipro Limited' },
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement Limited' },
  { ticker: 'NESTLEIND',  name: 'Nestlé India Limited' },
  { ticker: 'TITAN',      name: 'Titan Company Limited' },
  { ticker: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Limited' },
  { ticker: 'POWERGRID',  name: 'Power Grid Corporation of India Limited' },
  { ticker: 'NTPC',       name: 'NTPC Limited' },
  { ticker: 'BAJAJFINSV', name: 'Bajaj Finserv Limited' },
  { ticker: 'DRREDDY',    name: 'Dr. Reddys Laboratories Limited' },
  { ticker: 'SUNPHARMA',  name: 'Sun Pharmaceutical Industries Limited' },
  { ticker: 'TECHM',      name: 'Tech Mahindra Limited' },
  { ticker: 'ONGC',       name: 'Oil and Natural Gas Corporation Limited' },
  { ticker: 'TATASTEEL',  name: 'Tata Steel Limited' },
  { ticker: 'JSWSTEEL',   name: 'JSW Steel Limited' },
  { ticker: 'HINDALCO',   name: 'Hindalco Industries Limited' },
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank Limited' },
  { ticker: 'CIPLA',      name: 'Cipla Limited' },
  { ticker: 'GRASIM',     name: 'Grasim Industries Limited' },
  { ticker: 'BRITANNIA',  name: 'Britannia Industries Limited' },
  { ticker: 'COALINDIA',  name: 'Coal India Limited' },
  { ticker: 'EICHERMOT',  name: 'Eicher Motors Limited' },
  { ticker: 'BPCL',       name: 'Bharat Petroleum Corporation Limited' },
  { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp Limited' },
  { ticker: 'DIVISLAB',   name: 'Divis Laboratories Limited' },
  // …add up to 250 entries total…
];

const generateHistoricalData = (ticker: string): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5);
  let basePrice = Math.random() * 2000 + 500;

  for (let i = 0; i < 1825; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const volatility = (Math.random() - 0.5) * 0.1;
    basePrice = Math.max(10, basePrice * (1 + volatility));

    if (ticker === 'TCS' || ticker === 'INFY') {
      basePrice *= 1.0002;
    } else if (ticker === 'RELIANCE') {
      basePrice *= 1.0001;
    }

    data.push({
      date: date.toISOString().split('T')[0],
      price: Number(basePrice.toFixed(2)),
    });
  }

  // Return weekly samples to reduce noise
  return data.filter((_, idx) => idx % 7 === 0);
};

const generatePrediction = (
  ticker: string,
  year: number,
  month: number,
  day: number,
  historicalData: HistoricalData[]
): Prediction => {
  const lastPrice = historicalData[historicalData.length - 1]?.price || 1000;
  
  // Calculate exact days from now to target date
  const now = new Date();
  const targetDate = new Date(year, month - 1, day);
  const daysFromNow = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const tradingDaysFromNow = Math.max(0, Math.floor(daysFromNow * 252 / 365));
  
  const growthRate = Math.random() * 0.15 + 0.05;
  const volatility = (Math.random() - 0.5) * 0.3;
  const predictedPrice =
    lastPrice * Math.pow(1 + growthRate, tradingDaysFromNow / 252) * (1 + volatility);

  return {
    ticker,
    year,
    month,
    day,
    predictedPrice: Number(predictedPrice.toFixed(2)),
    currentPrice: lastPrice,
    confidence: Math.floor(Math.random() * 30 + 70),
    createdAt: new Date().toISOString(),
  };
};

// ——————————————————————————————————————————————
// Exported API functions
// ——————————————————————————————————————————————

/**
 * Fetch the list of top-250 companies
 */
export const fetchCompanies = (): Promise<Company[]> =>
  callOrMock('/api/companies', () => mockCompanies);

/**
 * Fetch 5 years of historical closing prices for `ticker`
 */
export const fetchHistoricalData = (
  ticker: string
): Promise<HistoricalData[]> =>
  callOrMock(
    `/api/historical?ticker=${encodeURIComponent(ticker)}`,
    () => generateHistoricalData(ticker)
  );

/**
 * Fetch a predicted price for `ticker` in `year`, `month`, and `day`
 */
export const fetchPrediction = (
  ticker: string,
  year: number,
  month: number,
  day: number
): Promise<Prediction> =>
  callOrMock(
    `/api/predict?ticker=${encodeURIComponent(ticker)}&year=${year}&month=${month}&day=${day}`,
    () => generatePrediction(ticker, year, month, day, generateHistoricalData(ticker))
  );
