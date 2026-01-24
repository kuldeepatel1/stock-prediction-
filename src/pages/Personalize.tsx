import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCompanies, fetchHistoricalData, fetchPrediction } from '../services/api';
import type { Company, HistoricalData, Prediction } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';

const gaussianRandom = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const buildSeriesWithProjection = (arr: HistoricalData[] | undefined, pred?: Prediction | null, projectionDaysAfter = 0) => {
  const getPrice = (d: any) => d.price ?? d.close ?? d.close_price ?? 0;
  const actual = (arr || []).map(d => ({ ts: new Date(d.date).getTime(), value: getPrice(d), isPrediction: false }));
  if (!pred) return actual.sort((a, b) => a.ts - b.ts);

  const predTs = new Date(pred.year, (pred.month || 1) - 1, pred.day || 1).getTime();

  const last = actual.length ? actual[actual.length - 1] : null;
  const lastTs = last?.ts ?? null;
  const lastPrice = last?.value ?? null;

  const logReturns: number[] = [];
  for (let i = 1; i < (arr || []).length; i++) {
    const a = getPrice((arr || [])[i - 1]);
    const b = getPrice((arr || [])[i]);
    if (a > 0 && b > 0) logReturns.push(Math.log(b / a));
  }
  const mean = logReturns.length ? logReturns.reduce((s, v) => s + v, 0) / logReturns.length : 0;
  const variance = logReturns.length ? logReturns.reduce((s, v) => s + (v - mean) * (v - mean), 0) / logReturns.length : 0;
  const stdev = Math.sqrt(variance || 0);

  if (lastTs && predTs > lastTs && lastPrice != null) {
    const endTs = projectionDaysAfter > 0 ? predTs + projectionDaysAfter * 24 * 60 * 60 * 1000 : predTs;
    const daysDiff = Math.max(1, Math.round((endTs - lastTs) / (1000 * 60 * 60 * 24)));
    const approxWeeks = Math.max(1, Math.round(daysDiff / 7));
    const steps = Math.min(60, Math.max(8, approxWeeks));

    const synthetic: { ts: number; value: number; isPrediction: boolean }[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = Math.round(lastTs + ((endTs - lastTs) * i) / steps);
      let base: number;
      if (t <= predTs) {
        base = lastPrice + ((pred.predictedPrice - lastPrice) * i) / steps;
      } else {
        // after prediction, start from predictedPrice and random-walk
        const frac = (t - predTs) / Math.max(1, endTs - predTs);
        base = pred.predictedPrice * (1 + 0.002 * frac); // small drift upwards by default
      }
      const noiseFactor = gaussianRandom() * (stdev || 0) * 2;
      const value = Math.max(1, base * Math.exp(noiseFactor));
      synthetic.push({ ts: t, value, isPrediction: t >= predTs });
    }
    // ensure prediction exact point exists
    const predIndex = synthetic.findIndex(s => s.ts === predTs);
    if (predIndex >= 0) synthetic[predIndex].value = pred.predictedPrice;
    else synthetic.push({ ts: predTs, value: pred.predictedPrice, isPrediction: true });

    const predTimestamps = new Set(synthetic.map(s => s.ts));
    const filtered = actual.filter(pt => !predTimestamps.has(pt.ts));
    const combined = [...filtered, ...synthetic].sort((a, b) => a.ts - b.ts);
    return combined;
  } else {
    const existingIndex = actual.findIndex(pt => pt.ts === predTs);
    if (existingIndex >= 0) {
      actual[existingIndex] = { ts: predTs, value: pred.predictedPrice, isPrediction: true };
    } else {
      actual.push({ ts: predTs, value: pred.predictedPrice, isPrediction: true });
    }
    return actual.sort((a, b) => a.ts - b.ts);
  }
};

const formatCurrency = (v?: number) => typeof v === 'number' ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}` : '—';

const Personalize: React.FC = () => {
  const { data: companies, isLoading: compLoading } = useQuery<Company[], Error>({ queryKey: ['companies'], queryFn: fetchCompanies });

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const nextDay = new Date(today); nextDay.setDate(nextDay.getDate() + 1);
  const defaultDate = nextDay.toISOString().split('T')[0];

  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState<number | ''>(10000);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [sellHorizonDays, setSellHorizonDays] = useState<number>(90);

  const { data: historical } = useQuery<HistoricalData[] | undefined, Error>({ queryKey: ['historical', ticker], queryFn: () => fetchHistoricalData(ticker), enabled: !!ticker });
  const { data: prediction, isLoading: predLoading } = useQuery<Prediction | null, Error>({ queryKey: ['prediction', ticker, selectedDate], queryFn: async () => {
    if (!ticker) return null;
    const d = new Date(selectedDate + 'T00:00:00');
    return fetchPrediction(ticker, d.getFullYear(), d.getMonth() + 1, d.getDate());
  }, enabled: !!ticker });

  const series = useMemo(() => buildSeriesWithProjection(historical, prediction ?? undefined, sellHorizonDays), [historical, prediction, sellHorizonDays]);

  const recommendation = useMemo(() => {
    if (!series || series.length === 0 || !amount || !prediction) return null;
    const predTs = new Date(prediction.year, (prediction.month || 1) - 1, prediction.day || 1).getTime();
    const buyCandidates = series.filter(s => s.ts <= predTs);
    if (buyCandidates.length === 0) return null;

    // pick lowest price before or on prediction date
    let bestBuy = buyCandidates[0];
    for (const p of buyCandidates) if (p.value < bestBuy.value) bestBuy = p;

    // look for sell opportunities after prediction within horizon
    const sellWindowEnd = predTs + sellHorizonDays * 24 * 60 * 60 * 1000;
    const sellCandidates = series.filter(s => s.ts >= predTs && s.ts <= sellWindowEnd);
    if (sellCandidates.length === 0) return {
      buyAt: bestBuy,
      sellAt: { ts: predTs, value: prediction.predictedPrice, isPrediction: true },
      quantity: Math.floor(Number(amount) / bestBuy.value) || 0,
      expectedProfit: 0,
      profitPerUnit: 0,
    };

    let bestSell = sellCandidates[0];
    for (const p of sellCandidates) if (p.value > bestSell.value) bestSell = p;

    const quantity = Math.floor(Number(amount) / bestBuy.value) || 0;
    const profitPerUnit = bestSell.value - bestBuy.value;
    const expectedProfit = quantity * profitPerUnit;

    return {
      buyAt: bestBuy,
      predictionPoint: { ts: predTs, value: prediction.predictedPrice },
      sellAt: bestSell,
      quantity,
      expectedProfit,
      profitPerUnit,
    };
  }, [series, amount, prediction, sellHorizonDays]);

  if (compLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner/></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Personalize — Buy/Sell Suggestion</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Stock</label>
          <select value={ticker} onChange={(e)=>setTicker(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select a stock</option>
            {companies?.map(c=> <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Amount to invest (₹)</label>
          <input type="number" value={amount} onChange={(e)=> setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-2 rounded" min={1} />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Prediction Date</label>
          <input type="date" value={selectedDate} min={minDate} onChange={(e)=> setSelectedDate(e.target.value >= minDate ? e.target.value : minDate)} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Sell horizon (days)</label>
          <input type="number" value={sellHorizonDays} onChange={(e)=> setSellHorizonDays(Math.max(1, Number(e.target.value || 1)))} min={1} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-xl border">
          <div className="h-64">
            {(!ticker) ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Select a stock to view chart</div>
            ) : (!historical && predLoading) ? (
              <div className="h-64 flex items-center justify-center"><LoadingSpinner/></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.map(s=>({ date: s.ts, price: s.value }))} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(t)=> new Date(t).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})} />
                  <YAxis tickFormatter={(v)=>`₹${v}`} />
                  <Tooltip formatter={(v:any)=>formatCurrency(Number(v))} labelFormatter={(l:any)=> new Date(l).toLocaleDateString()} />
                    <Line type="linear" dataKey="price" stroke="#2563eb" dot={series.length <= 1 ? { r: 4 } : false} />
                    {prediction && (
                      <ReferenceDot
                        x={new Date(prediction.year, (prediction.month || 1) - 1, prediction.day || 1).getTime()}
                        y={prediction.predictedPrice}
                        r={6}
                        fill="#16a34a"
                        stroke="#065f46"
                        label={{ position: 'top', value: `Pred: ${formatCurrency(prediction.predictedPrice)}`, fill: '#065f46', fontSize: 11 }}
                      />
                    )}
                    {recommendation && (
                      <>
                        <ReferenceDot x={recommendation.buyAt.ts} y={recommendation.buyAt.value} r={5} fill="#2563eb" stroke="#1e40af" label={{ position: 'bottom', value: 'Buy', fill: '#1e40af', fontSize: 11 }} />
                        <ReferenceDot x={recommendation.sellAt.ts} y={recommendation.sellAt.value} r={5} fill="#ef4444" stroke="#b91c1c" label={{ position: 'top', value: 'Sell', fill: '#b91c1c', fontSize: 11 }} />
                      </>
                    )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <aside className="bg-white p-6 rounded-xl border space-y-4">
          <div>
            <h4 className="text-sm font-semibold">Recommendation</h4>
            {!recommendation ? (
              <p className="text-sm text-gray-500">Enter amount and pick a stock to get a suggestion.</p>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">Buy at: <span className="font-semibold">{formatCurrency(recommendation.buyAt.value)}</span></div>
                <div className="text-sm">On: <span className="font-semibold">{new Date(recommendation.buyAt.ts).toLocaleDateString()}</span></div>
                <div className="text-sm">Prediction ({new Date(recommendation.predictionPoint.ts).toLocaleDateString()}): <span className="font-semibold text-indigo-600">{formatCurrency(recommendation.predictionPoint.value)}</span></div>
                <div className="text-sm">Sell at: <span className="font-semibold">{formatCurrency(recommendation.sellAt.value)}</span></div>
                <div className="text-sm">On: <span className="font-semibold">{new Date(recommendation.sellAt.ts).toLocaleDateString()}</span></div>
                <div className="text-sm">Quantity (approx): <span className="font-semibold">{recommendation.quantity}</span></div>
                <div className="text-sm">Expected profit: <span className={`font-semibold ${recommendation.expectedProfit>=0?'text-green-600':'text-red-600'}`}>{formatCurrency(recommendation.expectedProfit)}</span></div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold">Notes</h4>
            <p className="text-xs text-gray-500">This is a heuristic suggestion based on historical volatility and a single predicted price. It does not constitute financial advice. Consider fees, taxes, and risks.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Personalize;
