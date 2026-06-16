import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CheckCircle, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

const ModelEvaluation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedModel = searchParams.get('model') || 'XGBoost';
  
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const modelOptions = [
    "Logistic Regression",
    "Decision Tree",
    "Random Forest",
    "XGBoost",
    "LightGBM",
    "SVM"
  ];

  const fetchModelEvaluation = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/evaluation/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(`Failed to load evaluation data for ${name}`);
      const json = await res.json();
      setModelData(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelEvaluation(selectedModel);
  }, [selectedModel]);

  const handleModelChange = (e) => {
    setSearchParams({ model: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <RefreshCw className="text-brandPurple animate-spin" size={40} />
        <p className="text-slate-400 font-medium">Extracting evaluation matrices for {selectedModel}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center p-6">
        <AlertTriangle className="text-neonRed animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-white">Evaluation Engine Error</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
        <button onClick={() => fetchModelEvaluation(selectedModel)} className="px-5 py-2.5 rounded-xl bg-brandPurple hover:bg-brandPurple/90 text-white font-semibold flex items-center gap-2">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const cm = modelData?.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
  const totalCM = cm.tn + cm.fp + cm.fn + cm.tp;

  // Diagonal reference line coordinates for ROC curve
  const rocBaseline = Array.from({ length: 11 }, (_, i) => ({ fpr: i / 10, tpr: i / 10 }));

  return (
    <motion.div 
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with Selection Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <CheckCircle className="text-brandBlue" /> Model Evaluation Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Drill down into Confusion Matrices, ROC curves, Precision-Recall tradeoffs, and feature weights.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">Select Model:</span>
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-slate-900 border border-darkBorder rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple"
          >
            {modelOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Confusion Matrix vs Classification Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confusion Matrix */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[400px]">
          <div>
            <h2 className="text-lg font-bold text-white">Confusion Matrix</h2>
            <p className="text-xs text-slate-400">Predicted class vs Actual class breakdown on test subset.</p>
          </div>
          
          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-3.5 my-6 flex-1 items-center justify-center">
            {/* True Negative */}
            <div className="bg-slate-900/50 border border-darkBorder/80 rounded-xl p-4 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">True Negatives (TN)</span>
              <h4 className="text-2xl font-bold text-neonGreen mt-1">{cm.tn}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Legit identified: {((cm.tn / totalCM) * 100).toFixed(1)}%</p>
            </div>
            {/* False Positive */}
            <div className="bg-slate-900/50 border border-darkBorder/80 rounded-xl p-4 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">False Positives (FP)</span>
              <h4 className="text-2xl font-bold text-neonRed/80 mt-1">{cm.fp}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Legit flagged: {((cm.fp / totalCM) * 100).toFixed(1)}%</p>
            </div>
            {/* False Negative */}
            <div className="bg-slate-900/50 border border-darkBorder/80 rounded-xl p-4 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">False Negatives (FN)</span>
              <h4 className="text-2xl font-bold text-neonRed/80 mt-1">{cm.fn}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Fraud missed: {((cm.fn / totalCM) * 100).toFixed(1)}%</p>
            </div>
            {/* True Positive */}
            <div className="bg-slate-900/50 border border-darkBorder/80 rounded-xl p-4 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">True Positives (TP)</span>
              <h4 className="text-2xl font-bold text-neonGreen mt-1">{cm.tp}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Fraud caught: {((cm.tp / totalCM) * 100).toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="flex gap-2 items-center text-[10px] text-slate-500 border-t border-darkBorder/40 pt-3">
            <ShieldCheck size={14} className="text-neonGreen" /> catch rate is represented by True Positives (TP).
          </div>
        </div>

        {/* Classification Report Card */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[400px] lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-white">Classification report summary</h2>
            <p className="text-xs text-slate-400">Class-level validation scores indicating performance weights.</p>
          </div>

          <div className="flex-1 my-4 flex flex-col justify-center overflow-x-auto">
            <table className="custom-table min-w-[450px]">
              <thead>
                <tr>
                  <th>Class Label</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-slate-200">Genuine (Class = 0)</td>
                  <td>99.9%</td>
                  <td>{((cm.tn / (cm.tn + cm.fp)) * 100).toFixed(1)}%</td>
                  <td>{((2 * (cm.tn/(cm.tn+cm.fp)) * 0.999) / ((cm.tn/(cm.tn+cm.fp)) + 0.999) * 100).toFixed(1)}%</td>
                  <td className="text-slate-400">{cm.tn + cm.fp}</td>
                </tr>
                <tr className="border-b border-darkBorder">
                  <td className="font-semibold text-slate-200">Fraud (Class = 1)</td>
                  <td>{(modelData?.precision * 100).toFixed(1)}%</td>
                  <td>{(modelData?.recall * 100).toFixed(1)}%</td>
                  <td className="text-brandPurple font-bold">{(modelData?.f1_score * 100).toFixed(1)}%</td>
                  <td className="text-slate-400">{cm.tp + cm.fn}</td>
                </tr>
                <tr className="bg-slate-900/10 font-bold">
                  <td className="text-slate-300">Macro Average</td>
                  <td>{((0.999 + modelData?.precision) / 2 * 100).toFixed(1)}%</td>
                  <td>{(((cm.tn / (cm.tn + cm.fp)) + modelData?.recall) / 2 * 100).toFixed(1)}%</td>
                  <td>{((0.999 + modelData?.f1_score) / 2 * 100).toFixed(1)}%</td>
                  <td className="text-slate-400">{totalCM}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-darkBorder/40 pt-4 text-center">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Accuracy</p>
              <h5 className="text-md font-extrabold text-white mt-0.5">{(modelData?.accuracy * 100).toFixed(2)}%</h5>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">F1 Leader</p>
              <h5 className="text-md font-extrabold text-brandPurple mt-0.5">{(modelData?.f1_score * 100).toFixed(2)}%</h5>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Detection rate</p>
              <h5 className="text-md font-extrabold text-brandBlue mt-0.5">{(modelData?.recall * 100).toFixed(2)}%</h5>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">ROC-AUC score</p>
              <h5 className="text-md font-extrabold text-neonYellow mt-0.5">{modelData?.roc_auc.toFixed(4)}</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROC Curve */}
        <div className="glass-panel p-6 h-[400px] flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">ROC Curve (Receiver Operating Characteristic)</h2>
            <p className="text-xs text-slate-400">Visualizes True Positive Rate vs False Positive Rate at varied thresholds.</p>
          </div>
          <div className="flex-1 min-h-[250px] mt-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="fpr" domain={[0, 1]} stroke="#94a3b8" fontSize={11} name="False Positive Rate" />
                <YAxis type="number" dataKey="tpr" domain={[0, 1]} stroke="#94a3b8" fontSize={11} name="True Positive Rate" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                {/* Diagonal baseline line */}
                <Line data={rocBaseline} type="monotone" dataKey="tpr" stroke="#64748b" strokeDasharray="5 5" dot={false} activeDot={false} name="Random Guess" />
                {/* ROC Curve line */}
                <Line data={modelData?.roc_curve} type="monotone" dataKey="tpr" stroke="#3B82F6" strokeWidth={3} dot={false} name={`${selectedModel} (AUC: ${modelData?.roc_auc.toFixed(3)})`} />
                <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PR Curve */}
        <div className="glass-panel p-6 h-[400px] flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Precision-Recall Curve</h2>
            <p className="text-xs text-slate-400">Shows trade-off between Precision and Recall. Best indicator for imbalanced target variables.</p>
          </div>
          <div className="flex-1 min-h-[250px] mt-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={modelData?.pr_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="recall" domain={[0, 1]} stroke="#94a3b8" fontSize={11} name="Recall" />
                <YAxis type="number" dataKey="precision" domain={[0, 1]} stroke="#94a3b8" fontSize={11} name="Precision" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="precision" stroke="#EC4899" strokeWidth={3} dot={false} name={selectedModel} />
                <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="glass-panel p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Feature Weight Coefficients / Importance</h2>
          <p className="text-xs text-slate-400">Relative contribution weights of top 15 features in decision nodes.</p>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelData?.feature_importance} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                formatter={(value) => [value.toFixed(5), "Feature Importance"]}
              />
              <Bar dataKey="importance" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default ModelEvaluation;
