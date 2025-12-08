import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mail, Lock, Loader2, AlertCircle, CheckCircle, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = () => {
  const [mode, setMode] = useState('login'); // login, register, verify, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const { sendOTP, verifyOTPAndRegister, login, resetPassword, loading, error, success } = useAuth();

  // ✅ Giriş yap
  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  // ✅ OTP gönder
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const result = await sendOTP(email);
    if (result) {
      setOtpSent(true);
    }
  };

  // ✅ OTP doğrula ve kayıt ol
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      return;
    }

    const user = await verifyOTPAndRegister(email, otp, password);
    if (user) {
      setMode('login');
      setOtpSent(false);
      setOtp('');
      setPassword('');
    }
  };

  // ✅ Şifre sıfırla
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const result = await resetPassword(email);
    if (result) {
      setTimeout(() => setMode('login'), 2000);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center space-y-4">
            <motion.div
              className="mx-auto w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <BookOpen className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Libocculus
              </h1>
              <p className="text-gray-600 text-base mt-2">
                ODTÜ Kampüs Doluluk Takip Sistemi
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 pt-0 space-y-4">
            {/* Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-500 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border border-green-500 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="text-green-800 text-sm">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ODTÜ E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="e1234567@metu.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Giriş Yap'}
                </button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setOtpSent(false); }}
                    className="text-red-600 hover:underline"
                  >
                    Hesap Oluştur
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-red-600 hover:underline"
                  >
                    Şifremi Unuttum
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM - Step 1: Send OTP */}
            {mode === 'register' && !otpSent && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ODTÜ E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="e1234567@metu.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Doğrulama Kodu Gönder
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-red-600 hover:underline text-sm"
                >
                  Giriş sayfasına dön
                </button>
              </form>
            )}

            {/* REGISTER FORM - Step 2: Verify OTP */}
            {mode === 'register' && otpSent && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>{email}</strong> adresine 6 haneli doğrulama kodu gönderdik.
                    Lütfen mailinizi kontrol edin.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Doğrulama Kodu</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                    required
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Şifre Oluştur</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500">En az 6 karakter</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Doğrula ve Kayıt Ol'}
                </button>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Kodu tekrar gönder
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setOtpSent(false); setOtp(''); }}
                  className="w-full text-center text-red-600 hover:underline text-sm"
                >
                  İptal
                </button>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ODTÜ E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="e1234567@metu.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Şifre Sıfırlama Linki Gönder'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-red-600 hover:underline text-sm"
                >
                  Giriş sayfasına dön
                </button>
              </form>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>ℹ️ Bilgi:</strong> Sadece <strong>@metu.edu.tr</strong> uzantılı
                e-posta adresleri ile {mode === 'register' ? 'kayıt olabilirsiniz' : 'giriş yapabilirsiniz'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
