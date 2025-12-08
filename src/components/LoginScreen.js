import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const { sendLoginEmail, loading, error, success } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendLoginEmail(email);
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
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-500 rounded-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-500 rounded-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              </motion.div>
            )}

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    ODTÜ E-posta Adresiniz
                  </label>
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
                  <p className="text-xs text-gray-500">
                    Size bir doğrulama linki göndereceğiz
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Doğrulama Linki Gönder
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  E-postanızı Kontrol Edin
                </h3>
                <p className="text-gray-600 text-sm">
                  <strong>{email}</strong> adresine bir doğrulama linki gönderdik.
                  Mailinizi kontrol edin ve linke tıklayarak giriş yapın.
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>ℹ️ Bilgi:</strong> Sadece <strong>@metu.edu.tr</strong> uzantılı 
                e-posta adresleri ile giriş yapabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
