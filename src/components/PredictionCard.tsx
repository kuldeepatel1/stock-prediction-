import React from 'react';
import { TrendingUp, TrendingDown, Calendar, AlertCircle, Target, Zap } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import type { Company, Prediction } from '../types';

interface PredictionCardProps {
  company: Company;
  year: number;
  month?: number;
  day?: number;
  prediction: Prediction | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Format date to dd-mm-yy
const formatDateDisplay = (year: number, month?: number, day?: number) => {
  if (!month || !day) return year.toString();
  const shortYear = year.toString().slice(-2);
  return `${day.toString().padStart(2, '0')}-${(month).toString().padStart(2, '0')}-${shortYear}`;
};

const PredictionCard: React.FC<PredictionCardProps> = ({
  company,
  year,
  month,
  day,
  prediction,
  isLoading,
  error
}) => {
  const formatCurrency = (amount?: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '—';
    }
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getPriceChange = () => {
    if (!prediction || typeof prediction.currentPrice !== 'number' || typeof prediction.predictedPrice !== 'number') return null;

    const change = prediction.predictedPrice - prediction.currentPrice;
    const changePercent = (change / prediction.currentPrice) * 100;

    return {
      amount: change,
      percent: changePercent,
      isPositive: change > 0
    };
  };

  const priceChange = getPriceChange();

  return (
    <div className="prediction-card rounded-2xl shadow-card border border-dark-100 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-primary-100"> Prediction</p>
              <p className="font-semibold">{company.ticker}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {formatDateDisplay(year, month, day)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-dark-500 animate-pulse">Analyzing market data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-2">Unable to load prediction</p>
            <p className="text-sm text-dark-500">Please try again later</p>
          </div>
        ) : prediction ? (
          <div className="space-y-4">
            {/* Current Price */}
            <div className="bg-dark-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-dark-200 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-dark-500">Current Price</span>
                </div>
                <p className="text-xl font-bold text-dark-800">
                  {formatCurrency(prediction.currentPrice)}
                </p>
              </div>
            </div>

            {/* Predicted Price */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4 border border-primary-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-sm text-primary-700 font-medium">Predicted Price</span>
                </div>
                <p className="text-2xl font-bold text-primary-700">
                  {formatCurrency(prediction.predictedPrice)}
                </p>
              </div>
            </div>

            {/* Price Change */}
            {priceChange && (
              <div className={`rounded-xl p-4 border ${
                priceChange.isPositive 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {priceChange.isPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      priceChange.isPositive ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Expected Change
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${
                    priceChange.isPositive ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {priceChange.isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%
                  </span>
                </div>
                <p className={`text-2xl font-bold ${
                  priceChange.isPositive ? 'text-green-800' : 'text-red-800'
                }`}>
                  {priceChange.isPositive ? '+' : ''}{formatCurrency(priceChange.amount)}
                </p>
              </div>
            )}

            {/* Confidence Score */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-yellow-700">Confidence</span>
                </div>
                <span className="text-sm font-bold text-yellow-700">
                  {prediction.confidence ?? '—'}%
                </span>
              </div>
              <div className="relative h-3 bg-yellow-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${prediction.confidence ?? 0}%` }}
                ></div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-dark-500 bg-dark-50 p-3 rounded-lg leading-relaxed">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-dark-400 flex-shrink-0 mt-0.5" />
                <p>
                  This prediction is based on historical data and Ml models. 
                  Past performance does not guarantee future results. 
                  Please consult financial advisors before investing.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-dark-400" />
            </div>
            <p className="text-dark-500 font-medium">Select a year to see predictions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;

