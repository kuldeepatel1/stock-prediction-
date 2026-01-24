import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot
} from 'recharts';

import type { HistoricalData, Prediction } from '../types';

interface StockChartProps {
  data: HistoricalData[];
  prediction?: Prediction | null;
}

const StockChart: React.FC<StockChartProps> = ({ data, prediction }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate High, Low, and Average prices
  const prices = data.map(d => d.close);
  const highPrice = Math.max(...prices);
  const lowPrice = Math.min(...prices);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // Format date for X-axis (accepts timestamp)
  const formatDate = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    });
  };

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isPrediction = payload[0]?.payload?.isPrediction === true;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-1">
            {new Date(label).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className={`text-lg font-semibold ${isPrediction ? 'text-green-600' : 'text-blue-600'}`}>
            {isPrediction ? 'Predicted: ' : '₹'}{payload[0].value.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          {isPrediction && prediction && (
            <p className="text-xs text-gray-500 mt-1">
              Current: ₹{prediction.currentPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get the prediction date in the same format as historical data
  const getPredictionPoint = () => {
    if (!prediction) return null;
    
    // Create a date string for the prediction date
    const predDate = new Date(prediction.year, (prediction.month || 1) - 1, prediction.day || 1);
    const predDateStr = predDate.toISOString().split('T')[0];
    const predTs = predDate.getTime();
    
    // Check if prediction is gain or loss
    const isGain = prediction.predictedPrice >= prediction.currentPrice;
    
    return {
      date: predDateStr,
      ts: predTs,
      predictedPrice: prediction.predictedPrice,
      isPrediction: true,
      isGain: isGain,
      color: isGain ? '#22c55e' : '#ef4444', // green for gain, red for loss
      strokeColor: isGain ? '#16a34a' : '#dc2626'
    };
  };

  const predictionPoint = getPredictionPoint();

  // Build chart data using timestamps so X-axis is time-based and sorted
  const chartData = data
    .map(d => ({ date: new Date(d.date).getTime(), price: d.close, isPrediction: false }))
    .sort((a, b) => a.date - b.date);

  if (predictionPoint) {
    const predTs = predictionPoint.ts ?? new Date(predictionPoint.date).getTime();
    const lastPoint = chartData.length ? chartData[chartData.length - 1] : null;
    const lastTs = lastPoint ? lastPoint.date : null;
    const lastPrice = lastPoint ? lastPoint.price : null;

    // helper: Gaussian random (Box-Muller)
    const gaussianRandom = () => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    if (lastTs && predTs > lastTs && lastPrice != null) {
      // Compute historical log-return stddev
      const logReturns: number[] = [];
      for (let i = 1; i < data.length; i++) {
        const a = data[i - 1].close;
        const b = data[i].close;
        if (a > 0 && b > 0) logReturns.push(Math.log(b / a));
      }
      const mean = logReturns.length ? logReturns.reduce((s, v) => s + v, 0) / logReturns.length : 0;
      const variance = logReturns.length ? logReturns.reduce((s, v) => s + (v - mean) * (v - mean), 0) / logReturns.length : 0;
      const stdev = Math.sqrt(variance || 0);

      // Choose number of synthetic steps (approx weekly points, bounded)
      const daysDiff = Math.max(1, Math.round((predTs - lastTs) / (1000 * 60 * 60 * 24)));
      const approxWeeks = Math.max(1, Math.round(daysDiff / 7));
      const steps = Math.min(30, Math.max(6, approxWeeks));

      const synthetic: { date: number; price: number; isPrediction: boolean }[] = [];
      for (let i = 1; i <= steps; i++) {
        const t = Math.round(lastTs + ((predTs - lastTs) * i) / steps);
        // linear base between last actual and predicted
        const base = lastPrice + ((predictionPoint.predictedPrice - lastPrice) * i) / steps;
        // add multiplicative noise proportional to volatility
        const noiseFactor = gaussianRandom() * (stdev || 0) * 2; // multiplier tuned for visible fluctuation
        const price = Math.max(1, base * Math.exp(noiseFactor));
        synthetic.push({ date: t, price, isPrediction: true });
      }
      // Ensure final point equals exact predicted price
      synthetic[synthetic.length - 1].price = predictionPoint.predictedPrice;

      // Remove any existing points with same timestamps to avoid duplicates
      const predTimestamps = new Set(synthetic.map(s => s.date));
      const filtered = chartData.filter(pt => !predTimestamps.has(pt.date));
      chartData.length = 0;
      chartData.push(...filtered, ...synthetic);
      chartData.sort((a, b) => a.date - b.date);
    } else {
      // If prediction is on or before last point, replace or insert normally
      const existingIndex = chartData.findIndex(pt => pt.date === predTs);
      if (existingIndex >= 0) {
        chartData[existingIndex] = { date: predTs, price: predictionPoint.predictedPrice, isPrediction: true };
      } else {
        chartData.push({ date: predTs, price: predictionPoint.predictedPrice, isPrediction: true });
        chartData.sort((a, b) => a.date - b.date);
      }
    }
  }

  // Split into actual and projected series so we can style projection differently
  const actualSeries = chartData.filter(pt => !pt.isPrediction);
  const projectedBase = chartData.filter(pt => pt.isPrediction);
  const projectedSeries = (actualSeries.length && projectedBase.length)
    ? [...actualSeries.slice(-1), ...projectedBase]
    : projectedBase;

  return (
    <div>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
              tickCount={6}
              interval={0}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              data={actualSeries}
              type="linear"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
              name="Closing Price (₹)"
            />

            {/* Projected path rendered with different color to distinguish prediction */}
            {projectedSeries && projectedSeries.length > 1 && (
              <Line
                data={projectedSeries}
                type="linear"
                dataKey="price"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                legendType="none"
              />
            )}
            {/* Prediction Point with different color based on gain/loss */}
            {predictionPoint && (
              <ReferenceDot
                x={predictionPoint.ts ?? new Date(predictionPoint.date).getTime()}
                y={predictionPoint.predictedPrice}
                r={7}
                fill={predictionPoint.color}
                stroke={predictionPoint.strokeColor}
                strokeWidth={2}
                label={{
                  position: 'top',
                  value: `₹${predictionPoint.predictedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  fill: predictionPoint.color,
                  fontSize: 12
                }}
              />
            )}
            {/* Reference line for prediction price */}
            {predictionPoint && (
              <ReferenceLine
                y={predictionPoint.predictedPrice}
                stroke={predictionPoint.color}
                strokeDasharray="5 5"
                label={{
                  value: predictionPoint.isGain ? 'Predicted (Gain)' : 'Predicted (Loss)',
                  position: 'right',
                  fill: predictionPoint.color,
                  fontSize: 11
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Prediction Info - Color based on gain/loss */}
      {prediction && (
        <div className={`border rounded-lg p-3 mb-4 ${
          prediction.predictedPrice >= prediction.currentPrice
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ 
                  backgroundColor: prediction.predictedPrice >= prediction.currentPrice ? '#22c55e' : '#ef4444' 
                }}
              ></div>
              <span 
                className="text-sm font-medium" 
                style={{ 
                  color: prediction.predictedPrice >= prediction.currentPrice ? '#16a34a' : '#dc2626' 
                }}
              >
                {prediction.predictedPrice >= prediction.currentPrice ? 'Predicted Gain' : 'Predicted Loss'}
              </span>
            </div>
            <span 
              className="text-lg font-bold" 
              style={{ 
                color: prediction.predictedPrice >= prediction.currentPrice ? '#16a34a' : '#dc2626' 
              }}
            >
              ₹{prediction.predictedPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
          <p 
            className="text-xs mt-1" 
            style={{ 
              color: prediction.predictedPrice >= prediction.currentPrice ? '#16a34a' : '#dc2626' 
            }}
          >
            For {prediction.day}-{prediction.month}-{prediction.year.toString().slice(-2)} (dd-mm-yy)
            {prediction.predictedPrice >= prediction.currentPrice 
              ? ' ▲ Price expected to rise'
              : ' ▼ Price expected to fall'}
          </p>
        </div>
      )}
      
      {/* Price Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-2 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">High</p>
          <p className="text-lg font-semibold text-green-600">
            ₹{highPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Low</p>
          <p className="text-lg font-semibold text-red-600">
            ₹{lowPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Avg</p>
          <p className="text-lg font-semibold text-blue-600">
            ₹{avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockChart;
