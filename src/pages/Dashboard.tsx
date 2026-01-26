// src/pages/Dashboard.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Calendar, DollarSign, Star, StarOff } from 'lucide-react';

import StockChart from '../components/StockChart';
import PredictionCard from '../components/PredictionCard';
import {
  ResponsiveContainer as SmallResponsive,
  LineChart as SmallLineChart,
  Line as SmallLine,
  XAxis as SmallXAxis,
  YAxis as SmallYAxis,
  CartesianGrid as SmallGrid,
  Tooltip as SmallTooltip,
  ComposedChart,
  Area,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  fetchCompanies,
  fetchHistoricalData,
  fetchPrediction,
  fetchCurrentPrice
} from '../services/api';
import type { Company, HistoricalData, Prediction } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>({
    ticker: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd'
  });
  const [selectedDate, setSelectedDate] = useState<string>('2028-08-22');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const chartSectionRef = useRef<HTMLDivElement>(null);

  // Get tomorrow's date as minimum
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max date (5 years from now)
  const getMaxDate = () => {
    const maxDate = new Date();
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

  // Adjust the currently selected date by days/months
  const adjustSelectedDate = (addDays = 0, addMonths = 0) => {
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

  // 4. Fetch current price separately for more reliable updates
  const {
    data: currentPriceData,
    isLoading: quoteLoading,
    error: quoteError
  } = useQuery<{ currentPrice: number; previousClose?: number; change?: number; changePercent?: number } | null, Error>({
    queryKey: ['quote', selectedCompany?.ticker],
    queryFn: () =>
      selectedCompany
        ? fetchCurrentPrice(selectedCompany.ticker)
        : Promise.resolve(null),
    enabled: Boolean(selectedCompany),
    refetchInterval: 60000, // Refresh every minute
  });

  // Helper to get numeric price from historical entry
  const getPrice = (d: any) => (d?.price ?? d?.close ?? d?.close_price ?? 0);

  // Indicator calculations (SMA, EMA, MACD, RSI, ADX)
  const indicators = React.useMemo(() => {
    const data = (historicalData ?? []).map((d) => ({ ts: new Date(d.date).getTime(), price: getPrice(d) }));
    if (!data || data.length === 0) return null;

    // SMA helper
    const sma = (period: number) => {
      const res: { ts: number; value: number | null }[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          res.push({ ts: data[i].ts, value: null });
          continue;
        }
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += data[j].price;
        res.push({ ts: data[i].ts, value: sum / period });
      }
      return res;
    };

    // Bollinger Bands (20, 2)
    const bbPeriod = 20;
    const bbMiddle = sma(bbPeriod);

    const bbUpper: (number | null)[] = [];
    const bbLower: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < bbPeriod - 1) {
        bbUpper.push(null);
        bbLower.push(null);
        continue;
      }

      const slice = data.slice(i - bbPeriod + 1, i + 1).map(d => d.price);
      const mean = bbMiddle[i]?.value ?? 0;

      const variance =
        slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / bbPeriod;

      const stdDev = Math.sqrt(variance);

      bbUpper.push(mean + 2 * stdDev);
      bbLower.push(mean - 2 * stdDev);
    }

    // EMA helper
    const emaSeries = (period: number) => {
      const res: { ts: number; value: number }[] = [];
      const k = 2 / (period + 1);
      let prevEma = data[0].price;
      for (let i = 0; i < data.length; i++) {
        const price = data[i].price;
        const ema = i === 0 ? price : price * k + prevEma * (1 - k);
        res.push({ ts: data[i].ts, value: ema });
        prevEma = ema;
      }
      return res;
    };

    // MACD (12/26) and signal(9)
    const ema12 = emaSeries(12).map((p) => p.value);
    const ema26 = emaSeries(26).map((p) => p.value);
    const macdLine = data.map((d, i) => ({ ts: d.ts, value: (ema12[i] ?? 0) - (ema26[i] ?? 0) }));
    // signal (9) on macdLine
    const signal: { ts: number; value: number }[] = [];
    if (macdLine.length) {
      let prev = macdLine[0].value;
      const kSig = 2 / (9 + 1);
      for (let i = 0; i < macdLine.length; i++) {
        const v = i === 0 ? macdLine[i].value : macdLine[i].value * kSig + prev * (1 - kSig);
        signal.push({ ts: macdLine[i].ts, value: v });
        prev = v;
      }
    }

    // RSI (14)
    const rsiPeriod = 14;
    const rsi: { ts: number; value: number | null }[] = [];
    let gains = 0,
      losses = 0;
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        rsi.push({ ts: data[i].ts, value: null });
        continue;
      }
      const change = data[i].price - data[i - 1].price;
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      if (i <= rsiPeriod) {
        gains += gain;
        losses += loss;
        rsi.push({ ts: data[i].ts, value: i === rsiPeriod ? 100 - 100 / (1 + gains / losses || 1) : null });
        if (i === rsiPeriod) {
          gains = gains / rsiPeriod;
          losses = losses / rsiPeriod;
        }
        continue;
      }
      gains = (gains * (rsiPeriod - 1) + gain) / rsiPeriod;
      losses = (losses * (rsiPeriod - 1) + loss) / rsiPeriod;
      const rs = gains / (losses || 1);
      rsi.push({ ts: data[i].ts, value: 100 - 100 / (1 + rs) });
    }

    // ADX (14) simplified
    const adxPeriod = 14;
    const trs: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        trs.push(0);
        plusDM.push(0);
        minusDM.push(0);
        continue;
      }
      const high = data[i].price;
      const low = data[i].price;
      const prevHigh = data[i - 1].price;
      const prevLow = data[i - 1].price;
      const upMove = high - prevHigh;
      const downMove = prevLow - low;
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
      const tr = Math.max(Math.abs(high - prevHigh), Math.abs(low - prevLow), Math.abs(high - low));
      trs.push(tr);
    }

    // smooth TR, +DM, -DM using Wilder's smoothing
    const smoothTR: number[] = [];
    const smoothPlus: number[] = [];
    const smoothMinus: number[] = [];
    let trSum = 0,
      plusSum = 0,
      minusSum = 0;
    for (let i = 0; i < data.length; i++) {
      if (i < adxPeriod) {
        trSum += trs[i];
        plusSum += plusDM[i];
        minusSum += minusDM[i];
        smoothTR.push(0);
        smoothPlus.push(0);
        smoothMinus.push(0);
        continue;
      }
      if (i === adxPeriod) {
        trSum += trs[i];
        plusSum += plusDM[i];
        minusSum += minusDM[i];
        smoothTR.push(trSum);
        smoothPlus.push(plusSum);
        smoothMinus.push(minusSum);
        continue;
      }
      const prevTR = smoothTR[smoothTR.length - 1];
      const prevPlus = smoothPlus[smoothPlus.length - 1];
      const prevMinus = smoothMinus[smoothMinus.length - 1];
      const newTR = prevTR - prevTR / adxPeriod + trs[i];
      const newPlus = prevPlus - prevPlus / adxPeriod + plusDM[i];
      const newMinus = prevMinus - prevMinus / adxPeriod + minusDM[i];
      smoothTR.push(newTR);
      smoothPlus.push(newPlus);
      smoothMinus.push(newMinus);
    }

    const plusDI: { ts: number; value: number | null }[] = [];
    const minusDI: { ts: number; value: number | null }[] = [];
    for (let i = 0; i < data.length; i++) {
      const tr = smoothTR[i] || 0;
      if (tr === 0) {
        plusDI.push({ ts: data[i].ts, value: null });
        minusDI.push({ ts: data[i].ts, value: null });
        continue;
      }
      const pdi = (smoothPlus[i] / tr) * 100 || 0;
      const mdi = (smoothMinus[i] / tr) * 100 || 0;
      plusDI.push({ ts: data[i].ts, value: pdi });
      minusDI.push({ ts: data[i].ts, value: mdi });
    }

    const dx: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const p = plusDI[i].value ?? 0;
      const m = minusDI[i].value ?? 0;
      const val = (Math.abs(p - m) / ((p + m) || 1)) * 100;
      dx.push(val);
    }

    const adx: { ts: number; value: number | null }[] = [];
    let adxPrev = 0;
    for (let i = 0; i < data.length; i++) {
      if (i < adxPeriod * 2) {
        adx.push({ ts: data[i].ts, value: null });
        adxPrev += dx[i] || 0;
        continue;
      }
      if (i === adxPeriod * 2) {
        adxPrev = adxPrev / adxPeriod;
        adx.push({ ts: data[i].ts, value: adxPrev });
        continue;
      }
      adxPrev = (adxPrev * (adxPeriod - 1) + dx[i]) / adxPeriod;
      adx.push({ ts: data[i].ts, value: adxPrev });
    }

    // Prepare merged series for charts
    const merged = data.map((d, i) => ({
      ts: d.ts,
      date: d.ts,
      close: d.price,
      sma20: sma(20)[i]?.value ?? null,
      upper: bbUpper[i],
      middle: bbMiddle[i]?.value ?? null,
      lower: bbLower[i],
      macd: macdLine[i]?.value ?? 0,
      macdSignal: signal[i]?.value ?? 0,
      rsi: rsi[i]?.value ?? null,
      adx: adx[i]?.value ?? null,
    }));

    return { merged };
  }, [historicalData]);

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

  // Calculate min and max dates for indicators charts
  const minDate = indicators ? Math.min(...indicators.merged.map(d => d.date)) : 0;
  const maxDate = indicators ? Math.max(...indicators.merged.map(d => d.date)) : 0;

  // Create a merged prediction object that uses currentPriceData for the current price
  const mergedPrediction = React.useMemo(() => {
    if (!prediction) return null;
    return {
      ...prediction,
      // Use the separately fetched current price if available, otherwise fall back to prediction's currentPrice
      currentPrice: currentPriceData?.currentPrice ?? prediction.currentPrice
    };
  }, [prediction, currentPriceData]);

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
                prediction={mergedPrediction}
              />
            )}

            {/* Technical indicators - 2x2 grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {indicators && (
                <>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium mb-2">Moving Average (SMA 20)</div>
                    <div className="h-28">
                      <SmallResponsive width="100%" height="100%">
                        <SmallLineChart data={indicators.merged} margin={{ top: 6, right: 8, left: 8, bottom: 6 }}>
                          <SmallGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <SmallXAxis dataKey="date" type="number" domain={[minDate, maxDate]} tickFormatter={(t)=> new Date(t).toLocaleDateString('en-IN',{month:'short'})} />
                          <SmallYAxis hide={true} />
                          <SmallTooltip formatter={(v:any)=>`₹${Number(v).toLocaleString('en-IN', {minimumFractionDigits:2})}`} labelFormatter={(l:any)=> new Date(l).toLocaleDateString()} />
                          <SmallLine type="linear" dataKey="close" stroke="#cbd5e1" dot={false} strokeWidth={1} />
                          <SmallLine type="linear" dataKey="sma20" stroke="#2563eb" dot={false} strokeWidth={2} />
                        </SmallLineChart>
                      </SmallResponsive>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium mb-2">MACD (12,26,9)</div>
                    <div className="h-28">
                      <SmallResponsive width="100%" height="100%">
                        <SmallLineChart data={indicators.merged} margin={{ top: 6, right: 8, left: 8, bottom: 6 }}>
                          <SmallGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <SmallXAxis dataKey="date" type="number" domain={[minDate, maxDate]} tickFormatter={(t)=> new Date(t).toLocaleDateString('en-IN',{month:'short'})} />
                          <SmallYAxis hide={true} />
                          <SmallTooltip formatter={(v:any)=>Number(v).toFixed(2)} labelFormatter={(l:any)=> new Date(l).toLocaleDateString()} />
                          <SmallLine type="linear" dataKey="macd" stroke="#2563eb" dot={false} strokeWidth={2} />
                          <SmallLine type="linear" dataKey="macdSignal" stroke="#16a34a" dot={false} strokeWidth={1} />
                        </SmallLineChart>
                      </SmallResponsive>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium mb-2">RSI (14)</div>
                    <div className="h-28">
                      <SmallResponsive width="100%" height="100%">
                        <SmallLineChart data={indicators.merged} margin={{ top: 6, right: 8, left: 8, bottom: 6 }}>
                          <SmallGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <SmallXAxis dataKey="date" type="number" domain={[minDate, maxDate]} tickFormatter={(t)=> new Date(t).toLocaleDateString('en-IN',{month:'short'})} />
                          <SmallYAxis domain={[0,100]} />
                          <SmallTooltip formatter={(v:any)=>Number(v).toFixed(2)} labelFormatter={(l:any)=> new Date(l).toLocaleDateString()} />
                          <SmallLine type="linear" dataKey="rsi" stroke="#f59e0b" dot={false} strokeWidth={2} />
                        </SmallLineChart>
                      </SmallResponsive>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium mb-2">ADX (14)</div>
                    <div className="h-28">
                      <SmallResponsive width="100%" height="100%">
                        <SmallLineChart data={indicators.merged} margin={{ top: 6, right: 8, left: 8, bottom: 6 }}>
                          <SmallGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <SmallXAxis dataKey="date" type="number" domain={[minDate, maxDate]} tickFormatter={(t)=> new Date(t).toLocaleDateString('en-IN',{month:'short'})} />
                          <SmallYAxis hide={true} />
                          <SmallTooltip formatter={(v:any)=>v ? Number(v).toFixed(2) : '—'} labelFormatter={(l:any)=> new Date(l).toLocaleDateString()} />
                          <SmallLine type="linear" dataKey="adx" stroke="#7c3aed" dot={false} strokeWidth={2} />
                        </SmallLineChart>
                      </SmallResponsive>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bollinger Bands Chart */}
            {indicators && (
              <div className="mt-6 bg-white p-4 rounded-xl border">
                <h4 className="text-sm font-semibold mb-2">
                  Bollinger Bands (20, 2)
                </h4>
                <div className="h-40">
                  <SmallResponsive width="100%" height="100%">
                    <ComposedChart data={indicators.merged} margin={{ top: 6, right: 8, left: 8, bottom: 6 }}>
                      <SmallGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <SmallXAxis dataKey="date" type="number" domain={[minDate, maxDate]} tickFormatter={(t) => new Date(t).toLocaleDateString('en-IN', { month: 'short' })} />
                      <SmallYAxis hide />
                      <SmallTooltip formatter={(v: any) => v ? `Rs ${Number(v).toLocaleString('en-IN')}` : '—'} labelFormatter={(l: any) => new Date(l).toLocaleDateString()} />
                      <Area type="monotone" dataKey="upper" stroke="none" fill="#fde68a" fillOpacity={0.4} />
                      <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={1} />
                      <SmallLine type="linear" dataKey="upper" stroke="#f59e0b" dot={false} strokeDasharray="5 5" />
                      <SmallLine type="linear" dataKey="middle" stroke="#2563eb" dot={false} strokeWidth={2} />
                      <SmallLine type="linear" dataKey="lower" stroke="#f59e0b" dot={false} strokeDasharray="5 5" />
                      <SmallLine type="linear" dataKey="close" stroke="#111827" dot={false} strokeWidth={1.5} />
                    </ComposedChart>
                  </SmallResponsive>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Price near upper band = overbought • near lower band = oversold
                </p>
              </div>
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
              prediction={mergedPrediction}
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

