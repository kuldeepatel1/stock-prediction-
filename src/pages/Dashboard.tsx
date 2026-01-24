// src/pages/Dashboard.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Calendar, DollarSign, Star, StarOff } from 'lucide-react';

import StockChart from '../components/StockChart';
import PredictionCard from '../components/PredictionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  fetchCompanies,
  fetchHistoricalData,
  fetchPrediction
} from '../services/api';
import type { Company, HistoricalData, Prediction } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const chartSectionRef = useRef<HTMLDivElement>(null);

  // Month names for display
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Get tomorrow's date as minimum
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max date (3 years from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    // allow prediction up to 5 years from today
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    return maxDate.toISOString().split('T')[0];
  };

  // Format date to dd-mm-yy
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const shortYear = year.toString().slice(-2);
    return `${day.toString().padStart(2, '0')}-${(month + 1).toString().padStart(2, '0')}-${shortYear}`;
  };

  // Parse date for API (convert to year, month, day)
  const parseSelectedDate = () => {
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        year: tomorrow.getFullYear(),
        month: tomorrow.getMonth() + 1,
        day: tomorrow.getDate()
      };
    }
    const date = new Date(selectedDate + 'T00:00:00');
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  };

  // Adjust the currently selected date by days/months (cumulative on repeated clicks)
  const adjustSelectedDate = (addDays = 0, addMonths = 0) => {
    // Use selectedDate as base if present, otherwise default to tomorrow
    const base = selectedDate
      ? new Date(selectedDate + 'T00:00:00')
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d;
        })();

    if (addDays) base.setDate(base.getDate() + addDays);
    if (addMonths) base.setMonth(base.getMonth() + addMonths);

    setSelectedDate(base.toISOString().split('T')[0]);
  };

  // Generate calendar days for the popup calendar
  const generateCalendarDays = () => {
    if (!selectedDate) return [];
    
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: { date: number; isCurrentMonth: boolean; isToday: boolean; isPast: boolean; isTomorrow: boolean }[] = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: 0, isCurrentMonth: false, isToday: false, isPast: false, isTomorrow: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: dateStr === today.toISOString().split('T')[0],
        isPast: dateObj < today,
        isTomorrow: dateStr === tomorrow.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  // Handle date selection
  const handleDateSelect = (day: number) => {
    if (!selectedDate) return;
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(day);
    const minDate = new Date(getMinDate());
    if (date < minDate) return;
    
    setSelectedDate(date.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('favorites');
    try {
      const arr = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setFavorites([]);
    }
  }, []);

  // Set default date to tomorrow when component mounts
  useEffect(() => {
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
  }, []);

  // Scroll to chart section when a stock is selected
  useEffect(() => {
    if (selectedCompany && chartSectionRef.current) {
      chartSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCompany]);

  const toggleFavorite = (ticker?: string) => {
    const t = ticker ?? selectedCompany?.ticker;
    if (!t) return;
    try {
      const raw = localStorage.getItem('favorites');
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(arr) ? arr : []);
      if (set.has(t)) set.delete(t);
      else set.add(t);
      const newArr = Array.from(set);
      localStorage.setItem('favorites', JSON.stringify(newArr));
      setFavorites(newArr);
    } catch (e) {
      localStorage.setItem('favorites', JSON.stringify([t]));
      setFavorites([t]);
    }
  };

  // 1. Fetch companies
  const {
    data: companies,
    isLoading: companiesLoading,
    error: companiesError
  } = useQuery<Company[], Error>({
    queryKey: ['companies'],
    queryFn: fetchCompanies
  });

  // 2. Fetch historical data
  const {
    data: historicalData,
    isLoading: histLoading,
    error: histError
  } = useQuery<HistoricalData[], Error>({
    queryKey: ['historical', selectedCompany?.ticker],
    queryFn: () =>
      selectedCompany
        ? fetchHistoricalData(selectedCompany.ticker)
        : Promise.resolve([]),
    enabled: Boolean(selectedCompany)
  });

  // Parse selected date for API
  const { year, month, day } = parseSelectedDate();

  // 3. Fetch prediction
  const {
    data: prediction,
    isLoading: predLoading,
    error: predError
  } = useQuery<Prediction, Error>({
    queryKey: ['prediction', selectedCompany?.ticker, year, month, day],
    queryFn: () =>
      selectedCompany
        ? fetchPrediction(selectedCompany.ticker, year, month, day)
        : Promise.resolve(null as any),
    enabled: Boolean(selectedCompany && selectedDate)
  });

  // Filter companies by search term
  const filteredCompanies = React.useMemo(() => {
    if (!companies) return [];
    return companies.filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.ticker.toLowerCase().includes(term)
      );
    });
  }, [companies, searchTerm]);

  if (companiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-gray-600">
          Explore stock charts and AI-powered price predictions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-600">Stocks Available</p>
            <p className="text-2xl font-semibold text-gray-900">
              {companies?.length ?? 0}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center">
          <Calendar className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-600">Prediction Range</p>
            <p className="text-2xl font-semibold text-gray-900">
              Tomorrow - 5 Years
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center">
          <DollarSign className="h-8 w-8 text-purple-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-600">Historical Range</p>
            <p className="text-2xl font-semibold text-gray-900">5 Years</p>
          </div>
        </div>
      </div>

      {/* Stock Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-xl font-semibold">Select a Stock</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ticker…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {companiesError && (
          <p className="text-red-600">Error loading companies.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
          {filteredCompanies.map((c) => (
            <button
              key={c.ticker}
              onClick={() => setSelectedCompany(c)}
              className={`p-4 text-left rounded-lg border transition ${
                selectedCompany?.ticker === c.ticker
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold">{c.ticker}</p>
              <p className="text-sm text-gray-600 truncate">{c.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chart & Prediction */}
      {selectedCompany ? (
        <div ref={chartSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedCompany.name} ({selectedCompany.ticker})
              </h3>
              <div>
                <button
                  type="button"
                  onClick={() => toggleFavorite()}
                  aria-label="Toggle favorite"
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  {selectedCompany && favorites.includes(selectedCompany.ticker) ? (
                    <Star className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <StarOff className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {histLoading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : histError ? (
              <p className="text-red-600">Error loading chart data.</p>
            ) : (
              <StockChart
                data={historicalData ?? []}
                prediction={prediction}
              />
            )}
          </div>

          {/* Prediction */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h4 className="text-lg font-semibold mb-4">
                Select Prediction Date
              </h4>
              
              {/* Calendar Picker - Inline Display */}
              <div className="space-y-4">
                {/* Native Date Input */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Select Date</label>
                  <input
                    type="date"
                    min={getMinDate()}
                    max={getMaxDate()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                  />
                </div>
                
                {/* Quick Select Buttons */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => adjustSelectedDate(1, 0)}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSelectedDate(7, 0)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                    >
                      +1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSelectedDate(0, 1)}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
                    >
                      +1 Month
                    </button>
                  </div>
                </div>
              
                <p className="text-sm text-gray-600">
                  Predicting for: <span className="font-medium text-gray-800">{formatDateDisplay(selectedDate)}</span>
                </p>
              </div>
            </div>
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
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Select a stock to view chart & prediction
          </h3>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
