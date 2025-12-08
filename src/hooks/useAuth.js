import { useState } from 'react';
import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ OTP Gönder (Firebase Email Link kullanarak)
  const sendOTP = async (email) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Email validasyonu
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      console.log('🔵 OTP oluşturuluyor...');

      // 6 haneli OTP oluştur
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 dakika

      // Firestore'a kaydet
      await setDoc(doc(db, 'otps', email), {
        otp,
        expiresAt,
        verified: false,
        createdAt: new Date()
      });

      console.log('✅ OTP Firestore\'a kaydedildi:', otp);

      // ✅ Firebase Email Link gönder (OTP'yi URL'de gömme)
      const actionCodeSettings = {
        url: `https://libocculus.netlify.app/?email=${encodeURIComponent(email)}&otp=${otp}`,
        handleCodeInApp: false // Email'de direkt gösterilsin
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      console.log('✅ Email gönderildi');

      setSuccess('Doğrulama kodu e-posta adresinize gönderildi! (10 dakika geçerli)');
      return true;
    } catch (err) {
      console.error('❌ OTP send error:', err);

      let errorMessage = 'OTP gönderilemedi. Lütfen tekrar deneyin.';

      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'Günlük limit aşıldı. Lütfen yarın tekrar deneyin.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ OTP Doğrula ve Kayıt Ol
  const verifyOTPAndRegister = async (email, otp, password) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔵 OTP doğrulanıyor...');

      // Firestore'dan OTP'yi getir
      const otpDoc = await getDoc(doc(db, 'otps', email));

      if (!otpDoc.exists()) {
        throw new Error('OTP bulunamadı. Lütfen yeni kod isteyin.');
      }

      const otpData = otpDoc.data();

      // Süre kontrolü
      if (Date.now() > otpData.expiresAt) {
        throw new Error('OTP süresi dolmuş. Lütfen yeni kod isteyin.');
      }

      // OTP kontrolü
      if (otpData.otp !== otp.trim()) {
        throw new Error('Geçersiz OTP. Lütfen tekrar kontrol edin.');
      }

      console.log('✅ OTP doğrulandı');

      // Şifre validasyonu
      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      // Kullanıcı oluştur
      console.log('🔵 Kullanıcı oluşturuluyor...');
      const result = await createUserWithEmailAndPassword(auth, email, password);

      console.log('✅ Firebase Auth kullanıcısı oluşturuldu');

      // Firestore'a kullanıcı bilgilerini kaydet
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        studentId: email.split('@')[0].substring(1),
        points: 0,
        totalContributions: 0,
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      console.log('✅ Firestore kaydı oluşturuldu');

      // OTP'yi sil (veya verified işaretle)
      await setDoc(doc(db, 'otps', email), {
        verified: true,
        verifiedAt: new Date()
      }, { merge: true });

      setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
      return result.user;
    } catch (err) {
      console.error('❌ Verify and register error:', err);

      let errorMessage = 'Doğrulama başarısız.';

      if (err.message.includes('OTP süresi dolmuş')) {
        errorMessage = 'Doğrulama kodunun süresi dolmuş. Yeni kod isteyin.';
      } else if (err.message.includes('Geçersiz OTP')) {
        errorMessage = 'Geçersiz doğrulama kodu. Lütfen mailinizi kontrol edin.';
      } else if (err.message.includes('OTP bulunamadı')) {
        errorMessage = err.message;
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Giriş yap
  const login = async (email, password) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      console.log('🔵 Giriş yapılıyor...');

      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log('✅ Firebase Auth girişi başarılı');

      // Firestore'da kullanıcı var mı kontrol et
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        console.log('⚠️ Firestore kaydı yok, oluşturuluyor...');
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          studentId: email.split('@')[0].substring(1),
          points: 0,
          totalContributions: 0,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      } else {
        // Son giriş tarihini güncelle
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: new Date()
        }, { merge: true });
      }

      console.log('✅ Giriş başarılı');
      setSuccess('Hoş geldiniz!');
      return result.user;
    } catch (err) {
      console.error('❌ Login error:', err);

      let errorMessage = 'Giriş başarısız. Lütfen tekrar deneyin.';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Kullanıcı bulunamadı. Lütfen önce kayıt olun.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Hatalı e-posta veya şifre.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Şifre sıfırlama
  const resetPassword = async (email) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      console.log('🔵 Şifre sıfırlama maili gönderiliyor...');

      await sendPasswordResetEmail(auth, email);

      console.log('✅ Şifre sıfırlama maili gönderildi');

      setSuccess('Şifre sıfırlama linki e-posta adresinize gönderildi.');
      return true;
    } catch (err) {
      console.error('❌ Reset password error:', err);

      let errorMessage = 'Şifre sıfırlama başarısız.';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
      }

      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendOTP,
    verifyOTPAndRegister,
    login,
    resetPassword,
    loading,
    error,
    success
  };
};
