import React from 'react';
import { motion } from 'framer-motion';
import { Info, HelpCircle, Code, Shield, BookOpen, User } from 'lucide-react';

const AboutProject = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="border-b border-darkBorder/40 pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Info className="text-brandBlue" /> About the Project
        </h1>
        <p className="text-slate-400 mt-1">Understanding the goals, pipeline mechanics, and ML models driving the AegisFraud analytics engine.</p>
      </div>

      {/* Grid: Goals & Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Goals */}
        <motion.div className="glass-panel p-6 space-y-4 lg:col-span-2" variants={cardVariants}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={18} className="text-brandPurple" /> Core Objectives & Rationale
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Credit card fraud detection is a classic problem in computational finance. The biggest hurdle is the severe <b>Class Imbalance</b>—fraud typically accounts for less than 0.2% of all transactions. If a model predicts "Legitimate" for every transaction, it will achieve 99.8% accuracy but catch zero fraud.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            This platform acts as an educational and operational dashboard showing how to ingest imbalanced datasets, resample them using SMOTE, evaluate six classification models, and dissect predictions using <b>Shapley Additive exPlanations (SHAP)</b>.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-darkBorder/40 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-white uppercase tracking-wider">Research Targets</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Evaluate tree models vs linear margins</li>
                <li>Verify SHAP local waterfall stability</li>
                <li>Prevent oversampling data leaks</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white uppercase tracking-wider">Core Tech Stack</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>FastAPI & Uvicorn Async Server</li>
                <li>Scikit-Learn, XGBoost & LightGBM</li>
                <li>SHAP explainers & ReportLab PDF</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Developer Info / Quick Start */}
        <motion.div className="glass-panel p-6 space-y-4 flex flex-col justify-between" variants={cardVariants}>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Code size={18} className="text-brandBlue" /> Developer Quick Start
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Run backend and frontend servers in separate shells:
            </p>
            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-darkBorder/60">
                <p className="text-slate-500 mb-1"># Start Backend</p>
                <code className="text-brandBlue">cd backend && uvicorn app.main:app --reload</code>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-darkBorder/60">
                <p className="text-slate-500 mb-1"># Start React Frontend</p>
                <code className="text-brandPurple">cd frontend && npm run dev</code>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center text-[10px] text-slate-500 border-t border-darkBorder/40 pt-3">
            <User size={14} className="text-slate-400" /> Developed as a Data Science Sandbox.
          </div>
        </motion.div>
      </div>

      {/* Models Detailed Explanations */}
      <motion.div className="glass-panel p-6 space-y-6" variants={cardVariants}>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield size={18} className="text-brandBlue" /> Classification Models Deconstructed
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-400">
          <div className="bg-slate-900/40 p-4 border border-darkBorder/60 rounded-xl space-y-2.5">
            <h3 className="font-bold text-sm text-white">XGBoost & LightGBM</h3>
            <p>
              <b>Extreme Gradient Boosting (XGBoost)</b> and <b>LightGBM</b> build additive decision trees in sequence, fitting to the residuals of previous trees. They are exceptionally robust, handle non-linear structures, and rank highest in F1-score and Recall.
            </p>
            <p className="text-brandPurple font-semibold">Best for: Max Recall, detecting complex multi-vector fraud.</p>
          </div>

          <div className="bg-slate-900/40 p-4 border border-darkBorder/60 rounded-xl space-y-2.5">
            <h3 className="font-bold text-sm text-white">Random Forest & SVM</h3>
            <p>
              <b>Random Forest</b> bags multiple deep decision trees to reduce variance, averaging their prediction probabilities. <b>Support Vector Machines (SVM)</b> project features into high-dimensional hyperplane margins to find maximum boundaries.
            </p>
            <p className="text-brandBlue font-semibold">Best for: High Precision, avoiding false alarm card blocks.</p>
          </div>

          <div className="bg-slate-900/40 p-4 border border-darkBorder/60 rounded-xl space-y-2.5">
            <h3 className="font-bold text-sm text-white">Logistic Regression & Decision Trees</h3>
            <p>
              <b>Logistic Regression</b> estimates fraud probabilities using a sigmoidal linear combination of weights. It serves as our lightweight, high-speed baseline model. <b>Decision Trees</b> provide single-tree leaf maps for visual decision paths.
            </p>
            <p className="text-brandPink font-semibold">Best for: Instant training, sub-millisecond real-time queries.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutProject;
