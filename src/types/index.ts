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

export interface WalletStock {
  ticker: string;
  name: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
}

// export interface StockMetrics {
//   ticker: string;
//   netProfitGrowth: number;        // Percentage growth in net profit (QoQ)
//   shareholderReturn: number;      // 3-year return to shareholders
//   revenueCAGR: number;            // Compounded Annual Growth Rate of revenue
//   lastUpdated: string;
// }
