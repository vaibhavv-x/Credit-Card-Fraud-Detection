import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Cpu, RefreshCw, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MLModels = () => {
  const [comparison, setComparison] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('f1_score');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchModelsComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/models/compare');
      if (!res.ok) throw new Error('Failed to load models comparison metrics');
      const json = await res.json();
      setComparison(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsComparison();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <RefreshCw className="text-brandPurple animate-spin" size={40} />
        <p className="text-slate-400 font-medium">Extracting classifier performance stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center p-6">
        <AlertTriangle className="text-neonRed animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-white">Metrics Retrieval Error</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
        <button onClick={fetchModelsComparison} className="px-5 py-2.5 rounded-xl bg-brandPurple hover:bg-brandPurple/90 text-white font-semibold flex items-center gap-2">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const metricsInfo = {
    f1_score: { name: "F1 Score", desc: "Harmonic mean of precision and recall. Best overall indicator for imbalanced classification.", color: "#8B5CF6" },
    recall: { name: "Recall (Sensitivity)", desc: "Proportion of actual frauds correctly flagged. Critically important to minimize financial losses.", color: "#3B82F6" },
    precision: { name: "Precision", desc: "Proportion of flagged transactions that are actually fraud. Important to avoid customer friction.", color: "#EC4899" },
    accuracy: { name: "Accuracy", desc: "Overall correct prediction rate. Can be misleading in imbalanced contexts.", color: "#10B981" },
    roc_auc: { name: "ROC AUC", desc: "Area Under Receiver Operating Characteristic Curve. Evaluates probability sorting strength.", color: "#F59E0B" },
    training_time: { name: "Training Time (s)", desc: "Seconds taken to train the estimator on balanced SMOTE samples.", color: "#A855F7" }
  };

  // Find best model for a metric
  const getBestModel = (metric) => {
    if (comparison.length === 0) return null;
    let best = comparison[0];
    for (let m of comparison) {
      if (metric === 'training_time') {
        if (m[metric] < best[metric]) best = m;
      } else {
        if (m[metric] > best[metric]) best = m;
      }
    }
    return best;
  };

  const bestModel = getBestModel(selectedMetric);

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
            <Cpu className="text-brandBlue" /> Machine Learning Models
          </h1>
          <p className="text-slate-400 mt-1">Compare performance scores, training overhead, and detection trade-offs across 6 ML algorithms.</p>
        </div>
      </div>

      {/* Best Model Highlight Box */}
      {bestModel && (
        <motion.div 
          className="glass-panel p-6 border-l-4 border-brandPurple bg-gradient-to-r from-brandPurple/5 via-transparent to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brandPurple text-xs font-bold uppercase tracking-wider">
              <Zap size={14} /> Metric Leaderboard
            </div>
            <h2 className="text-xl font-bold text-white">
              {bestModel.model_name} leads in <span className="text-brandPurple">{metricsInfo[selectedMetric].name}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              {metricsInfo[selectedMetric].desc} Currently showing value: <b className="text-slate-200">{selectedMetric === 'training_time' ? `${bestModel[selectedMetric]}s` : (bestModel[selectedMetric] * 100).toFixed(2) + '%'}</b>
            </p>
          </div>
          <button 
            onClick={() => navigate(`/evaluation?model=${bestModel.model_name}`)}
            className="px-4 py-2.5 bg-slate-900 border border-darkBorder hover:border-brandPurple rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all self-stretch md:self-auto justify-center"
          >
            Detailed Evaluation <ChevronRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Grid: Charts + Metric details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts Bar Comparison */}
        <div className="glass-panel p-6 lg:col-span-2 h-[400px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md font-bold text-white">Interactive Performance Comparison</h3>
              <p className="text-xs text-slate-400">Comparing classifiers across the selected metric.</p>
            </div>
            {/* Metric Selector Dropdown */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-slate-900 border border-darkBorder rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brandPurple"
            >
              {Object.keys(metricsInfo).map(k => (
                <option key={k} value={k}>{metricsInfo[k].name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-h-[220px] mt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="model_name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  formatter={(value) => [selectedMetric === 'training_time' ? `${value}s` : (value * 100).toFixed(2) + '%', metricsInfo[selectedMetric].name]}
                />
                <Bar dataKey={selectedMetric} fill={metricsInfo[selectedMetric].color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Metric Explanation */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[400px]">
          <div className="space-y-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Metric Definition</span>
            <h3 className="text-lg font-bold text-white">{metricsInfo[selectedMetric].name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{metricsInfo[selectedMetric].desc}</p>
          </div>
          <div className="bg-slate-900/60 p-4 border border-darkBorder/60 rounded-xl space-y-3 text-xs">
            <p className="font-semibold text-slate-300">Design Recommendations:</p>
            {selectedMetric === 'recall' && (
              <p className="text-slate-400 leading-relaxed">
                In fraud detection, <b>Recall</b> is paramount. Flagging 98% of frauds saves money, even if it creates slightly higher false alarms (lower precision). XGBoost/LightGBM typically excel here.
              </p>
            )}
            {selectedMetric === 'precision' && (
              <p className="text-slate-400 leading-relaxed">
                High <b>Precision</b> is required to keep customer friction minimal. If precision is low, innocent cardholders will constantly have their accounts blocked, creating customer support backlogs.
              </p>
            )}
            {selectedMetric === 'f1_score' && (
              <p className="text-slate-400 leading-relaxed">
                The <b>F1 Score</b> balances Precision and Recall, proving to be the most objective classifier comparison index when dealing with SMOTE-balanced training structures.
              </p>
            )}
            {selectedMetric === 'training_time' && (
              <p className="text-slate-400 leading-relaxed">
                Linear models like <b>Logistic Regression</b> train in milliseconds, which makes them optimal for systems requiring hourly retrains, whereas Support Vector Machines (SVM) scale poorly with larger resampled rows.
              </p>
            )}
            {['accuracy', 'roc_auc'].includes(selectedMetric) && (
              <p className="text-slate-400 leading-relaxed">
                <b>ROC AUC</b> shows how well sorted fraud probabilities are. An AUC of 0.90+ indicates excellent discriminative power, ensuring risk scoring displays are highly predictive.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive metrics table */}
      <div className="glass-panel p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Evaluation Matrix</h2>
          <p className="text-xs text-slate-400">Detailed performance scores for each algorithm on validation subsets.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="custom-table min-w-[700px]">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC-AUC</th>
                <th>Training Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((model) => (
                <tr key={model.model_name}>
                  <td className="font-bold text-white">{model.model_name}</td>
                  <td>{(model.accuracy * 100).toFixed(2)}%</td>
                  <td>{(model.precision * 100).toFixed(2)}%</td>
                  <td>{(model.recall * 100).toFixed(2)}%</td>
                  <td className="font-semibold text-brandPurple">{(model.f1_score * 100).toFixed(2)}%</td>
                  <td>{model.roc_auc.toFixed(4)}</td>
                  <td>{model.training_time.toFixed(3)}s</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/evaluation?model=${model.model_name}`)}
                      className="px-3 py-1.5 bg-brandBlue/10 hover:bg-brandBlue/20 border border-brandBlue/20 text-brandBlue text-xs font-semibold rounded-lg transition-colors"
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default MLModels;
