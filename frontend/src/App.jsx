import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import DatasetOverview from './pages/DatasetOverview';
import EDA from './pages/EDA';
import Preprocessing from './pages/Preprocessing';
import MLModels from './pages/MLModels';
import ModelEvaluation from './pages/ModelEvaluation';
import FraudPrediction from './pages/FraudPrediction';
import ExplainableAI from './pages/ExplainableAI';
import BatchPrediction from './pages/BatchPrediction';
import AboutProject from './pages/AboutProject';
import LoginPage from './pages/LoginPage';

// Protect Dashboard Layout & Sidebar
function ProtectedLayout({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="flex min-h-screen bg-darkBg text-slate-100 font-sans relative">
      {/* Global Abstract Background Glows */}
      <div className="glow-circle glow-purple w-96 h-96 top-10 left-10" />
      <div className="glow-circle glow-blue w-96 h-96 bottom-10 right-10" />

      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Viewport */}
      <main className="flex-1 min-h-screen lg:pl-0 pl-0 overflow-y-auto">
        {/* Top spacer on mobile for Hamburger overlay spacing */}
        <div className="h-16 lg:hidden" />
        {children}
      </main>
    </div>
  );
}

// Redirect logged-in users away from Login page
function LoginRoute() {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Private Protected Dashboard Routes */}
        <Route path="/" element={<ProtectedLayout><LandingPage /></ProtectedLayout>} />
        <Route path="/dataset" element={<ProtectedLayout><DatasetOverview /></ProtectedLayout>} />
        <Route path="/eda" element={<ProtectedLayout><EDA /></ProtectedLayout>} />
        <Route path="/preprocessing" element={<ProtectedLayout><Preprocessing /></ProtectedLayout>} />
        <Route path="/models" element={<ProtectedLayout><MLModels /></ProtectedLayout>} />
        <Route path="/evaluation" element={<ProtectedLayout><ModelEvaluation /></ProtectedLayout>} />
        <Route path="/prediction" element={<ProtectedLayout><FraudPrediction /></ProtectedLayout>} />
        <Route path="/xai" element={<ProtectedLayout><ExplainableAI /></ProtectedLayout>} />
        <Route path="/batch" element={<ProtectedLayout><BatchPrediction /></ProtectedLayout>} />
        <Route path="/about" element={<ProtectedLayout><AboutProject /></ProtectedLayout>} />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
