import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { BarChart3, AlertTriangle, RefreshCw, Grid, TrendingUp, Sliders } from 'lucide-react';

const EDA = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEDAData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/eda/charts');
      if (!res.ok) throw new Error('Failed to load EDA chart coordinates');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEDAData();
  }, []);

  const COLORS = ['#10B981', '#EF4444']; // Genuine (Green) vs Fraud (Red)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <RefreshCw className="text-brandPurple animate-spin" size={40} />
        <p className="text-slate-400 font-medium">Computing exploratory visualizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center p-6">
        <AlertTriangle className="text-neonRed animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-white">EDA Pipeline Error</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
        <button onClick={fetchEDAData} className="px-5 py-2.5 rounded-xl bg-brandPurple hover:bg-brandPurple/90 text-white font-semibold flex items-center gap-2">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  // Format Correlation Heatmap Matrix
  const corrFeatures = Array.from(new Set(data?.correlation_heatmap.map(c => c.x) || []));
  const getCorrColor = (val) => {
    if (val > 0.5) return 'bg-brandPurple/80 text-white';
    if (val > 0.2) return 'bg-brandPurple/40 text-purple-200';
    if (val > 0.05) return 'bg-brandBlue/30 text-blue-200';
    if (val < -0.5) return 'bg-brandPink/80 text-white';
    if (val < -0.2) return 'bg-brandPink/40 text-pink-200';
    if (val < -0.05) return 'bg-brandBlue/10 text-blue-300';
    return 'bg-slate-900/40 text-slate-500';
  };

  return (
    <motion.div 
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <BarChart3 className="text-brandBlue" /> Exploratory Data Analysis
          </h1>
          <p className="text-slate-400 mt-1">Investigate target proportions, transaction distributions, and PCA spatial projections.</p>
        </div>
      </div>

      {/* Grid: Pie Chart vs Binned Amount */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Class distribution */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[420px]">
          <div>
            <h2 className="text-lg font-bold text-white">Class Imbalance Profiling</h2>
            <p className="text-xs text-slate-400">Ratio of genuine vs fraudulent transactions in database.</p>
          </div>
          <div className="flex-1 min-h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data?.class_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.class_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-slate-300 text-sm font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-darkBorder/40">
            Highly imbalanced classes reflect real financial situations, demonstrating why SMOTE class balancing is critical before model training.
          </div>
        </div>

        {/* Amount distribution */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[420px] lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-white">Amount Distribution by Class</h2>
            <p className="text-xs text-slate-400">Transaction counts across different log-normal Rupee buckets.</p>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.amount_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="bin" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                <Legend formatter={(value) => <span className="text-slate-300 text-sm capitalize">{value}</span>} />
                <Bar dataKey="genuine" fill="#10B981" radius={[4, 4, 0, 0]} name="Genuine" />
                <Bar dataKey="fraud" fill="#EF4444" radius={[4, 4, 0, 0]} name="Fraud" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: PCA Component Scatter vs Boxplots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PCA Component Scatter Plot */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[450px] lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-brandBlue" /> 2D PCA Space Projection
            </h2>
            <p className="text-xs text-slate-400">Interactive scatter plot showing the separation between Class 0 and Class 1 across V1 and V2 vectors.</p>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="V1 Component" stroke="#94a3b8" fontSize={11} />
                <YAxis type="number" dataKey="y" name="V2 Component" stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-darkBorder p-3 rounded-xl text-xs space-y-1.5 shadow-xl">
                          <p className="font-semibold text-white">ID: {data.id}</p>
                          <p className="text-slate-400">Merchant: {data.merchant}</p>
                          <p className="text-slate-200">Amount: ₹{data.amount.toFixed(2)}</p>
                          <p className="text-slate-400">V1: {data.x.toFixed(4)}</p>
                          <p className="text-slate-400">V2: {data.y.toFixed(4)}</p>
                          <p className={data.class === 1 ? "text-neonRed font-bold" : "text-neonGreen font-semibold"}>
                            {data.class === 1 ? "Class: Fraud" : "Class: Genuine"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Genuine" data={data?.pca_scatter.filter(p => p.class === 0)} fill="#3B82F6" opacity={0.6} line={false} />
                <Scatter name="Fraud" data={data?.pca_scatter.filter(p => p.class === 1)} fill="#EF4444" opacity={0.9} shape="circle" />
                <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Boxplots statistics display */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[450px]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders size={18} className="text-brandPurple" /> Amount Boxplot Quartiles
            </h2>
            <p className="text-xs text-slate-400">Legitimate vs Fraudulent transaction value distribution quartiles.</p>
          </div>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {/* Genuine Amounts */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-neonGreen">Genuine (Class = 0)</span>
                <span className="text-xs text-slate-400">Median: ₹{data?.boxplots.genuine.median.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-darkBorder rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Min:</span> <span className="text-slate-300">₹{data?.boxplots.genuine.min.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Q1 (25th):</span> <span className="text-slate-300">₹{data?.boxplots.genuine.q1.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Q3 (75th):</span> <span className="text-slate-300">₹{data?.boxplots.genuine.q3.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Outlier:</span> <span className="text-slate-300">₹{data?.boxplots.genuine.max.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Fraudulent Amounts */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-neonRed">Fraudulent (Class = 1)</span>
                <span className="text-xs text-slate-400">Median: ₹{data?.boxplots.fraud.median.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-darkBorder rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Min:</span> <span className="text-slate-300">₹{data?.boxplots.fraud.min.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Q1 (25th):</span> <span className="text-slate-300">₹{data?.boxplots.fraud.q1.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Q3 (75th):</span> <span className="text-slate-300">₹{data?.boxplots.fraud.q3.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Outlier:</span> <span className="text-slate-300">₹{data?.boxplots.fraud.max.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Correlation Heatmap Grid */}
      <div className="glass-panel p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Grid size={18} className="text-brandBlue" /> Correlation Heatmap (Top PCA Components & Features)
          </h2>
          <p className="text-xs text-slate-400">Shows linear relationship strength with the target Class. Purple denotes positive correlation, pink represents negative.</p>
        </div>

        {/* Heatmap Grid Render */}
        <div className="overflow-x-auto">
          <div className="min-w-[750px] bg-slate-950/20 border border-darkBorder/40 rounded-xl p-4">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${corrFeatures.length + 1}, minmax(0, 1fr))` }}>
              {/* Top empty header item */}
              <div className="p-2.5 text-xs font-semibold text-slate-400 text-right pr-4 uppercase">Feature</div>
              {/* Header column names */}
              {corrFeatures.map(f => (
                <div key={f} className="p-2.5 text-xs font-bold text-slate-400 text-center uppercase tracking-wider">{f}</div>
              ))}

              {corrFeatures.map((yFeat) => (
                <React.Fragment key={yFeat}>
                  {/* Row title */}
                  <div className="p-2.5 text-xs font-bold text-slate-300 border-b border-darkBorder/20 flex items-center justify-end pr-4 uppercase tracking-wider bg-slate-900/30">
                    {yFeat}
                  </div>
                  {/* Heatmap values */}
                  {corrFeatures.map((xFeat) => {
                    const cell = data?.correlation_heatmap.find(c => c.x === xFeat && c.y === yFeat);
                    const val = cell ? cell.value : 0.0;
                    return (
                      <div 
                        key={`${yFeat}-${xFeat}`} 
                        className={`p-2 text-[11px] font-mono font-bold text-center border-b border-r border-darkBorder/25 flex flex-col justify-center transition-transform hover:scale-105 hover:z-10 ${getCorrColor(val)}`}
                        title={`Correlation between ${yFeat} and ${xFeat}: ${val}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EDA;
