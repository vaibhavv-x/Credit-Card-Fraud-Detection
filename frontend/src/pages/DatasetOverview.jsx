import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, ShieldCheck, ShieldAlert, AlertTriangle, 
  Search, RefreshCw, Layers, FileCode 
} from 'lucide-react';

const DatasetOverview = () => {
  const [stats, setStats] = useState(null);
  const [samples, setSamples] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stats
      const statsRes = await fetch('http://localhost:8000/api/dataset/stats');
      if (!statsRes.ok) throw new Error('Failed to load dataset stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch samples
      const sampleRes = await fetch('http://localhost:8000/api/dataset/sample?limit=150');
      if (!sampleRes.ok) throw new Error('Failed to load transaction samples');
      const sampleData = await sampleRes.json();
      setSamples(sampleData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSamples = samples.filter(s => 
    s.TransactionID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.Merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.Cardholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.Category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <RefreshCw className="text-brandPurple animate-spin" size={40} />
        <p className="text-slate-400 font-medium">Querying database engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center p-6">
        <AlertTriangle className="text-neonRed animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-white">Database Query Failure</h2>
        <p className="text-slate-400 max-w-md">{error}. Make sure the FastAPI backend is running on port 8000.</p>
        <button 
          onClick={fetchData} 
          className="px-5 py-2.5 rounded-xl bg-brandPurple hover:bg-brandPurple/90 text-white font-semibold flex items-center gap-2"
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Database className="text-brandBlue" /> Dataset Overview
          </h1>
          <p className="text-slate-400 mt-1">Real-time profiling and structural stats of the current credit card transaction database.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="self-start md:self-auto px-4 py-2 border border-darkBorder rounded-xl hover:bg-slate-900/50 text-slate-300 flex items-center gap-2 text-sm transition-all"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Stats Cards Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={cardVariants}>
        {/* Total Records */}
        <div className="glass-panel p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-brandBlue/10 text-brandBlue flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.total_records.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Scanned records</p>
          </div>
        </div>

        {/* Genuine count */}
        <div className="glass-panel p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-neonGreen/10 text-neonGreen flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Genuine Transactions</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.genuine_count.toLocaleString()}</h3>
            <p className="text-[10px] text-neonGreen font-semibold mt-0.5">
              {stats ? (100 - stats.fraud_percentage).toFixed(2) : 0}% Legit
            </p>
          </div>
        </div>

        {/* Fraud count */}
        <div className="glass-panel p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-neonRed/10 text-neonRed flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fraudulent Flagged</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.fraud_count.toLocaleString()}</h3>
            <p className="text-[10px] text-neonRed font-semibold mt-0.5">
              {stats?.fraud_percentage.toFixed(2)}% Class Imbalance
            </p>
          </div>
        </div>

        {/* Missing values */}
        <div className="glass-panel p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-neonYellow/10 text-neonYellow flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Missing Values</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.missing_values}</h3>
            <p className="text-[10px] text-neonGreen font-semibold mt-0.5">Clean Data</p>
          </div>
        </div>
      </motion.div>

      {/* Descriptive Stats Table */}
      <motion.div className="grid lg:grid-cols-3 gap-8" variants={cardVariants}>
        {/* Description card */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-brandPurple" /> Dataset Profiling
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            The dataset models real-world credit card transactions over a simulated 48-hour timeline.
            It contains 28 PCA-transformed feature vectors (V1-V28) which reflect anonymous variables like card brands, locations, and terminal details to preserve customer privacy.
          </p>
          <div className="space-y-2 pt-2 border-t border-darkBorder/40 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">PCA Feature Vectors:</span>
              <span className="text-slate-200">V1 to V28 (Float64)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Chronological Index:</span>
              <span className="text-slate-200">Time (Seconds relative)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Anomalous Target:</span>
              <span className="text-slate-200">Class (0 = Safe, 1 = Fraud)</span>
            </div>
          </div>
        </div>

        {/* Stats Summary Table */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-2 overflow-x-auto">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCode size={18} className="text-brandBlue" /> Feature Distributions (Raw)
          </h2>
          <table className="custom-table min-w-[500px]">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Mean Value</th>
                <th>Standard Deviation (Std)</th>
                <th>Minimum Value</th>
                <th>Maximum Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-slate-200">Amount (₹)</td>
                <td>₹{stats?.stats.Amount.mean.toFixed(2)}</td>
                <td>₹{stats?.stats.Amount.std.toFixed(2)}</td>
                <td>₹{stats?.stats.Amount.min.toFixed(2)}</td>
                <td>₹{stats?.stats.Amount.max.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-200">Time (sec)</td>
                <td>{stats?.stats.Time.mean.toLocaleString()}s</td>
                <td>{stats?.stats.Time.std.toLocaleString()}s</td>
                <td>{stats?.stats.Time.min.toLocaleString()}s</td>
                <td>{stats?.stats.Time.max.toLocaleString()}s</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-200">V1 - V28 vectors</td>
                <td>~0.00</td>
                <td>~1.00</td>
                <td>Varies (PCA normalized)</td>
                <td>Varies (PCA normalized)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Sample Transactions Table */}
      <motion.div className="glass-panel p-6 space-y-6" variants={cardVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Database Records Sample</h2>
            <p className="text-xs text-slate-400">First 150 raw records loaded sequentially. Use search to filter.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, Merchant, Holder..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-darkBorder rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table min-w-[800px]">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Time (sec)</th>
                <th>Cardholder</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((row) => (
                <tr key={row.TransactionID}>
                  <td className="font-mono text-slate-300 font-semibold">{row.TransactionID}</td>
                  <td>{row.Time.toLocaleString()}s</td>
                  <td>{row.Cardholder}</td>
                  <td>{row.Merchant}</td>
                  <td>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-darkBorder text-slate-300 text-xs">
                      {row.Category}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-200">₹{row.Amount.toFixed(2)}</td>
                  <td>
                    {row.Class === 1 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-neonRed/10 border border-neonRed/20 text-xs font-bold text-neonRed uppercase">
                        Fraud
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-neonGreen/10 border border-neonGreen/20 text-xs font-semibold text-neonGreen">
                        Genuine
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSamples.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No transactions matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DatasetOverview;
