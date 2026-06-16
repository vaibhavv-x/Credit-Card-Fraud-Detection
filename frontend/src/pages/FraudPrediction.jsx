import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { PlayCircle, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

const FraudPrediction = () => {
  const [model, setModel] = useState('XGBoost');
  const [formData, setFormData] = useState({
    Time: 86400.0,
    Amount: 125.50,
    V1: -0.5, V2: 0.8, V3: 1.2, V4: -0.4, V5: 0.3, V6: -0.2, V7: 0.5, V8: -0.1, V9: 0.2, V10: -0.3,
    V11: 0.4, V12: -0.5, V13: 0.1, V14: -0.8, V15: 0.2, V16: -0.4, V17: -0.9, V18: 0.3, V19: -0.1, V20: 0.0,
    V21: -0.1, V22: 0.2, V23: -0.1, V24: 0.3, V25: -0.2, V26: 0.1, V27: -0.1, V28: 0.0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const modelOptions = [
    "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost", "LightGBM", "SVM"
  ];

  // Templates to make manual input easy
  const templates = {
    legit: {
      Time: 43200.0, Amount: 32.75,
      V1: 1.15, V2: -0.25, V3: 0.85, V4: 0.35, V5: -0.75, V6: 0.12, V7: -0.45, V8: 0.08, V9: 0.54, V10: -0.12,
      V11: -0.85, V12: 0.92, V13: 0.45, V14: 0.24, V15: -0.62, V16: 0.38, V17: -0.21, V18: -0.45, V19: 0.18, V20: -0.05,
      V21: -0.08, V22: -0.15, V23: 0.05, V24: 0.12, V25: 0.22, V26: -0.38, V27: 0.02, V28: 0.01
    },
    fraud: {
      Time: 125000.0, Amount: 950.00,
      V1: -2.35, V2: 3.42, V3: -4.85, V4: 5.12, V5: -2.05, V6: -1.85, V7: -3.94, V8: 1.75, V9: -3.24, V10: -6.45,
      V11: 4.85, V12: -7.21, V13: 0.82, V14: -9.84, V15: 0.15, V16: -5.92, V17: -11.45, V18: -3.85, V19: 1.45, V20: 0.85,
      V21: 0.92, V22: -0.45, V23: -0.38, V24: -0.82, V25: 0.42, V26: 0.72, V27: 0.85, V28: -0.35
    },
    random: () => {
      const randData = {
        Time: Math.round(Math.random() * 172800),
        Amount: Math.round(Math.random() * 2500 * 100) / 100
      };
      for (let i = 1; i <= 28; i++) {
        randData[`V${i}`] = Math.round((Math.random() * 8 - 4) * 1000) / 1000;
      }
      return randData;
    }
  };

  const handleAutofill = (type) => {
    if (type === 'random') {
      setFormData(templates.random());
    } else {
      setFormData(templates[type]);
    }
    setResult(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0.0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/predict?model=${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Inference server returned an error');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <PlayCircle className="text-brandBlue" /> Real-time Fraud Predictor
          </h1>
          <p className="text-slate-400 mt-1">Submit manual transactional inputs to evaluate the live probability risk output.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">Model Selector:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-slate-900 border border-darkBorder rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple"
          >
            {modelOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400">Quick templates:</span>
        <button 
          onClick={() => handleAutofill('legit')}
          className="px-3.5 py-1.5 rounded-lg bg-neonGreen/10 border border-neonGreen/30 text-neonGreen text-xs font-semibold hover:bg-neonGreen/20 transition-all"
        >
          Legitimate Template
        </button>
        <button 
          onClick={() => handleAutofill('fraud')}
          className="px-3.5 py-1.5 rounded-lg bg-neonRed/10 border border-neonRed/30 text-neonRed text-xs font-semibold hover:bg-neonRed/20 transition-all"
        >
          High-Risk Fraud Template
        </button>
        <button 
          onClick={() => handleAutofill('random')}
          className="px-3.5 py-1.5 rounded-lg bg-brandBlue/10 border border-brandBlue/30 text-brandBlue text-xs font-semibold hover:bg-brandBlue/20 transition-all"
        >
          Random Template
        </button>
      </div>

      {/* Grid: Form vs Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles size={18} className="text-brandPurple" /> Manual Vector Entry
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase">Time (sec)</label>
                <input 
                  type="number" step="any" name="Time" value={formData.Time} onChange={handleInputChange}
                  className="bg-slate-950 border border-darkBorder rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brandPurple"
                />
              </div>
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase">Amount (₹)</label>
                <input 
                  type="number" step="any" name="Amount" value={formData.Amount} onChange={handleInputChange}
                  className="bg-slate-950 border border-darkBorder rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brandPurple"
                />
              </div>
              
              {/* V1 to V28 PCA values */}
              {Array.from({ length: 28 }, (_, i) => {
                const name = `V${i + 1}`;
                return (
                  <div key={name} className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-semibold uppercase">{name}</label>
                    <input 
                      type="number" step="any" name={name} value={formData[name]} onChange={handleInputChange}
                      className="bg-slate-950/60 border border-darkBorder/60 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brandPurple"
                    />
                  </div>
                );
              })}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brandBlue to-brandPurple hover:from-brandBlue/90 hover:to-brandPurple/90 text-white font-bold shadow-glowPurple hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Computing Fraud Inference...
                </>
              ) : (
                <>
                  Run Prediction
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Result Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between min-h-[450px]">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Analysis Results</h2>
            <p className="text-xs text-slate-400">Model output parameters and risk rating score.</p>
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                className="space-y-6 my-auto flex-1 flex flex-col justify-center"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                {/* Result header */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    {result.prediction === 1 ? (
                      <div className="h-16 w-16 rounded-full bg-neonRed/10 border border-neonRed/30 flex items-center justify-center text-neonRed shadow-glowRed">
                        <ShieldAlert size={36} />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-neonGreen/10 border border-neonGreen/30 flex items-center justify-center text-neonGreen shadow-lg">
                        <ShieldCheck size={36} />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className={`text-2xl font-extrabold uppercase ${result.prediction === 1 ? 'text-neonRed' : 'text-neonGreen'}`}>
                      {result.prediction === 1 ? 'Fraudulent' : 'Genuine'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Model assessment</p>
                  </div>
                </div>

                {/* Risk Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Risk Score Meter:</span>
                    <span className={result.risk_level === 'High' ? 'text-neonRed font-bold' : result.risk_level === 'Medium' ? 'text-neonYellow font-bold' : 'text-neonGreen font-semibold'}>
                      {result.risk_score}% ({result.risk_level})
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-darkBorder">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${result.prediction === 1 ? 'from-brandPurple to-neonRed' : 'from-brandBlue to-neonGreen'}`}
                      style={{ width: `${result.risk_score}%` }}
                    />
                  </div>
                </div>

                {/* Metrics detail */}
                <div className="bg-slate-950/40 p-4 border border-darkBorder/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Probability:</span>
                    <span className="text-slate-300 font-semibold">{result.probability.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="text-slate-300 font-semibold">{result.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Model:</span>
                    <span className="text-slate-300 font-semibold font-mono">{model}</span>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <div className="my-auto flex flex-col items-center text-center space-y-3">
                <AlertTriangle className="text-neonRed" size={32} />
                <h4 className="text-sm font-bold text-white">Prediction Engine Failed</h4>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
            ) : (
              <div className="my-auto text-center py-12 space-y-2">
                <p className="text-sm text-slate-500">Waiting for transaction query...</p>
                <p className="text-[10px] text-slate-600 max-w-xs mx-auto">Fill in the fields or click a quick template above, then click Run Prediction.</p>
              </div>
            )}
          </AnimatePresence>

          <div className="text-[10px] text-slate-600 border-t border-darkBorder/40 pt-3">
            Inference engine runs standard scaling on Time and Amount before calling the model pipeline.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FraudPrediction;
