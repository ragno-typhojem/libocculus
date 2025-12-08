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
      // Email validasyonu
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      // Şifre validasyonu
      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      console.log('🔵 Kullanıcı oluşturuluyor...');
      console.log('📧 Email:', email);

      // Firebase Auth ile kullanıcı oluştur
      const result = await createUserWithEmailAndPassword(auth, email, password);

      console.log('✅ Firebase Auth kullanıcısı oluşturuldu');
      console.log('👤 User UID:', result.user.uid);
      console.log('📧 User Email:', result.user.email);
      console.log('✉️ Email Verified:', result.user.emailVerified);

      // ✅ Email doğrulama maili gönder
      console.log('🔵 Doğrulama maili gönderiliyor...');

      try {
        await sendEmailVerification(result.user, {
          url: 'https://libocculus.netlify.app',
          handleCodeInApp: false
        });

        console.log('✅ sendEmailVerification çağrısı başarılı');
        console.log('📬 Mail gönderildi:', result.user.email);
      } catch (emailError) {
        console.error('❌ Email gönderme hatası:', emailError);
        console.error('Error code:', emailError.code);
        console.error('Error message:', emailError.message);
        throw emailError;
      }

      // Firestore'a kullanıcı bilgilerini kaydet
      console.log('🔵 Firestore kaydı oluşturuluyor...');
      
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

      // ✅ Kullanıcıyı çıkış yaptır (email doğrulanmadan giriş yapmasın)
      await signOut(auth);
      console.log('✅ Kullanıcı çıkış yaptırıldı');

      setSuccess(`Kayıt başarılı! ${email} adresine doğrulama linki gönderildi. Lütfen mailinizi kontrol edin.`);
      return result.user;
    } catch (err) {
      console.error('❌ Register error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);

      let errorMessage = 'Kayıt başarısız. Lütfen tekrar deneyin.';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. En az 6 karakter kullanın.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla istek. Lütfen birkaç dakika bekleyin.';
      } else if (err.message) {
        errorMessage = err.message;
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
      if (!email.endsWith('@gmail.com')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      console.log('🔵 Giriş yapılıyor...');
      console.log('📧 Email:', email);

      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log('✅ Firebase Auth girişi başarılı');
      console.log('👤 User UID:', result.user.uid);
      console.log('✉️ Email Verified:', result.user.emailVerified);

      // ✅ Email doğrulaması kontrolü
      if (!result.user.emailVerified) {
        console.log('❌ Email doğrulanmamış!');
        await signOut(auth);
        throw new Error('E-posta adresiniz doğrulanmamış. Lütfen mailinizi kontrol edin ve doğrulama linkine tıklayın.');
      }

      console.log('✅ Email doğrulanmış');

      // Firestore'da kullanıcı var mı kontrol et
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        console.log('⚠️ Firestore kaydı yok, oluşturuluyor...');
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          studentId: email.split('@')[0].substring(1),
          points: 0,
          totalContributions: 0,
          emailVerified: true,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      } else {
        // Email verified durumunu güncelle + son giriş
        await setDoc(doc(db, 'users', result.user.uid), {
          emailVerified: true,
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
      } else if (err.message.includes('doğrulanmamış')) {
        errorMessage = err.message;
      } else if (err.message) {
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

      console.log('🔵 Mevcut kullanıcı:', user);

      if (!user) {
        throw new Error('Lütfen önce kayıt olun');
      }

      if (user.emailVerified) {
        throw new Error('E-posta adresiniz zaten doğrulanmış. Giriş yapabilirsiniz.');
      }

      console.log('🔵 Doğrulama maili tekrar gönderiliyor...');

      await sendEmailVerification(user, {
        url: 'https://libocculus.netlify.app',
        handleCodeInApp: false
      });

      console.log('✅ Doğrulama maili tekrar gönderildi');

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
      if (!email.endsWith('@gmail.com')) {
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
    resendVerification,
    resetPassword,
    loading,
    error,
    success
  };
};
