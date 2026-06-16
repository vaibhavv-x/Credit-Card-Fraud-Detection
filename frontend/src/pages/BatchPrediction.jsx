import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  ShieldAlert, RefreshCw, Upload, Download, FileText, 
  Search, ShieldCheck, CheckCircle, AlertTriangle 
} from 'lucide-react';

const BatchPrediction = () => {
  const [model, setModel] = useState('XGBoost');
  const [file, setFile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const modelOptions = [
    "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost", "LightGBM", "SVM"
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalytics(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setAnalytics(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);

    try {
      const res = await fetch('http://localhost:8000/api/predict/batch', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to process batch CSV file');
      }

      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger backend downloads (CSV or PDF)
  const handleExport = (format) => {
    window.open(`http://localhost:8000/api/predict/batch/export?format=${format}`, '_blank');
  };

  // Helper to download a test batch CSV file template
  const handleDownloadTemplate = () => {
    // Generate a mock CSV with Time, Amount, V1-V28 columns
    const cols = ["Time", "Amount", ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`)].join(",");
    
    // Create a few mock transaction lines
    const line1 = [1000, 3600.00, ...Array.from({ length: 28 }, () => (Math.random() * 2 - 1).toFixed(3))].join(",");
    const line2 = [5000, 96000.00, ...Array.from({ length: 28 }, () => (Math.random() * 6 - 3).toFixed(3))].join(","); // high risk amount/PCA
    const line3 = [12000, 680.00, ...Array.from({ length: 28 }, () => (Math.random() * 2 - 1).toFixed(3))].join(",");
    
    const csvContent = "data:text/csv;charset=utf-8," + [cols, line1, line2, line3].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fraud_test_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPredictions = analytics?.predictions.filter(p => 
    p.TransactionID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Cardholder.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const COLORS = ['#10B981', '#EF4444'];
  const chartData = analytics ? [
    { name: 'Genuine', value: analytics.genuine_count },
    { name: 'Fraudulent', value: analytics.fraud_count }
  ] : [];

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
            <ShieldAlert className="text-brandBlue" /> Batch Prediction Analytics
          </h1>
          <p className="text-slate-400 mt-1">Upload credit card transaction CSV files to run parallelized models and export PDF summary sheets.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">Target Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-slate-900 border border-darkBorder rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-brandPurple"
          >
            {modelOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 lg:col-span-1 flex flex-col justify-between space-y-6 h-fit">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Upload Batch File</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a transaction CSV file with <b>Time, Amount, V1-V28</b> columns. You can download our templates to test the parser.
            </p>
            <button 
              onClick={handleDownloadTemplate}
              className="text-xs text-brandBlue hover:text-brandBlue/80 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} /> Download Sample Template CSV
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Drag Box */}
            <div className="border-2 border-dashed border-darkBorder/60 hover:border-brandPurple/60 rounded-2xl p-6 text-center transition-all bg-slate-900/20 relative cursor-pointer group">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-slate-500 group-hover:text-brandPurple transition-colors" size={32} />
              <p className="text-xs font-semibold text-slate-300 mt-3">
                {file ? file.name : "Choose CSV file or drag here"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Accepts only .csv files</p>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 bg-brandPurple hover:bg-brandPurple/90 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-glowPurple/30 transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Scanning batch records...
                </>
              ) : (
                <>Process File</>
              )}
            </button>
          </form>
        </div>

        {/* Analytics Summary */}
        <div className="glass-panel p-6 lg:col-span-2 min-h-[300px] flex flex-col justify-between relative overflow-hidden">
          <AnimatePresence mode="wait">
            {analytics ? (
              <motion.div 
                key="analytics"
                className="grid md:grid-cols-3 gap-6 items-center h-full"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                {/* Aggregates */}
                <div className="space-y-4 col-span-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Evaluated</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{analytics.total_records}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Genuine</span>
                      <h4 className="text-lg font-bold text-neonGreen mt-0.5">{analytics.genuine_count}</h4>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Fraudulent</span>
                      <h4 className="text-lg font-bold text-neonRed mt-0.5">{analytics.fraud_count}</h4>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-darkBorder/40">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Fraud Ratio</span>
                    <p className="text-sm font-bold text-neonRed mt-0.5">{analytics.fraud_percentage}%</p>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="h-[200px] flex justify-center col-span-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Exports Panel */}
                <div className="space-y-4 col-span-1 bg-slate-900/40 border border-darkBorder p-5 rounded-2xl h-full flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Download Reports</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Export processed arrays and summary metrics charts directly.</p>
                  <div className="space-y-2.5">
                    <button 
                      onClick={() => handleExport('csv')}
                      className="w-full py-2 bg-slate-950 border border-darkBorder hover:border-brandPurple rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Download size={14} /> Export CSV predictions
                    </button>
                    <button 
                      onClick={() => handleExport('pdf')}
                      className="w-full py-2 bg-brandPurple hover:bg-brandPurple/90 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-glowPurple/20 transition-all"
                    >
                      <FileText size={14} /> Export PDF Report
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <div className="my-auto flex flex-col items-center justify-center text-center space-y-3">
                <AlertTriangle className="text-neonRed" size={32} />
                <h4 className="font-bold text-white">Batch Compilation Error</h4>
                <p className="text-xs text-slate-400 max-w-md">{error}</p>
              </div>
            ) : (
              <div className="my-auto text-center py-16 space-y-2">
                <Upload className="mx-auto text-slate-600 animate-pulse" size={40} />
                <h3 className="text-sm font-bold text-white">Process Transactions Batch</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Upload a transaction file in the left panel to display visual summaries and PDF downloads.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Batch Results Table */}
      {analytics && (
        <motion.div 
          className="glass-panel p-6 space-y-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Batch Transaction History</h2>
              <p className="text-xs text-slate-400">Processed transaction arrays (Showing top 200 records). Color-coded by probability risk.</p>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search by ID, Merchant, Holder..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-darkBorder rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brandPurple"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table min-w-[800px]">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Cardholder</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Fraud Probability</th>
                  <th>Risk Level</th>
                  <th>Model Verdict</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((row) => (
                  <tr key={row.TransactionID}>
                    <td className="font-mono text-slate-300 font-semibold">{row.TransactionID}</td>
                    <td>{row.Cardholder}</td>
                    <td>{row.Merchant}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-darkBorder text-slate-400 text-[10px]">
                        {row.Category}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-200">₹{row.Amount.toFixed(2)}</td>
                    <td className="font-mono text-xs">{(row.FraudProbability * 100).toFixed(4)}%</td>
                    <td>
                      <span className={`
                        px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${row.RiskLevel === 'High' ? 'bg-neonRed/10 text-neonRed border border-neonRed/20' : 
                          row.RiskLevel === 'Medium' ? 'bg-neonYellow/10 text-neonYellow border border-neonYellow/20' : 
                          'bg-neonGreen/10 text-neonGreen border border-neonGreen/20'}
                      `}>
                        {row.RiskLevel}
                      </span>
                    </td>
                    <td>
                      {row.PredictedClass === 1 ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-neonRed uppercase">
                          <ShieldAlert size={14} /> Flagged Fraud
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-neonGreen">
                          <ShieldCheck size={14} /> Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPredictions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No batch predictions matching search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BatchPrediction;
