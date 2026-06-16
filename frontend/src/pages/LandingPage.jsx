import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Cpu, Eye, FileText, ArrowRight, Activity, Zap, Play } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const features = [
    {
      title: "Interactive EDA & Profiling",
      desc: "Explore skewness, outliers, and feature correlations with highly interactive, zoomable, and responsive charting.",
      icon: Activity,
      color: "text-brandBlue bg-brandBlue/10"
    },
    {
      title: "Balanced Preprocessing",
      desc: "Observe the train-test pipeline diagram and SMOTE class-balancing applied to resolve highly imbalanced distributions.",
      icon: Zap,
      color: "text-brandPurple bg-brandPurple/10"
    },
    {
      title: "Multi-Model Comparison",
      desc: "Compare performance metrics of six machine learning classifiers (XGBoost, Random Forest, SVM, LightGBM, Decision Trees, and Logistic Regression).",
      icon: Cpu,
      color: "text-brandPink bg-brandPink/10"
    },
    {
      title: "Explainable AI (SHAP)",
      desc: "Drill down into global feature importance and compute local SHAP explanations for any prediction to understand the feature impact.",
      icon: Eye,
      color: "text-neonGreen bg-neonGreen/10"
    }
  ];

  return (
    <motion.div 
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
        <motion.div className="space-y-6" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-darkBorder/80 text-xs font-semibold text-brandPurple shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brandPurple animate-ping" />
            Empowering FinTech with Explainable ML
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            AI-Powered <br />
            <span className="gradient-text">Credit Card Fraud</span> <br />
            Detection & Analytics
          </h1>
          <p className="text-slate-400 text-base lg:text-lg max-w-xl leading-relaxed">
            A secure, enterprise-ready machine learning analytics platform that ingests, balances, evaluates, and explains credit card transaction anomalies using explainable AI.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => navigate('/dataset')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brandBlue to-brandPurple hover:from-brandBlue/90 hover:to-brandPurple/90 text-white font-semibold shadow-glowPurple hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Analysis <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/prediction')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-darkBorder hover:border-slate-700 text-slate-300 font-semibold hover:-translate-y-0.5 transition-all duration-200"
            >
              <Play size={16} fill="currentColor" /> Live Predictor
            </button>
          </div>
        </motion.div>

        {/* Hero Interactive Graphic */}
        <motion.div 
          className="relative flex justify-center items-center h-80 lg:h-[450px]"
          variants={itemVariants}
        >
          {/* Neon Glow Circles */}
          <div className="absolute h-64 w-64 rounded-full bg-brandPurple/10 filter blur-3xl" />
          <div className="absolute h-80 w-80 rounded-full bg-brandBlue/10 filter blur-3xl" />
          
          <div className="w-full h-full glass-panel flex flex-col justify-between p-6 max-w-md relative overflow-hidden border border-brandPurple/30 shadow-glowPurple/10">
            {/* Visual Header */}
            <div className="flex justify-between items-center pb-4 border-b border-darkBorder/40">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Active Threat Monitor</span>
              <span className="px-2.5 py-1 rounded bg-neonRed/10 text-[10px] font-bold text-neonRed uppercase tracking-wider animate-pulse border border-neonRed/20">
                Threat Detected
              </span>
            </div>
            
            {/* Transaction Mock */}
            <div className="my-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white">Merchant: Tanishq Jewellery</h3>
                  <p className="text-xs text-slate-400">TXID: TXN18290 | Category: Luxury</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">₹1,48,000.00</p>
                  <p className="text-[10px] text-slate-500">Amount</p>
                </div>
              </div>

              {/* Progress bar mock */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-neonRed">Fraud Risk</span>
                  <span className="text-neonRed">94.2%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-brandBlue to-neonRed h-full rounded-full w-[94.2%]" />
                </div>
              </div>
            </div>

            {/* Explanation Preview */}
            <div className="space-y-2 pt-4 border-t border-darkBorder/40">
              <span className="text-xs font-semibold text-slate-400">Model Signals contributing to Risk:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-full bg-neonRed/10 border border-neonRed/20 text-[10px] text-neonRed font-semibold">+ ₹Amount (high value)</span>
                <span className="px-2 py-0.5 rounded-full bg-neonRed/10 border border-neonRed/20 text-[10px] text-neonRed font-semibold">+ V14 (anomalous vector)</span>
                <span className="px-2 py-0.5 rounded-full bg-brandBlue/10 border border-brandBlue/20 text-[10px] text-brandBlue font-semibold">- Time (recent transaction)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="space-y-8">
        <motion.div className="text-center space-y-2" variants={itemVariants}>
          <h2 className="text-3xl font-bold text-white">Interactive Modules</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Explore each phase of the credit card fraud detection pipeline via dedicated visual dashboards.</p>
        </motion.div>
        
        <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className="glass-panel glass-panel-hover p-6 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${feat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Pipeline Workflow Diagram */}
      <div className="space-y-8 pt-8">
        <motion.div className="text-center space-y-2" variants={itemVariants}>
          <h2 className="text-3xl font-bold text-white">The ML Pipeline</h2>
          <p className="text-slate-400 max-w-xl mx-auto">From raw imbalanced transaction datasets to localized explainable fraud alerts.</p>
        </motion.div>

        <motion.div 
          className="glass-panel p-8 grid md:grid-cols-5 gap-6 items-center justify-center text-center relative overflow-hidden"
          variants={itemVariants}
        >
          {/* Step 1 */}
          <div className="space-y-2 relative z-10">
            <div className="h-10 w-10 mx-auto rounded-full bg-brandBlue/20 border border-brandBlue text-brandBlue flex items-center justify-center font-bold text-sm">1</div>
            <h4 className="font-bold text-sm text-white">Ingest Raw Data</h4>
            <p className="text-xs text-slate-400">Load imbalanced, PCA anonymized vectors</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600"><ArrowRight size={20} /></div>

          {/* Step 2 */}
          <div className="space-y-2 relative z-10">
            <div className="h-10 w-10 mx-auto rounded-full bg-brandPurple/20 border border-brandPurple text-brandPurple flex items-center justify-center font-bold text-sm">2</div>
            <h4 className="font-bold text-sm text-white">Scale & Balance</h4>
            <p className="text-xs text-slate-400">Normalize features & apply SMOTE</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600"><ArrowRight size={20} /></div>

          {/* Step 3 */}
          <div className="space-y-2 relative z-10">
            <div className="h-10 w-10 mx-auto rounded-full bg-brandPink/20 border border-brandPink text-brandPink flex items-center justify-center font-bold text-sm">3</div>
            <h4 className="font-bold text-sm text-white">Concurrently Fit</h4>
            <p className="text-xs text-slate-400">Train and validate 6 classifiers</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
