import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Tag
} from 'lucide-react';

import LoadingSpinner from '../components/LoadingSpinner';
import { fetchCompanies, fetchHistoricalData } from '../services/api';
import type { Company, HistoricalData } from '../types';

// Type for wallet stock holding
export interface WalletStock {
  ticker: string;
  name: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
}

// Helper to format currency
const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const WalletPage: React.FC = () => {
  // Portfolio state
  const [portfolio, setPortfolio] = useState<WalletStock[]>([]);
  
  // Add stock form state
  const [selectedTicker, setSelectedTicker] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [buyPrice, setBuyPrice] = useState<number | ''>(0);

  // Load companies
  const { data: companies, isLoading: companiesLoading } = useQuery<Company[], Error>({
    queryKey: ['companies'],
    queryFn: fetchCompanies
  });

  // Load portfolio from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('wallet');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPortfolio(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setPortfolio([]);
      }
    }
  }, []);

  // Fetch current prices for all stocks in portfolio
  const portfolioWithPrices = useMemo(() => {
    return portfolio.map(stock => ({
      ...stock,
      currentPrice: 0, // Will be populated by useQuery
      loading: true
    }));
  }, [portfolio]);

  // Get unique tickers from portfolio
  const portfolioTickers = useMemo(() => {
    return [...new Set(portfolio.map(s => s.ticker))];
  }, [portfolio]);

  // Fetch current prices for each stock
  const priceQueries = useMemo(() => {
    const queries: Record<string, { data: HistoricalData[] | undefined; isLoading: boolean }> = {};
    portfolioTickers.forEach(ticker => {
      // We'll use a custom hook approach here - for each ticker, we'll fetch the latest price
      queries[ticker] = { data: undefined, isLoading: true };
    });
    return queries;
  }, [portfolioTickers]);

  // For simplicity, we'll fetch historical data for each portfolio stock
  // and get the latest price
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const prices: Record<string, number> = {};
      for (const stock of portfolio) {
        try {
          const data = await fetchHistoricalData(stock.ticker);
          if (data && data.length > 0) {
            prices[stock.ticker] = data[data.length - 1].price;
          } else {
            prices[stock.ticker] = stock.buyPrice; // Fallback to buy price
          }
        } catch (e) {
          prices[stock.ticker] = stock.buyPrice; // Fallback to buy price
        }
      }
      setCurrentPrices(prices);
    };

    if (portfolio.length > 0) {
      fetchPrices();
    }
  }, [portfolio]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;

    portfolio.forEach(stock => {
      const qty = stock.quantity;
      const buyP = stock.buyPrice;
      const currentP = currentPrices[stock.ticker] || buyP;
      
      totalInvested += qty * buyP;
      totalCurrentValue += qty * currentP;
    });

    const totalProfitLoss = totalCurrentValue - totalInvested;
    const returns = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      returns
    };
  }, [portfolio, currentPrices]);

  // Selected company for auto-fill
  const selectedCompany = companies?.find(c => c.ticker === selectedTicker);

  // Auto-fill buy price when selecting a stock
  useEffect(() => {
    if (selectedTicker && currentPrices[selectedTicker]) {
      setBuyPrice(currentPrices[selectedTicker]);
    }
  }, [selectedTicker, currentPrices]);

  // Add stock to portfolio
  const addToPortfolio = () => {
    if (!selectedTicker || !quantity || !buyPrice || quantity <= 0 || buyPrice <= 0) {
      return;
    }

    const company = companies?.find(c => c.ticker === selectedTicker);
    if (!company) return;

    const newStock: WalletStock = {
      ticker: selectedTicker,
      name: company.name,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
      buyDate: new Date().toISOString().split('T')[0]
    };

    // Check if stock already exists, update quantity if so
    const existingIndex = portfolio.findIndex(s => s.ticker === selectedTicker);
    let updatedPortfolio;

    if (existingIndex >= 0) {
      updatedPortfolio = [...portfolio];
      const existing = updatedPortfolio[existingIndex];
      // Calculate weighted average buy price
      const totalShares = existing.quantity + newStock.quantity;
      const totalValue = (existing.quantity * existing.buyPrice) + (newStock.quantity * newStock.buyPrice);
      updatedPortfolio[existingIndex] = {
        ...existing,
        quantity: totalShares,
        buyPrice: totalValue / totalShares
      };
    } else {
      updatedPortfolio = [...portfolio, newStock];
    }

    setPortfolio(updatedPortfolio);
    localStorage.setItem('wallet', JSON.stringify(updatedPortfolio));

    // Reset form
    setSelectedTicker('');
    setQuantity(1);
    setBuyPrice('');
  };

  // Remove stock from portfolio
  const removeFromPortfolio = (ticker: string) => {
    const updatedPortfolio = portfolio.filter(s => s.ticker !== ticker);
    setPortfolio(updatedPortfolio);
    localStorage.setItem('wallet', JSON.stringify(updatedPortfolio));
  };

  if (companiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">My Wallet</h1>
            <p className="text-gray-600">Track your stock portfolio</p>
          </div>
        </div>
        <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
          Back to Dashboard
        </Link>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Current Value */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Value</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(portfolioMetrics.totalCurrentValue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total portfolio value</p>
        </div>

        {/* Total Invested */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Invested Amount</span>
            <Briefcase className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(portfolioMetrics.totalInvested)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total amount invested</p>
        </div>

        {/* Total Profit/Loss */}
        <div className={`p-6 rounded-xl border shadow-sm ${
          portfolioMetrics.totalProfitLoss >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${
              portfolioMetrics.totalProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              Profit / Loss
            </span>
            {portfolioMetrics.totalProfitLoss >= 0 ? (
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${
            portfolioMetrics.totalProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {portfolioMetrics.totalProfitLoss >= 0 ? '+' : ''}
            {formatCurrency(portfolioMetrics.totalProfitLoss)}
          </p>
          <p className={`text-xs ${
            portfolioMetrics.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
          } mt-1`}>
            {formatCurrency(portfolioMetrics.totalProfitLoss)}
          </p>
        </div>

        {/* Returns */}
        <div className={`p-6 rounded-xl border shadow-sm ${
          portfolioMetrics.returns >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${
              portfolioMetrics.returns >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              Returns
            </span>
            {portfolioMetrics.returns >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${
            portfolioMetrics.returns >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {portfolioMetrics.returns >= 0 ? '+' : ''}{portfolioMetrics.returns.toFixed(2)}%
          </p>
          <p className={`text-xs ${
            portfolioMetrics.returns >= 0 ? 'text-green-600' : 'text-red-600'
          } mt-1`}>
            {portfolioMetrics.returns >= 0 ? 'Profit' : 'Loss'}
          </p>
        </div>
      </div>

      {/* Add Stock Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-primary-600" />
          Add Stock to Portfolio
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stock Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Select Stock</label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a stock</option>
              {companies?.map((c) => (
                <option key={c.ticker} value={c.ticker}>
                  {c.ticker} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              min={1}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              placeholder="1"
            />
          </div>

          {/* Buy Price */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Buy Price (₹)</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value === '' ? '' : Number(e.target.value))}
              min={0.01}
              step={0.01}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              onClick={addToPortfolio}
              disabled={!selectedTicker || !quantity || !buyPrice || quantity <= 0 || buyPrice <= 0}
              className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-500 hover:to-accent-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ArrowDownLeft className="h-5 w-5 mr-2" />
              Stock Buy
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Holdings */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Your Holdings</h2>
          <p className="text-sm text-gray-600">{portfolio.length} stocks in your portfolio</p>
        </div>

        {portfolio.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No stocks in your portfolio</h3>
            <p className="text-gray-600">Add stocks above to start tracking your investments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Qty</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Buy Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Current Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Total Value</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">P&L</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {portfolio.map((stock) => {
                  const currentPrice = currentPrices[stock.ticker] || stock.buyPrice;
                  const totalValue = stock.quantity * currentPrice;
                  const totalInvested = stock.quantity * stock.buyPrice;
                  const profitLoss = totalValue - totalInvested;
                  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
                  const isProfit = profitLoss >= 0;

                  return (
                    <tr key={stock.ticker} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{stock.ticker}</p>
                          <p className="text-sm text-gray-600">{stock.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {stock.quantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(stock.buyPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(currentPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(totalValue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
                        </div>
                        <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                          {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </div>
                      </td>
                   <td className="px-6 py-4 text-center">
  <button
    onClick={() => removeFromPortfolio(stock.ticker)}
    className="
      inline-flex items-center justify-center
      px-4 py-1.5
      text-sm font-semibold
      text-red-600
      border border-red-300
      rounded-md
      hover:bg-red-50 hover:border-red-400
      transition-all
      whitespace-nowrap
    "
    title="Sell Stock"
  >
    Sell
  </button>
</td>


                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;

