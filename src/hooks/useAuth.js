import { useState } from 'react';
import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Kayıt ol + Email doğrulama gönder
  const register = async (email, password) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      console.log('🔵 Kullanıcı oluşturuluyor...');
      
      // Kullanıcı oluştur
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Kullanıcı oluşturuldu:', result.user.email);
      
      // ✅ Email doğrulama maili gönder
      console.log('🔵 Doğrulama maili gönderiliyor...');
      await sendEmailVerification(result.user, {
        url: 'https://libocculus.netlify.app/', // Doğrulama sonrası yönlendirilecek URL
        handleCodeInApp: false
      });
      
      console.log('✅ Doğrulama maili gönderildi');
      
      // Firestore'a kaydet
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        studentId: email.split('@')[0].substring(1),
        points: 0,
        totalContributions: 0,
        emailVerified: false,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      console.log('✅ Firestore kaydı oluşturuldu');

      // ✅ Kullanıcıyı çıkış yaptır (doğrulamadan giriş yapmasın)
      await signOut(auth);
      
      setSuccess('Kayıt başarılı! Lütfen e-posta adresinize gelen doğrulama linkine tıklayın.');
      return result.user;
    } catch (err) {
      console.error('❌ Register error:', err);
      
      let errorMessage = 'Kayıt başarısız. Lütfen tekrar deneyin.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. En az 6 karakter kullanın.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Giriş yap (email doğrulaması kontrol et)
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
      
      console.log('✅ Firebase girişi başarılı');
      console.log('🔵 Email doğrulandı mı?', result.user.emailVerified);

      // ✅ Email doğrulaması kontrolü
      if (!result.user.emailVerified) {
        console.log('❌ Email doğrulanmamış!');
        await signOut(auth); // Çıkış yaptır
        throw new Error('E-posta adresiniz doğrulanmamış. Lütfen mailinizi kontrol edin.');
      }
      
      console.log('✅ Email doğrulanmış, giriş başarılı');
      
      // Firestore'da email verified durumunu güncelle
      await setDoc(doc(db, 'users', result.user.uid), {
        emailVerified: true,
        lastLogin: new Date()
      }, { merge: true });

      setSuccess('Giriş başarılı!');
      return result.user;
    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Giriş başarısız. Lütfen tekrar deneyin.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Kullanıcı bulunamadı. Lütfen kayıt olun.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Hatalı şifre.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      } else if (err.message.includes('doğrulanmamış')) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Doğrulama mailini tekrar gönder
  const resendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Lütfen önce giriş yapın');
      }

      if (user.emailVerified) {
        throw new Error('E-posta adresiniz zaten doğrulanmış');
      }

      await sendEmailVerification(user, {
        url: 'https://libocculus.netlify.app/',
        handleCodeInApp: false
      });

      setSuccess('Doğrulama maili tekrar gönderildi! Lütfen mailinizi kontrol edin.');
      return true;
    } catch (err) {
      console.error('❌ Resend verification error:', err);
      setError(err.message || 'Doğrulama maili gönderilemedi.');
      return false;
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

      await sendPasswordResetEmail(auth, email);
      
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
    resendVerification,
    resetPassword,
    loading,
    error,
    success
  };
};
