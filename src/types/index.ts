export interface Company {
  ticker: string;
  name: string;
}

export interface HistoricalData {
  date: string;
  price: number;
}

export interface Prediction {
  ticker: string;
  year: number;
  month?: number;
  day?: number;
  predictedPrice: number;
  currentPrice: number;
  confidence: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  image_url?: string;
}
