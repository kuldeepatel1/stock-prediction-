import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCompanies, fetchHistoricalData, fetchPrediction } from '../services/api';
import type { Company, HistoricalData, Prediction } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, ReferenceLine } from 'recharts';

const getPrice = (d: any) => d.price ?? d.close ?? d.close_price ?? 0;

const CombinedChart: React.FC<{
  data1: HistoricalData[];
  data2: HistoricalData[];
  pred1?: Prediction | null;
  pred2?: Prediction | null;
}> = ({ data1, data2, pred1, pred2 }) => {
  // gaussian helper (Box-Muller)
  const gaussianRandom = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const buildSeriesWithProjection = (arr: HistoricalData[] | undefined, pred?: Prediction | null) => {
    const actual = (arr || []).map(d => ({ ts: new Date(d.date).getTime(), value: getPrice(d), isPrediction: false }));
    if (!pred) return actual.sort((a, b) => a.ts - b.ts);

    const predTs = new Date(pred.year, (pred.month || 1) - 1, pred.day || 1).getTime();

    const last = actual.length ? actual[actual.length - 1] : null;
    const lastTs = last?.ts ?? null;
    const lastPrice = last?.value ?? null;

    // compute log-returns stdev from historical data
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
      const daysDiff = Math.max(1, Math.round((predTs - lastTs) / (1000 * 60 * 60 * 24)));
      const approxWeeks = Math.max(1, Math.round(daysDiff / 7));
      const steps = Math.min(30, Math.max(6, approxWeeks));

      const synthetic: { ts: number; value: number; isPrediction: boolean }[] = [];
      for (let i = 1; i <= steps; i++) {
        const t = Math.round(lastTs + ((predTs - lastTs) * i) / steps);
        const base = lastPrice + ((pred.predictedPrice - lastPrice) * i) / steps;
        const noiseFactor = gaussianRandom() * (stdev || 0) * 2;
        const value = Math.max(1, base * Math.exp(noiseFactor));
        synthetic.push({ ts: t, value, isPrediction: true });
      }
      synthetic[synthetic.length - 1].value = pred.predictedPrice;

      const predTimestamps = new Set(synthetic.map(s => s.ts));
      const filtered = actual.filter(pt => !predTimestamps.has(pt.ts));
      const combined = [...filtered, ...synthetic].sort((a, b) => a.ts - b.ts);
      return combined;
    } else {
      // insert/replace at predTs
      const existingIndex = actual.findIndex(pt => pt.ts === predTs);
      if (existingIndex >= 0) {
        actual[existingIndex] = { ts: predTs, value: pred.predictedPrice, isPrediction: true };
      } else {
        actual.push({ ts: predTs, value: pred.predictedPrice, isPrediction: true });
      }
      return actual.sort((a, b) => a.ts - b.ts);
    }
  };

  const series1 = buildSeriesWithProjection(data1, pred1);
  const series2 = buildSeriesWithProjection(data2, pred2);

  // merge into unified points array for recharts
  const map = new Map<number, any>();
  const addToMap = (s: { ts: number; value: number; isPrediction: boolean }[], key: 'p1' | 'p2') => {
    s.forEach(pt => {
      const existing = map.get(pt.ts) ?? { date: pt.ts };
      existing[key] = pt.value;
      // mark if either series at this timestamp is a projection
      existing[`${key}_isPred`] = pt.isPrediction;
      map.set(pt.ts, existing);
    });
  };

  addToMap(series1, 'p1');
  addToMap(series2, 'p2');

  const points = Array.from(map.values()).sort((a, b) => a.date - b.date);

  if (!points.length) return <div className="h-64 flex items-center justify-center text-gray-500">No data</div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString();
      return (
        <div className="bg-white p-2 border rounded shadow">
          <div className="text-sm text-gray-600">{date}</div>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="text-sm">
              <span className={`font-medium ${p.dataKey === 'p1' ? 'text-blue-600' : 'text-purple-600'}`}>{p.name}: </span>
              ₹{Number(p.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, bottom: 20, left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(t) => new Date(t).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})} />
          <YAxis tickFormatter={(v)=>`₹${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="linear" dataKey="p1" stroke="#2563eb" dot={false} name="Stock 1" />
          <Line type="linear" dataKey="p2" stroke="#7c3aed" dot={false} name="Stock 2" />

          {pred1 && (
            <ReferenceDot x={new Date(pred1.year, (pred1.month || 1) - 1, pred1.day || 1).getTime()} y={pred1.predictedPrice} r={6} fill="#2563eb" stroke="#1e40af"/>
          )}
          {pred1 && (
            <ReferenceLine y={pred1.predictedPrice} stroke="#2563eb" strokeDasharray="4 4" />
          )}

          {pred2 && (
            <ReferenceDot x={new Date(pred2.year, (pred2.month || 1) - 1, pred2.day || 1).getTime()} y={pred2.predictedPrice} r={6} fill="#7c3aed" stroke="#5b21b6"/>
          )}
          {pred2 && (
            <ReferenceLine y={pred2.predictedPrice} stroke="#7c3aed" strokeDasharray="4 4" />
          )}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Compare: React.FC = () => {
  const { data: companies, isLoading: compLoading } = useQuery<Company[], Error>({ queryKey: ['companies'], queryFn: fetchCompanies });

  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const nextDayDate = new Date(today);
  nextDayDate.setDate(nextDayDate.getDate() + 1);
  const nextDay = nextDayDate.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(nextDay);

  const { data: histA } = useQuery<HistoricalData[], Error>({ queryKey: ['historical', a], queryFn: () => fetchHistoricalData(a), enabled: !!a });
  const { data: histB } = useQuery<HistoricalData[], Error>({ queryKey: ['historical', b], queryFn: () => fetchHistoricalData(b), enabled: !!b });

  const { year, month, day } = ((): any => {
    const d = new Date(selectedDate + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth()+1, day: d.getDate() };
  })();

  const { data: predA, isLoading: predALoading } = useQuery<Prediction, Error>({ queryKey: ['prediction', a, year, month, day], queryFn: () => a ? fetchPrediction(a,year,month,day) : Promise.resolve(null as any), enabled: !!a });
  const { data: predB, isLoading: predBLoading } = useQuery<Prediction, Error>({ queryKey: ['prediction', b, year, month, day], queryFn: () => b ? fetchPrediction(b,year,month,day) : Promise.resolve(null as any), enabled: !!b });

  const companyA = companies?.find(c=>c.ticker===a) ?? null;
  const companyB = companies?.find(c=>c.ticker===b) ?? null;

  const formatCurrency = (v?: number) => typeof v==='number' ? v.toLocaleString('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2}) : '—';

  const getChange = (p?: Prediction) => {
    if (!p) return null;
    const amount = p.predictedPrice - p.currentPrice;
    const percent = (amount / p.currentPrice) * 100;
    return { amount, percent, isPositive: amount>0 };
  };

  const changeA = getChange(predA);
  const changeB = getChange(predB);

  if (compLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner/></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compare Stocks</h1>
        <Link to="/dashboard" className="text-sm text-blue-600">Back</Link>
      </div>

      <div className="bg-white p-6 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Stock A</label>
          <select value={a} onChange={(e)=>setA(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select stock A</option>
            {companies?.map(c=> <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Stock B</label>
          <select value={b} onChange={(e)=>setB(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select stock B</option>
            {companies?.map(c=> <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Prediction Date</label>
          <input
            type="date"
            value={selectedDate}
            min={minDate}
            onChange={(e)=> setSelectedDate(e.target.value >= minDate ? e.target.value : minDate)}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border">
          <CombinedChart data1={histA ?? []} data2={histB ?? []} pred1={predA} pred2={predB} />
        </div>

        <aside className="bg-white p-6 rounded-xl border space-y-4">
          <div>
            <h4 className="text-sm font-semibold">Stock A</h4>
            <p className="text-lg font-bold">{companyA ? companyA.ticker : '—'}</p>
            <p className="text-sm">Current: {formatCurrency(predA?.currentPrice)}</p>
            <p className="text-sm">Predicted: {formatCurrency(predA?.predictedPrice)}</p>
            <p className="text-sm">Expected: {changeA ? `${changeA.isPositive?'+':''}${changeA.percent.toFixed(2)}% (${formatCurrency(changeA.amount)})` : '—'}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Stock B</h4>
            <p className="text-lg font-bold">{companyB ? companyB.ticker : '—'}</p>
            <p className="text-sm">Current: {formatCurrency(predB?.currentPrice)}</p>
            <p className="text-sm">Predicted: {formatCurrency(predB?.predictedPrice)}</p>
            <p className="text-sm">Expected: {changeB ? `${changeB.isPositive?'+':''}${changeB.percent.toFixed(2)}% (${formatCurrency(changeB.amount)})` : '—'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Compare;
