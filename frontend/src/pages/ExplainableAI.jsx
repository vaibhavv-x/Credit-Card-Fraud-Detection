import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Info, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ExplainableAI = () => {
  const [model, setModel] = useState('XGBoost');
  const [activeTab, setActiveTab] = useState('local');
  const [transactionType, setTransactionType] = useState('fraud'); // 'legit' or 'fraud'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Global features importance
  const [globalImportance, setGlobalImportance] = useState([]);

  const modelOptions = [
    "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost", "LightGBM", "SVM"
  ];

  // Pre-defined transaction parameters for easy SHAP profiling
  const transactions = {
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
    }
  };

  const fetchSHAP = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Local SHAP Explanation (via predict route which returns shap object)
      const payload = transactions[transactionType];
      const res = await fetch(`http://localhost:8000/api/predict?model=${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to run SHAP prediction calculation');
      const json = await res.json();
      setData(json);

      // Fetch Global Feature Importance for current model
      const evalRes = await fetch(`http://localhost:8000/api/models/evaluation/${encodeURIComponent(model)}`);
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setGlobalImportance(evalData.feature_importance || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSHAP();
  }, [model, transactionType]);

  const explanations = data?.shap?.explanations || [];
  const baseValue = data?.shap?.base_value || 0.0;
  const predictionProb = data?.shap?.prediction_probability || 0.0;

  // Filter explanations to only top 10 contributing vectors to avoid vertical UI clutter
  const topExplanations = explanations.slice(0, 10);

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
            <Eye className="text-brandBlue" /> Explainable AI (XAI)
          </h1>
          <p className="text-slate-400 mt-1">Deconstruct the black box using SHAP values (SHapley Additive exPlanations) to verify feature signals.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Model:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-900 border border-darkBorder rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-brandPurple"
            >
              {modelOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-darkBorder/30">
        <button
          onClick={() => setActiveTab('local')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'local' ? 'border-brandPurple text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Local Explanation (Waterfall)
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'global' ? 'border-brandPurple text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Global Model Behavior
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            className="flex flex-col items-center justify-center min-h-[50vh] space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCw className="text-brandPurple animate-spin" size={40} />
            <p className="text-slate-400 font-medium">Computing additive Shapley coordinates...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            key="error"
            className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AlertTriangle className="text-neonRed" size={40} />
            <h3 className="text-lg font-bold text-white">SHAP Calculations Timeout</h3>
            <p className="text-xs text-slate-400 max-w-sm">{error}</p>
            <button onClick={fetchSHAP} className="px-4 py-2 bg-brandPurple text-white font-bold rounded-lg">Retry</button>
          </motion.div>
        ) : activeTab === 'local' ? (
          <motion.div 
            key="local"
            className="space-y-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {/* Transaction Profile Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Select Test Profile:</span>
              <button 
                onClick={() => setTransactionType('fraud')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${transactionType === 'fraud' ? 'bg-neonRed/10 border-neonRed text-neonRed' : 'bg-slate-900 border-darkBorder text-slate-400'}`}
              >
                High-Risk Fraud Profile
              </button>
              <button 
                onClick={() => setTransactionType('legit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${transactionType === 'legit' ? 'bg-neonGreen/10 border-neonGreen text-neonGreen' : 'bg-slate-900 border-darkBorder text-slate-400'}`}
              >
                Legitimate Profile
              </button>
            </div>

            {/* Local waterfall layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Waterfall chart explanation */}
              <div className="glass-panel p-6 lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Local SHAP Waterfall Explanation</h2>
                  <p className="text-xs text-slate-400">Illustrating how each feature adds or subtracts from the model's base expectation value.</p>
                </div>

                {/* Custom Waterfall List Render */}
                <div className="space-y-4 pt-2">
                  {/* Expectation baseline */}
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 pb-2 border-b border-darkBorder/30">
                    <span>Base Value (Expected Probability)</span>
                    <span className="font-mono text-slate-200">{(baseValue * 100).toFixed(2)}%</span>
                  </div>

                  {/* Waterfall row items */}
                  <div className="space-y-3.5">
                    {topExplanations.map((item, index) => {
                      const isPositive = item.shap_value >= 0;
                      // Calculate width proportion (normalize to max value)
                      const maxVal = Math.max(...explanations.map(e => Math.abs(e.shap_value)), 0.1);
                      const widthPct = Math.min((Math.abs(item.shap_value) / maxVal) * 100, 100);
                      
                      return (
                        <div key={index} className="grid grid-cols-4 gap-4 items-center">
                          {/* Feature details */}
                          <div className="col-span-1 text-xs">
                            <span className="font-bold text-slate-300">{item.feature}</span>
                            <span className="block text-[10px] text-slate-500 font-mono">val: {item.display_value}</span>
                          </div>

                          {/* Graphical bar */}
                          <div className="col-span-2 relative h-5 bg-slate-950/40 rounded border border-darkBorder/40 overflow-hidden flex items-center">
                            {isPositive ? (
                              <div 
                                className="h-full bg-gradient-to-r from-neonRed/40 to-neonRed rounded-r absolute left-1/2" 
                                style={{ width: `${widthPct / 2}%` }}
                              />
                            ) : (
                              <div 
                                className="h-full bg-gradient-to-l from-brandBlue/40 to-brandBlue rounded-l absolute right-1/2" 
                                style={{ width: `${widthPct / 2}%` }}
                              />
                            )}
                            {/* Baseline center indicator */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700/60" />
                          </div>

                          {/* SHAP value count */}
                          <div className="col-span-1 text-right text-xs font-semibold font-mono">
                            <span className={isPositive ? 'text-neonRed' : 'text-brandBlue'}>
                              {isPositive ? '+' : ''}{(item.shap_value * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Prediction Output */}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-200 pt-3 border-t border-darkBorder/60">
                    <span>Prediction Output Probability</span>
                    <span className={predictionProb >= 0.7 ? 'text-neonRed font-extrabold text-sm' : 'text-neonGreen font-extrabold text-sm'}>
                      {(predictionProb * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Educational info panel */}
              <div className="glass-panel p-6 flex flex-col justify-between h-[480px]">
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Info size={16} className="text-brandPurple" /> Reading SHAP Values
                  </h3>
                  <div className="space-y-3.5 text-xs leading-relaxed text-slate-400">
                    <p>
                      <b>SHAP values</b> represent the additive contribution of each parameter in driving the prediction away from the baseline expected target class.
                    </p>
                    <p>
                      <span className="text-neonRed font-semibold">Red (+) Positive values</span> increase the likelihood of fraud prediction. Typically, larger Transaction Amounts or anomalous V14/V12 PCA vectors push the risk metrics higher.
                    </p>
                    <p>
                      <span className="text-brandBlue font-semibold">Blue (-) Negative values</span> act as protective signals, reducing the probability score and driving the decision nodes back toward the "Legitimate" classification.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 border border-darkBorder rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Classification Verdict</span>
                  <div className="flex items-center gap-2 mt-1">
                    {predictionProb >= 0.7 ? (
                      <>
                        <ShieldAlert className="text-neonRed" size={16} />
                        <span className="font-extrabold text-neonRed uppercase">High Risk Flagged</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="text-neonGreen" size={16} />
                        <span className="font-semibold text-neonGreen">Verified Legit Transaction</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="global"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {/* Global Features Importance */}
            <div className="glass-panel p-6 lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu size={18} className="text-brandBlue" /> Global SHAP Summary
                </h2>
                <p className="text-xs text-slate-400">Displays the average absolute impact of features across all validation records.</p>
              </div>

              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalImportance.slice(0, 12)} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} width={60} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      formatter={(value) => [value.toFixed(5), "Mean Absolute SHAP Value"]}
                    />
                    <Bar dataKey="importance" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model behaviors explanation */}
            <div className="glass-panel p-6 space-y-4 h-[450px] overflow-y-auto">
              <h3 className="text-md font-bold text-white">Global Model Behavior</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Global explanation reveals the macro-architecture of model parameters. It indicates which features are generally most predictive of credit card fraud.
              </p>
              <div className="space-y-3 pt-3 border-t border-darkBorder/40 text-xs leading-relaxed text-slate-400">
                <p>
                  <b>1. Top Features:</b> Feature vectors like V14, V12, and V17 typically rank as the strongest discriminators, holding highest weights across almost all tree-based classifiers.
                </p>
                <p>
                  <b>2. Amount Impact:</b> Unlike normal transactions, the Amount holds a moderate but critical role. High outlier amounts (₹40,000+) combined with negative PCA weights immediately trigger the warning flags.
                </p>
                <p>
                  <b>3. Time Element:</b> The Time elapsed serves as a temporal context but holds lower predictive coefficient weights compared to the anonymized vectors.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExplainableAI;
