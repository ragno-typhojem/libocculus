import { useState } from 'react';
import { auth, db } from '../firebase/config';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendLoginEmail = async (email) => {
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('🔵 Mail gönderme başladı:', email);

    try {
      // Email validasyonu
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      // ✅ Dokümantasyona göre actionCodeSettings
      const actionCodeSettings = {
        // ✅ Tam URL (protocol dahil)
        url: 'https://libocculus.netlify.app/verify-email',
        // ✅ Uygulamada işlenecek
        handleCodeInApp: true,
        // ✅ iOS ayarları (opsiyonel)
        iOS: {
          bundleId: 'com.libocculus.app'
        },
        // ✅ Android ayarları (opsiyonel)
        android: {
          packageName: 'com.libocculus.app',
          installApp: true,
          minimumVersion: '12'
        },
        // ✅ Dynamic Link domain (eğer varsa)
        // dynamicLinkDomain: 'libocculus.page.link'
      };

      console.log('🔵 sendSignInLinkToEmail çağrılıyor...');
      console.log('🔵 Email:', email);
      console.log('🔵 Settings:', actionCodeSettings);

      // ✅ Firebase'e mail gönder
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      console.log('✅ Firebase mail gönderdi!');
      
      // ✅ Email'i localStorage'a kaydet (önemli!)
      window.localStorage.setItem('emailForSignIn', email);
      
      setSuccess('Doğrulama linki e-posta adresinize gönderildi! Lütfen mailinizi kontrol edin.');
      return true;
    } catch (err) {
      console.error('❌ Hata:', err);
      console.error('❌ Hata kodu:', err.code);
      console.error('❌ Hata mesajı:', err.message);
      
      // ✅ Kullanıcı dostu hata mesajları
      let errorMessage = 'E-posta gönderilemedi. Lütfen tekrar deneyin.';
      
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (err.code === 'auth/unauthorized-continue-uri') {
        errorMessage = 'Domain yetkilendirilmemiş. Lütfen yöneticiyle iletişime geçin.';
      } else if (err.code === 'auth/invalid-continue-uri') {
        errorMessage = 'Geçersiz yönlendirme URL\'si.';
      } else if (err.code === 'auth/missing-continue-uri') {
        errorMessage = 'Yönlendirme URL\'si eksik.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailLink = async () => {
    setLoading(true);
    setError('');

    console.log('🔵 Email doğrulama başladı');
    console.log('🔵 URL:', window.location.href);

    try {
      // ✅ URL'de email link var mı kontrol et
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        console.log('❌ Geçersiz email link');
        throw new Error('Geçersiz doğrulama linki');
      }

      console.log('✅ Geçerli email link bulundu');

      // ✅ Email'i localStorage'dan al
      let email = window.localStorage.getItem('emailForSignIn');
      console.log('🔵 localStorage email:', email);
      
      // ✅ Eğer yoksa kullanıcıdan iste
      if (!email) {
        console.log('⚠️ Email localStorage\'da yok, kullanıcıdan isteniyor');
        email = window.prompt('Lütfen doğrulama için e-posta adresinizi girin');
      }

      // ✅ Email validasyonu
      if (!email || !email.endsWith('@metu.edu.tr')) {
        throw new Error('Geçerli bir ODTÜ e-posta adresi gerekli');
      }

      console.log('🔵 signInWithEmailLink çağrılıyor...');
      
      // ✅ Email link ile giriş yap
      const result = await signInWithEmailLink(auth, email, window.location.href);
      
      console.log('✅ Giriş başarılı!');
      console.log('✅ User:', result.user.email);
      
      // ✅ Kullanıcı verisini Firestore'a kaydet
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log('🔵 Yeni kullanıcı oluşturuluyor...');
        await setDoc(userRef, {
          email: result.user.email,
          studentId: email.split('@')[0].substring(1), // e1234567 -> 1234567
          points: 0,
          totalContributions: 0,
          createdAt: new Date(),
          lastLogin: new Date()
        });
        console.log('✅ Kullanıcı oluşturuldu');
      } else {
        console.log('🔵 Mevcut kullanıcı güncelleniyor...');
        await setDoc(userRef, {
          lastLogin: new Date()
        }, { merge: true });
        console.log('✅ Kullanıcı güncellendi');
      }

      // ✅ localStorage'ı temizle
      window.localStorage.removeItem('emailForSignIn');
      
      setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
      return result.user;
    } catch (err) {
      console.error('❌ Doğrulama hatası:', err);
      console.error('❌ Hata kodu:', err.code);
      console.error('❌ Hata mesajı:', err.message);
      
      let errorMessage = 'Doğrulama başarısız. Lütfen tekrar deneyin.';
      
      if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'Doğrulama linki geçersiz veya süresi dolmuş.';
      } else if (err.code === 'auth/expired-action-code') {
        errorMessage = 'Doğrulama linkinin süresi dolmuş. Yeni bir link isteyin.';
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendLoginEmail,
    verifyEmailLink,
    loading,
    error,
    success
  };
};
