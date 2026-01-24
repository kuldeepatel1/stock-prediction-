import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCompanies, fetchPrediction } from '../services/api';
import type { Company, Prediction } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const TOP_CANDIDATES = 60; // limit how many predictions we request

const Recognize: React.FC = () => {
  const { data: companies, isLoading: compLoading } = useQuery<Company[], Error>({ queryKey: ['companies'], queryFn: fetchCompanies });

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const nextDayDate = new Date(today);
  nextDayDate.setDate(nextDayDate.getDate() + 1);
  const nextDay = nextDayDate.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(nextDay);

  const { year, month, day } = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }, [selectedDate]);

  const { data: predictions, isLoading: predsLoading } = useQuery<
    Array<{ company: Company; prediction: Prediction }>
  >({
    queryKey: ['recognize', selectedDate],
    queryFn: async () => {
      if (!companies || companies.length === 0) return [] as Array<{ company: Company; prediction: Prediction }>;
      const candidates = companies.slice(0, TOP_CANDIDATES);
      const results = await Promise.all(
        candidates.map(async (c) => {
          try {
            const p = await fetchPrediction(c.ticker, year, month, day);
            return { company: c, prediction: p };
          } catch (err) {
            return null;
          }
        })
      );
      return results.filter(Boolean) as Array<{ company: Company; prediction: Prediction }>;
    },
    enabled: !!companies,
  });

  const sorted = useMemo(() => {
    if (!predictions) return [] as Array<{ company: Company; prediction: Prediction }>;
    return predictions.slice().sort((a, b) => b.prediction.predictedPrice - a.prediction.predictedPrice);
  }, [predictions]);

  if (compLoading || predsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Top Predicted Prices</h1>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-sm text-blue-600">Back</Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Prediction Date</label>
            <input type="date" value={selectedDate} min={minDate} onChange={(e)=> setSelectedDate(e.target.value >= minDate ? e.target.value : minDate)} className="w-full border p-2 rounded" />
          </div>
          <div className="sm:col-span-2 text-sm text-gray-500 flex items-center">Showing top results by predicted price (descending). Data limited to {TOP_CANDIDATES} candidates for performance.</div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No predictions available</div>
        ) : (
          <div className="divide-y">
            {sorted.map(({ company, prediction }, idx) => {
              const change = prediction.predictedPrice - prediction.currentPrice;
              const pct = (change / prediction.currentPrice) * 100;
              return (
                <div key={company.ticker} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 text-lg font-bold text-gray-700">#{idx + 1}</div>
                    <div>
                      <div className="text-sm font-semibold">{company.ticker} <span className="text-xs text-gray-500">— {company.name}</span></div>
                      <div className="text-xs text-gray-400">As of: {prediction.createdAt.split('T')[0]}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Current</div>
                      <div className="text-lg font-semibold">₹{prediction.currentPrice.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">Predicted</div>
                      <div className="text-lg font-semibold text-indigo-600">₹{prediction.predictedPrice.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
                    </div>

                    <div className="text-right w-36">
                      <div className="text-sm text-gray-500">Change</div>
                      <div className={`text-lg font-semibold ${change>=0? 'text-green-600':'text-red-600'}`}>
                        {change>=0?'+':''}{pct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recognize;
