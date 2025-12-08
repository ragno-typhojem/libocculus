import { useState } from 'react';
import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Kayıt ol
  const register = async (email, password) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Email validasyonu
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      // Şifre validasyonu
      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      console.log('🔵 Kullanıcı oluşturuluyor...');

      // Firebase Auth ile kullanıcı oluştur
      const result = await createUserWithEmailAndPassword(auth, email, password);

      console.log('✅ Firebase Auth kullanıcısı oluşturuldu');

      // Firestore'a kullanıcı bilgilerini kaydet
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        studentId: email.split('@')[0].substring(1), // e1234567 -> 1234567
        points: 0,
        totalContributions: 0,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      console.log('✅ Firestore kaydı oluşturuldu');

      setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
      return result.user;
    } catch (err) {
      console.error('❌ Register error:', err);

      let errorMessage = 'Kayıt başarısız. Lütfen tekrar deneyin.';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. En az 6 karakter kullanın.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
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
      // Email validasyonu
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      console.log('🔵 Giriş yapılıyor...');

      // Firebase Auth ile giriş
      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log('✅ Firebase Auth girişi başarılı');

      // Firestore'da kullanıcı var mı kontrol et
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        console.log('⚠️ Firestore kaydı yok, oluşturuluyor...');
        // Eğer Firestore kaydı yoksa oluştur (eski kullanıcılar için)
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
    register,
    login,
    resetPassword,
    loading,
    error,
    success
  };
};
