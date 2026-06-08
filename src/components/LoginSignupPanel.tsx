import React, { useState } from 'react';
import { Mail, Lock, User, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import jamiaLogo from '../assets/images/jamia_logo_1780742048729.png';
import { translations } from '../translations';
import { LocalUser } from '../types';

interface LoginSignupPanelProps {
  onLoginSuccess: (user: LocalUser) => void;
  lang: 'en' | 'ur';
}

export const LoginSignupPanel: React.FC<LoginSignupPanelProps> = ({ onLoginSuccess, lang }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: isSignUp ? fullName.trim() : undefined,
        }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (parseError) {
        throw new Error(`Server returned non-JSON error page (Status: ${response.status}). Details: ${resText.slice(0, 150)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Elite Decorative Islamic Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 p-6 text-center text-white border-b border-amber-500/35 relative">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500"></div>
          
          <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center shadow-lg border-2 border-amber-400 p-1 mb-3 animate-pulse">
            <img src={jamiaLogo} alt="Jamia Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          
          <h2 className="text-xl font-serif font-bold tracking-tight uppercase text-amber-100">
            {translations[lang].appTitle}
          </h2>
          <p className="text-[10px] text-emerald-400 tracking-wider font-mono uppercase mt-1">
            {translations[lang].subtitle}
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Section Heading */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-serif font-bold text-slate-800">
              {isSignUp ? (lang === 'ur' ? 'نئے اکاؤنٹ کا اندراج کریں' : 'Create Admin/Staff Account') : (lang === 'ur' ? 'پورٹل لاگ ان کریں' : 'Portal Secure Login')}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ur' 
                ? 'اپنے رجسٹرڈ کوائف درج کر کے محفوظ لاگ ان کریں' 
                : 'Authentication is safe, encrypted, and synced.'}
            </p>
          </div>



          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-800 flex items-center gap-1.5 animate-bounce">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Credentials Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {lang === 'ur' ? 'پورا نام' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ur' ? 'مثال: محمد ابراہیم' : 'e.g., M. Ibrahim'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 font-sans transition-all text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                {lang === 'ur' ? 'ای میل ایڈریس' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={lang === 'ur' ? 'اپنا ای میل درج کریں' : 'name@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 font-sans transition-all text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                {lang === 'ur' ? 'پاس ورڈ' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 font-sans transition-all text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 tracking-wider uppercase mt-2 select-none"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {isSignUp ? (lang === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Sign Up & Enroll') : (lang === 'ur' ? 'لاگ ان کریں' : 'Log In Securely')}
            </button>
          </form>

          {/* Form Switch Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setIsSignUp(!isSignUp);
              }}
              className="text-xs text-indigo-700 hover:underline font-semibold cursor-pointer select-none"
            >
              {isSignUp 
                ? (lang === 'ur' ? 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں' : 'Already have account? Sign in') 
                : (lang === 'ur' ? 'نیا اکاؤنٹ بنائیں (سائن اپ)' : 'Need account? Sign up here')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
