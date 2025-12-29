import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, UtensilsCrossed, Gift, MapPin, Award, Clock, TrendingUp, QrCode as QrCodeIcon, LogOut, AlertCircle, CheckCircle, Loader2, History, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { db } from './firebase/config';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const LibocculusApp = () => {
  // Auth States
  const [authMode, setAuthMode] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');

  // App States
  const [activeTab, setActiveTab] = useState('library');
  const [showRewards, setShowRewards] = useState(false);
  const [showMyRewards, setShowMyRewards] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(null);

  // Data States
  // eslint-disable-next-line no-unused-vars
  const [libraryData, setLibraryData] = useState({ 
    '1B': { occupancy: 45, lastUpdated: new Date() },
    '2B': { occupancy: 67, lastUpdated: new Date() },
    '3B': { occupancy: 82, lastUpdated: new Date() },
    '1A': { occupancy: 34, lastUpdated: new Date() },
    '2A': { occupancy: 56, lastUpdated: new Date() },
    '3A': { occupancy: 71, lastUpdated: new Date() },
    'SESLİ': { occupancy: 89, lastUpdated: new Date() }
  });
// eslint-disable-next-line no-unused-vars
  const [cafeteriaData, setCafeteriaData] = useState({ 
    'ÜST_KAT': { occupancy: 72, queueStatus: 'Orta', lastUpdated: new Date() },
    'ALT_KAT': { occupancy: 58, queueStatus: 'Kısa', lastUpdated: new Date() }
  });
// eslint-disable-next-line no-unused-vars
  const [rewards, setRewards] = useState([ 
    { id: 1, name: 'Çatı Cafe - Kahve', points: 50, venue: 'Çatı', icon: '☕', available: true },
    { id: 2, name: 'Yemekhane - Tatlı', points: 30, venue: 'Yemekhane', icon: '🍰', available: true },
    { id: 3, name: 'Zeynel - Sandviç', points: 40, venue: 'Zeynel', icon: '🥪', available: true },
    { id: 4, name: 'Çatı Cafe - Çay + Poğaça', points: 25, venue: 'Çatı', icon: '🫖', available: true },
    { id: 5, name: 'Yemekhane - İçecek', points: 20, venue: 'Yemekhane', icon: '🥤', available: true },
    { id: 6, name: 'Zeynel - Tost', points: 35, venue: 'Zeynel', icon: '🥙', available: true }
  ]);

  const [myRedemptions, setMyRedemptions] = useState([]);
  const [points, setPoints] = useState(125);
  const [totalContributions, setTotalContributions] = useState(47);

  // Submission States
  const [selectedFloor, setSelectedFloor] = useState('');
  const [occupancyValue, setOccupancyValue] = useState('');
  const [selectedCafeteria, setSelectedCafeteria] = useState('');
  const [queueStatus, setQueueStatus] = useState('');

  // Check auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('libocculus_auth');
    const savedLastSubmit = localStorage.getItem('libocculus_last_submit');
    
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setUser(authData.user);
      setPoints(authData.points);
      setTotalContributions(authData.totalContributions);
      setIsAuthenticated(true);
    }
    
    if (savedLastSubmit) {
      setLastSubmitTime(parseInt(savedLastSubmit));
    }
  }, []);

  // Save auth to localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('libocculus_auth', JSON.stringify({
        user,
        points,
        totalContributions
      }));
    }
  }, [isAuthenticated, user, points, totalContributions]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Check if can submit
  const canSubmit = () => {
    if (!lastSubmitTime) return true;
    const oneHour = 60 * 60 * 1000;
    return Date.now() - lastSubmitTime > oneHour;
  };

  const getTimeUntilNextSubmit = () => {
    if (!lastSubmitTime) return null;
    const oneHour = 60 * 60 * 1000;
    const timeLeft = oneHour - (Date.now() - lastSubmitTime);
    if (timeLeft <= 0) return null;
    const minutes = Math.ceil(timeLeft / 60000);
    return `${minutes} dakika`;
  };

  // Auth Functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('ODTÜ e-posta adresi kullanmalısınız');
      }

      const userData = {
        email,
        studentId: '1234567',
        points: 125,
        totalContributions: 47
      };

      setUser(userData);
      setPoints(userData.points);
      setTotalContributions(userData.totalContributions);
      setIsAuthenticated(true);
      setSuccess('Giriş başarılı!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('ODTÜ e-posta adresi kullanmalısınız');
      }

      if (studentId.length !== 7) {
        throw new Error('Öğrenci numarası 7 haneli olmalıdır');
      }

      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
      setAuthMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('ODTÜ e-posta adresi kullanmalısınız');
      }

      setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!');
      setTimeout(() => setAuthMode('login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('libocculus_auth');
    setIsAuthenticated(false);
    setUser(null);
    setPoints(0);
    setTotalContributions(0);
  };

const handleSubmitData = async () => {
  if (!canSubmit()) {
    setError(`${getTimeUntilNextSubmit()} sonra tekrar gönderebilirsiniz`);
    return;
  }

  setLoading(true);
  
  try {
    let latitude = null;
    let longitude = null;

    // ✅ Konum izni kontrolü
    if (!navigator.geolocation) {
      throw new Error('Tarayıcınız konum özelliğini desteklemiyor');
    }

    // ✅ Konum iznini kontrol et
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        throw new Error('Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini açın.');
      }

      // ✅ Konum al (daha uzun timeout)
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            if (error.code === 1) {
              reject(new Error('Konum izni reddedildi'));
            } else if (error.code === 2) {
              reject(new Error('Konum bilgisi alınamadı'));
            } else if (error.code === 3) {
              reject(new Error('Konum alma zaman aşımına uğradı'));
            } else {
              reject(new Error('Konum alınamadı'));
            }
          },
          {
            enableHighAccuracy: false, // ✅ Daha hızlı
            timeout: 15000, // ✅ 15 saniye
            maximumAge: 60000 // ✅ 1 dakika cache
          }
        );
      });

      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      console.log('✅ Konum alındı:', latitude, longitude);

    } catch (locationError) {
      console.warn('⚠️ Konum alınamadı, varsayılan konum kullanılıyor:', locationError.message);
      
      // ✅ Konum alınamazsa varsayılan ODTÜ koordinatları
      latitude = 39.8917;
      longitude = 32.7806;
      
      setError('⚠️ Konum alınamadı, varsayılan konum kullanıldı. Veri yine de gönderildi.');
    }

    // Validation
    if (activeTab === 'library') {
      if (!selectedFloor || !occupancyValue) {
        throw new Error('Lütfen tüm alanları doldurun');
      }

      // Firestore'a kaydet
      await addDoc(collection(db, 'library_data'), {
        floor: selectedFloor,
        occupancy: parseInt(occupancyValue),
        userId: user.uid,
        userEmail: user.email,
        latitude,
        longitude,
        timestamp: serverTimestamp()
      });

    } else if (activeTab === 'cafeteria') {
      if (!selectedCafeteria || !queueStatus) {
        throw new Error('Lütfen tüm alanları doldurun');
      }

      // Firestore'a kaydet
      await addDoc(collection(db, 'cafeteria_data'), {
        location: selectedCafeteria,
        queueStatus,
        occupancy: queueStatus === 'Kısa' ? 30 : queueStatus === 'Orta' ? 60 : 90,
        userId: user.uid,
        userEmail: user.email,
        latitude,
        longitude,
        timestamp: serverTimestamp()
      });
    }

    // Kullanıcı puanını güncelle
    const newPoints = points + 10;
    const newContributions = totalContributions + 1;

    await setDoc(doc(db, 'users', user.uid), {
      points: newPoints,
      totalContributions: newContributions,
      lastSubmit: serverTimestamp()
    }, { merge: true });

    const submitTime = Date.now();
    setPoints(newPoints);
    setTotalContributions(newContributions);
    setLastSubmitTime(submitTime);
    localStorage.setItem('libocculus_last_submit', submitTime.toString());
    
    setSuccess('Veri gönderildi! +10 puan kazandınız 🎉');
    
    // Form temizle
    setSelectedFloor('');
    setOccupancyValue('');
    setSelectedCafeteria('');
    setQueueStatus('');

    // Verileri yeniden çek
    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (err) {
    console.error('❌ Submit error:', err);
    
    if (err.message.includes('tüm alanları')) {
      setError(err.message);
    } else if (err.message.includes('Konum')) {
      setError(err.message);
    } else {
      setError('Veri gönderilemedi. Lütfen tekrar deneyin.');
    }
  } finally {
    setLoading(false);
  }
};


  const handleRedeemReward = async (reward) => {
    if (points < reward.points) {
      setError('Yetersiz puan!');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const code = Math.random().toString(36).substr(2, 6).toUpperCase();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const redemption = {
        id: `${Date.now()}`,
        code,
        reward,
        redeemedAt: new Date(),
        expiresAt: expiryDate,
        used: false
      };

      setMyRedemptions(prev => [redemption, ...prev]);
      setPoints(prev => prev - reward.points);
      setSelectedReward(redemption);
      setShowQR(true);
      setShowRewards(false);
    } catch (err) {
      setError('Ödül alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Animation Variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const modalVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4"
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
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

            <div className="p-8 pt-0 space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-500 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
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
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-green-800 text-sm">{success}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ODTÜ E-posta</label>
                    <input
                      type="email"
                      placeholder="e1234567@metu.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Şifre</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Giriş Yap'}
                  </button>
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-red-600 hover:underline"
                    >
                      Hesap Oluştur
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('reset')}
                      className="text-red-600 hover:underline"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Öğrenci Numarası</label>
                    <input
                      placeholder="1234567"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      maxLength={7}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ODTÜ E-posta</label>
                    <input
                      type="email"
                      placeholder="e1234567@metu.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Şifre</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Kayıt Ol'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full text-sm text-red-600 hover:underline"
                  >
                    Zaten hesabım var
                  </button>
                </form>
              )}

              {authMode === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ODTÜ E-posta</label>
                    <input
                      type="email"
                      placeholder="e1234567@metu.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Şifre Sıfırlama Linki Gönder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full text-sm text-red-600 hover:underline"
                  >
                    Giriş sayfasına dön
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // QR Code Modal
  if (showQR && selectedReward) {
    const daysLeft = Math.ceil((selectedReward.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    
    return (
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={modalVariants}
        onClick={() => { setShowQR(false); setSelectedReward(null); }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <QrCodeIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Ödülünüz Hazır!</h2>
            <p className="text-gray-600">{selectedReward.reward.name}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-4 border-green-200 flex flex-col items-center mb-6">
            <div className="text-6xl mb-4">{selectedReward.reward.icon}</div>
            <QRCodeSVG 
              value={`LIBOCCULUS:${selectedReward.code}:${selectedReward.id}`}
              size={200}
              level="H"
              includeMargin
            />
            <div className="text-4xl font-mono font-bold text-green-600 mt-4">
              {selectedReward.code}
            </div>
            <p className="text-sm text-gray-500 mt-2">Kod: #{selectedReward.id}</p>
          </div>

          <div className="bg-green-50 border border-green-500 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-green-800 text-sm">
                <strong>{selectedReward.reward.venue}</strong> lokasyonunda bu kodu göstererek ödülünüzü alabilirsiniz.
              </p>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
            <p className="text-sm text-center text-orange-800">
              ⏰ Bu kod <strong>{daysLeft} gün</strong> geçerlidir
            </p>
          </div>

          <button 
            onClick={() => { setShowQR(false); setSelectedReward(null); }}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    );
  }

  // Rewards Store Modal
  if (showRewards) {
    return (
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={modalVariants}
        onClick={() => setShowRewards(false)}
      >
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 my-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold">Ödül Mağazası</h2>
            </div>
            <button onClick={() => setShowRewards(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl mb-6">
            <p className="text-center text-lg">
              Mevcut Puanınız: <strong className="text-green-600 text-2xl">{points}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map(reward => (
              <motion.div
                key={reward.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{reward.icon}</div>
                  <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                    {reward.points} puan
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{reward.name}</h3>
                <p className="text-sm text-gray-600 mb-4">📍 {reward.venue}</p>
                <button
                  onClick={() => handleRedeemReward(reward)}
                  disabled={points < reward.points || loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Hemen Al'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // My Rewards Modal
  if (showMyRewards) {
    return (
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={modalVariants}
        onClick={() => setShowMyRewards(false)}
      >
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 my-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold">Ödüllerim</h2>
            </div>
            <button onClick={() => setShowMyRewards(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          {myRedemptions.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Henüz ödül almadınız</p>
              <button
                onClick={() => { setShowMyRewards(false); setShowRewards(true); }}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                Mağazaya Git
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRedemptions.map(redemption => {
                const daysLeft = Math.ceil((redemption.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
                const isExpired = daysLeft <= 0;
                
                return (
                  <div
                    key={redemption.id}
                    className={`border-2 rounded-xl p-6 ${isExpired ? 'bg-gray-50 border-gray-300' : 'bg-white border-green-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{redemption.reward.icon}</div>
                        <div>
                          <h3 className="font-bold text-lg">{redemption.reward.name}</h3>
                          <p className="text-sm text-gray-600">📍 {redemption.reward.venue}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Kod: <span className="font-mono font-bold">{redemption.code}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isExpired ? (
                          <span className="text-red-600 font-semibold">Süresi Doldu</span>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">Kalan Süre</p>
                            <p className="text-2xl font-bold text-green-600">{daysLeft} gün</p>
                            <button
                              onClick={() => { setSelectedReward(redemption); setShowQR(true); setShowMyRewards(false); }}
                              className="mt-2 text-sm text-blue-600 hover:underline"
                            >
                              QR Göster
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Main Dashboard
  const libraryChartData = Object.entries(libraryData).map(([floor, data]) => ({
    floor,
    doluluk: data.occupancy
  }));

  const averageLibrary = Math.round(Object.values(libraryData).reduce((a, b) => a + b.occupancy, 0) / 7);
  const averageCafeteria = Math.round(Object.values(cafeteriaData).reduce((a, b) => a + b.occupancy, 0) / 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Libocculus</h1>
                <p className="text-red-100 text-xs">ODTÜ Kampüs Takip</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className="font-bold">{points}</span>
              </div>
              <button 
                onClick={() => setShowMyRewards(true)}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Ödüllerim</span>
              </button>
              <button 
                onClick={() => setShowRewards(true)}
                className="bg-white text-red-600 hover:bg-red-50 font-semibold px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Mağaza</span>
              </button>
              <button 
                onClick={handleLogout}
                className="text-white hover:bg-white/20 p-2 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-500 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border border-green-500 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Toplam Katkı</p>
                <p className="text-3xl font-bold text-blue-600">{totalContributions}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-400" />
            </div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl border-2 border-green-200 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Puanınız</p>
                <p className="text-3xl font-bold text-green-600">{points}</p>
              </div>
              <Award className="w-12 h-12 text-green-400" />
            </div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl border-2 border-orange-200 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sonraki Veri</p>
                <p className="text-2xl font-bold text-orange-600">
                  {canSubmit() ? '✓ Hazır' : `⏳ ${getTimeUntilNextSubmit()}`}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-400" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-lg border-2 border-gray-200">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Kütüphane
          </button>
          <button
            onClick={() => setActiveTab('cafeteria')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'cafeteria'
                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            Yemekhane
          </button>
        </div>

        {/* Library Tab */}
        {activeTab === 'library' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold">Kütüphane Doluluk Durumu</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Ortalama Doluluk: <strong className="text-red-600 text-xl">{averageLibrary}%</strong>
              </p>

              <div className="mb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={libraryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="floor" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="doluluk" fill="#dc2626" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(libraryData).map(([floor, data]) => (
                  <motion.div
                    key={floor}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl border-2 border-red-100 cursor-pointer"
                  >
                    <p className="text-xs text-gray-600 font-semibold mb-1">{floor}</p>
                    <p className="text-2xl font-bold text-red-600">{data.occupancy}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${data.occupancy}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Form - Library */}
            <div className="bg-white rounded-xl border-2 border-green-200 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold">Kütüphane Verisi Gönder</h3>
              </div>
              <p className="text-gray-600 mb-4">
                {canSubmit() ? 'Şu anda kütüphanede misiniz? Doluluk verisini paylaşın!' : `${getTimeUntilNextSubmit()} sonra tekrar gönderebilirsiniz.`}
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={selectedFloor} 
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    disabled={!canSubmit()}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Kat Seçin</option>
                    {Object.keys(libraryData).map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Doluluk % (0-100)" 
                    min="0" 
                    max="100"
                    value={occupancyValue}
                    onChange={(e) => setOccupancyValue(e.target.value)}
                    disabled={!canSubmit()}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button 
                  onClick={handleSubmitData}
                  disabled={!canSubmit() || loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Gönder (+10 Puan)
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  * Konum otomatik olarak alınacaktır
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cafeteria Tab */}
        {activeTab === 'cafeteria' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border-2 border-orange-200 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold">Yemekhane Doluluk Durumu</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Ortalama Doluluk: <strong className="text-orange-600 text-xl">{averageCafeteria}%</strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(cafeteriaData).map(([floor, data]) => (
                  <motion.div
                    key={floor}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">{floor.replace('_', ' ')}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        data.queueStatus === 'Kısa' ? 'bg-green-100 text-green-700' :
                        data.queueStatus === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        Sıra: {data.queueStatus}
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-orange-600 mb-3">{data.occupancy}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-orange-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${data.occupancy}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Form - Cafeteria */}
            <div className="bg-white rounded-xl border-2 border-green-200 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold">Yemekhane Verisi Gönder</h3>
              </div>
              <p className="text-gray-600 mb-4">
                {canSubmit() ? 'Şu anda yemekhanede misiniz? Sıra durumunu paylaşın!' : `${getTimeUntilNextSubmit()} sonra tekrar gönderebilirsiniz.`}
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={selectedCafeteria} 
                    onChange={(e) => setSelectedCafeteria(e.target.value)}
                    disabled={!canSubmit()}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Kat Seçin</option>
                    {Object.keys(cafeteriaData).map(floor => (
                      <option key={floor} value={floor}>{floor.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <select 
                    value={queueStatus} 
                    onChange={(e) => setQueueStatus(e.target.value)}
                    disabled={!canSubmit()}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sıra Durumu</option>
                    <option value="Kısa">Kısa (0-5 dk)</option>
                    <option value="Orta">Orta (5-15 dk)</option>
                    <option value="Uzun">Uzun (15+ dk)</option>
                  </select>
                </div>
                <button 
                  onClick={handleSubmitData}
                  disabled={!canSubmit() || loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Gönder (+10 Puan)
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  * Konum otomatik olarak alınacaktır
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showRewards || showMyRewards || showQR) && (
          <>
            {showRewards && <div />}
            {showMyRewards && <div />}
            {showQR && <div />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibocculusApp;