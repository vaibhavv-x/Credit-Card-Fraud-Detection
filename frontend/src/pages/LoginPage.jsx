import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldAlert, Loader2, User as UserIcon } from 'lucide-react';

function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (isRegistering) {
      await handleRegister();
    } else {
      await handleLogin();
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-darkBg relative overflow-hidden font-sans p-4">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brandPurple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-brandBlue/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        key={isRegistering ? 'register' : 'login'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md glass-panel p-8 space-y-7 relative z-10 border border-darkBorder/30"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-brandBlue to-brandPurple items-center justify-center shadow-glowPurple mx-auto">
            <ShieldAlert size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-4">
            Aegis<span className="gradient-text">Fraud</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isRegistering ? 'Create New Admin Account' : 'Secure Administrator Analytics Dashboard'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-neonRed/10 border border-neonRed/20 text-neonRed rounded-xl text-xs text-center font-semibold"
          >
            {error}
          </motion.div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            {/* Full Name Field (Only in sign-up mode) */}
            {isRegistering && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-darkBorder/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@aegisfraud.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-darkBorder/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-darkBorder/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple/20 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password Field (Only in sign-up mode) */}
            {isRegistering && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-darkBorder/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brandPurple focus:ring-1 focus:ring-brandPurple/20 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brandBlue to-brandPurple hover:from-brandPurple hover:to-brandPink text-white font-bold text-sm tracking-wide shadow-glowPurple hover:shadow-glowBlue hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : isRegistering ? (
              'Create Account & Log In'
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center">
          <button 
            type="button"
            onClick={toggleMode}
            className="text-xs text-slate-400 hover:text-brandPurple font-semibold transition-colors cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Default Account Tip (Only in sign-in mode) */}
        {!isRegistering && (
          <div className="p-3 bg-brandBlue/10 border border-brandBlue/20 text-brandBlue rounded-xl text-[10px] text-center font-medium leading-relaxed mt-2">
            Demo Credentials: <span className="font-bold text-white">admin@aegisfraud.in</span> / Password: <span className="font-bold text-white">admin123</span>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 border-t border-darkBorder/30 pt-4">
          Authorized personnel only. Activities are monitored and logged.
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
