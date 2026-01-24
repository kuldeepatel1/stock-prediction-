import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, StarOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import StockChart from '../components/StockChart';
import PredictionCard from '../components/PredictionCard';
import LoadingSpinner from '../components/LoadingSpinner';

import {
  fetchCompanies,
  fetchHistoricalData,
  fetchPrediction
} from '../services/api';

import type { Company, HistoricalData, Prediction } from '../types';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  /* ------------------ Load Companies ------------------ */
  const { data: companies, isLoading: companiesLoading } = useQuery<
    Company[],
    Error
  >({
    queryKey: ['companies'],
    queryFn: fetchCompanies
  });

  /* ------------------ Load Favorites ------------------ */
  useEffect(() => {
    const raw = localStorage.getItem('favorites');
    const arr = raw ? JSON.parse(raw) : [];
    setFavorites(Array.isArray(arr) ? arr : []);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  /* ------------------ Favorite Companies ------------------ */
  const favoriteCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c) => favorites.includes(c.ticker));
  }, [companies, favorites]);

  /* ------------------ Default Selection ------------------ */
  // Do not auto-select a favorite on load. User must click a favorite to view details.

  const selectedCompany = companies?.find(
    (c) => c.ticker === selectedTicker
  );

  /* ------------------ Toggle Favorite ------------------ */
  const toggleFavorite = (ticker: string) => {
    if (!ticker) return;
    const set = new Set(favorites);
    const isRemoving = set.has(ticker);
    if (isRemoving) set.delete(ticker);
    else set.add(ticker);
    const updated = Array.from(set);
    localStorage.setItem('favorites', JSON.stringify(updated));
    setFavorites(updated);
    // If we removed the currently-selected ticker, clear selection. Don't auto-select another.
    if (isRemoving && selectedTicker === ticker) {
      setSelectedTicker('');
    }
  };

  /* ------------------ Prediction Date ------------------ */
  const d = new Date(selectedDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  /* ------------------ Prediction ------------------ */
  const {
    data: prediction,
    isLoading: predLoading,
    error: predError
  } = useQuery<Prediction, Error>({
    queryKey: ['prediction', selectedTicker, year, month, day],
    queryFn: () =>
      fetchPrediction(selectedTicker, year, month, day),
    enabled: !!selectedTicker
  });

  if (companiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Favorites</h1>
        <Link to="/dashboard" className="text-blue-600 text-sm">
          Back to Dashboard
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white p-6 rounded-xl text-center border">
          <p>No favorites yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border">
            {!selectedTicker ? (
              <div className="h-64 flex items-center justify-center text-gray-600">
                Click a favorite on the right to view chart & prediction.
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-lg">
                      {selectedCompany?.name}{' '}
                      <span className="text-gray-500">({selectedCompany?.ticker})</span>
                    </h2>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border rounded-lg p-2 text-sm"
                    />
                    <button onClick={() => selectedTicker && toggleFavorite(selectedTicker)}>
                      {favorites.includes(selectedTicker) ? (
                        <Star className="text-yellow-500" />
                      ) : (
                        <StarOff />
                      )}
                    </button>
                  </div>
                </div>

                <FavoriteChart selectedTicker={selectedTicker} prediction={prediction} />

                {/* Prediction card moved here so prediction summary appears before High/Low/Avg */}
                {selectedCompany && (
                  <div className="mt-6">
                    <PredictionCard
                      company={selectedCompany}
                      year={year}
                      month={month}
                      day={day}
                      prediction={prediction}
                      isLoading={predLoading}
                      error={predError}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="bg-white p-6 rounded-xl border space-y-4">
            <h4 className="font-semibold">Your Favorites</h4>

            {favoriteCompanies.map((c) => (
              <button
                key={c.ticker}
                onClick={() => setSelectedTicker((prev) => (prev === c.ticker ? '' : c.ticker))}
                aria-pressed={selectedTicker === c.ticker}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedTicker === c.ticker
                    ? 'bg-blue-50 border-blue-500'
                    : ''
                }`}
              >
                <p className="font-semibold">{c.ticker}</p>
                <p className="text-sm text-gray-600">{c.name}</p>
              </button>
            ))}

            {/* PredictionCard intentionally rendered in the main column above so it's not inside the favorites list */}
          </aside>
        </div>
      )}
    </div>
  );
};

export default Favorites;

/* ------------------ Chart Component ------------------ */
const FavoriteChart: React.FC<{
  selectedTicker: string;
  prediction: Prediction | undefined;
}> = ({ selectedTicker, prediction }) => {
  const { data, isLoading, error } = useQuery<
    HistoricalData[],
    Error
  >({
    queryKey: ['historical', selectedTicker],
    queryFn: () => fetchHistoricalData(selectedTicker),
    enabled: !!selectedTicker
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p>Error loading chart</p>;

  return <StockChart data={data ?? []} prediction={prediction} />;
};
