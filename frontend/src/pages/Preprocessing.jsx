import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, ArrowRight, CheckCircle, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

const Preprocessing = () => {
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPipelineSteps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/pipeline-steps');
      if (!res.ok) throw new Error('Failed to load preprocessing pipeline steps');
      const json = await res.json();
      setSteps(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineSteps();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <RefreshCw className="text-brandPurple animate-spin" size={40} />
        <p className="text-slate-400 font-medium">Reconstructing preprocessing pipelines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center p-6">
        <AlertTriangle className="text-neonRed animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-white">Pipeline Loader Failed</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
        <button onClick={fetchPipelineSteps} className="px-5 py-2.5 rounded-xl bg-brandPurple hover:bg-brandPurple/90 text-white font-semibold flex items-center gap-2">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const activeStepDetails = steps.find(s => s.step === activeStep);

  const stepExtraInfo = {
    1: {
      formula: "x' = (x - μ) / σ",
      details: "Amount and Time are transformed to Z-scores using standard scaling. Crucial for Logistic Regression, SVM, and Neural Networks, making gradient descents converge faster.",
      code: "scaler = StandardScaler()\nscaled_features = scaler.fit_transform(df[['Time', 'Amount']])"
    },
    2: {
      formula: "X = df[features], y = df['Class']",
      details: "Excludes customer identifiers and merchants, ensuring the model generalizes on quantitative attributes rather than learning cardholder names.",
      code: "features = ['Time'] + [f'V{i}' for i in range(1, 29)] + ['Amount']\nX = df[features]\ny = df['Class']"
    },
    3: {
      formula: "StratifiedShuffleSplit(test_size=0.2)",
      details: "Stratified splitting ensures both train and test partitions maintain the identical ~1.6% fraud ratio. If we used random splitting, the test set could contain zero fraud samples.",
      code: "X_train, X_test, y_train, y_test = train_test_split(\n  X, y, test_size=0.2, random_state=42, stratify=y\n)"
    },
    4: {
      formula: "x_new = x_i + λ * (x_k - x_i)",
      details: "SMOTE (Synthetic Minority Over-sampling Technique) selects minority points, finds their k-nearest neighbors, and generates synthetic samples along the line segments joining them. This balances the classes to 50-50.",
      code: "from imblearn.over_sampling import SMOTE\nsmote = SMOTE(random_state=42)\nX_train_res, y_train_res = smote.fit_resample(X_train, y_train)"
    },
    5: {
      formula: "f_i(x) -> predict Class",
      details: "Trains all 6 classifiers in parallel. Cross-validation parameters evaluate generalization capabilities, feeding metrics directly into the analytics server.",
      code: "models = {\n  'Logistic Regression': LogisticRegression(),\n  'Random Forest': RandomForestClassifier(),\n  ...\n}\nfor name, clf in models.items():\n  clf.fit(X_train_res, y_train_res)"
    }
  };

  return (
    <motion.div 
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <GitCommit className="text-brandBlue" /> Preprocessing Pipeline
          </h1>
          <p className="text-slate-400 mt-1">Trace how raw transactional records are normalized, split, and balanced before feeding into models.</p>
        </div>
      </div>

      {/* Interactive Horizontal Flowchart */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto">
        {steps.map((s, idx) => (
          <React.Fragment key={s.step}>
            <button
              onClick={() => setActiveStep(s.step)}
              className={`
                flex items-center gap-3 p-4 rounded-xl text-left min-w-[200px] border transition-all duration-300
                ${activeStep === s.step 
                  ? 'bg-gradient-to-r from-brandBlue/10 to-brandPurple/10 border-brandPurple shadow-glowPurple/25' 
                  : 'bg-slate-900/30 border-darkBorder hover:border-slate-700'
                }
              `}
            >
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border
                ${activeStep === s.step
                  ? 'bg-brandPurple border-brandPurple text-white'
                  : 'bg-slate-800 border-darkBorder text-slate-400'
                }
              `}>
                {s.step}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{s.name.split(' ')[0]}...</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Pipeline Step {s.step}</p>
              </div>
            </button>
            {idx < steps.length - 1 && (
              <ArrowRight className="hidden md:block text-slate-700" size={18} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Detail Explanation */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Core Summary card */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-brandPurple font-semibold uppercase tracking-widest">Active Step Info</span>
            <CheckCircle size={18} className="text-neonGreen" />
          </div>
          <h2 className="text-xl font-bold text-white">{activeStepDetails?.name}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{activeStepDetails?.description}</p>
          
          {stepExtraInfo[activeStep]?.formula && (
            <div className="p-3 bg-slate-950/40 border border-darkBorder/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Math / Theory</span>
              <p className="font-mono text-sm text-brandBlue font-semibold">{stepExtraInfo[activeStep].formula}</p>
            </div>
          )}
        </div>

        {/* Detailed info & Code block */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white">Execution Parameters & Logic</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{stepExtraInfo[activeStep]?.details}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Python Code Implementation</span>
              <span className="font-mono text-slate-500">pandas/sklearn</span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto border border-darkBorder/60 leading-relaxed">
              <code>{stepExtraInfo[activeStep]?.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Class Balancing SMOTE Visualizer */}
      <div className="glass-panel p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">SMOTE Partition & Data Leakage Prevention</h2>
          <p className="text-xs text-slate-400">Illustrating why balancing must ONLY happen on the training subset, leaving validation sets pristine.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Before SMOTE */}
          <div className="space-y-4 bg-slate-900/40 border border-darkBorder/60 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-200">1. Original Split (Imbalanced)</h3>
            <p className="text-xs text-slate-400">Both Train and Test sets have a heavily skewed Class 1 ratio.</p>
            
            <div className="space-y-3">
              {/* Train set before */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Train Set (4,000 samples)</span>
                  <span className="text-slate-400">1.6% Fraud</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden flex">
                  <div className="bg-neonGreen h-full" style={{ width: '98.4%' }} title="98.4% Genuine" />
                  <div className="bg-neonRed h-full" style={{ width: '1.6%' }} title="1.6% Fraud" />
                </div>
              </div>

              {/* Test set before */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Test Set (1,000 samples)</span>
                  <span className="text-slate-400">2.0% Fraud</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden flex">
                  <div className="bg-neonGreen h-full" style={{ width: '98.0%' }} title="98.0% Genuine" />
                  <div className="bg-neonRed h-full" style={{ width: '2.0%' }} title="2.0% Fraud" />
                </div>
              </div>
            </div>
          </div>

          {/* After SMOTE */}
          <div className="space-y-4 bg-slate-900/40 border border-darkBorder/60 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-200">2. Resampled Train Split (Balanced)</h3>
            <p className="text-xs text-slate-400">SMOTE generates synthetic fraud samples in Train set, but Test set remains unchanged.</p>
            
            <div className="space-y-3">
              {/* Train set after */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-brandPurple font-bold">Resampled Train Set (7,836 samples)</span>
                  <span className="text-brandPurple font-bold">50.0% Balanced</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden flex">
                  <div className="bg-neonGreen h-full" style={{ width: '50%' }} title="50% Genuine" />
                  <div className="bg-brandPurple h-full" style={{ width: '50%' }} title="50% Synthetic Fraud" />
                </div>
              </div>

              {/* Test set after */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Validation Test Set (1,000 samples)</span>
                  <span className="text-slate-400">2.0% Fraud (Unchanged)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden flex">
                  <div className="bg-neonGreen h-full" style={{ width: '98.0%' }} title="98.0% Genuine" />
                  <div className="bg-neonRed h-full" style={{ width: '2.0%' }} title="2.0% Fraud" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-brandBlue/10 border border-brandBlue/20 rounded-xl text-xs text-slate-300 leading-relaxed">
          <ShieldCheck size={18} className="text-brandBlue shrink-0 mt-0.5" />
          <div>
            <b>Design Rationale:</b> Over-sampling the validation/testing sets before splitting is a common rookie mistake in ML. It leads to duplicate observations in both subsets, artificially inflating accuracy metrics. In this platform, SMOTE is strictly isolated to the training path.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Preprocessing;
