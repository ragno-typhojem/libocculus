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

  // Email doğrulama linki gönder
  const sendLoginEmail = async (email) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // ODTÜ mail kontrolü
      if (!email.endsWith('@metu.edu.tr')) {
        throw new Error('Lütfen ODTÜ e-posta adresinizi kullanın (@metu.edu.tr)');
      }

      const actionCodeSettings = {
        url: window.location.origin + '/verify-email',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Email'i localStorage'a kaydet (doğrulama için gerekli)
      window.localStorage.setItem('emailForSignIn', email);
      
      setSuccess('Doğrulama linki e-posta adresinize gönderildi! Lütfen mailinizi kontrol edin.');
      return true;
    } catch (err) {
      console.error('Login email error:', err);
      setError(err.message || 'E-posta gönderilemedi. Lütfen tekrar deneyin.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Email linkinden giriş yap
  const verifyEmailLink = async () => {
    setLoading(true);
    setError('');

    try {
      // URL'de email link var mı kontrol et
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        throw new Error('Geçersiz doğrulama linki');
      }

      // Email'i localStorage'dan al
      let email = window.localStorage.getItem('emailForSignIn');
      
      // Eğer yoksa kullanıcıdan iste
      if (!email) {
        email = window.prompt('Lütfen doğrulama için e-posta adresinizi girin');
      }

      if (!email || !email.endsWith('@metu.edu.tr')) {
        throw new Error('Geçerli bir ODTÜ e-posta adresi gerekli');
      }

      // Email link ile giriş yap
      const result = await signInWithEmailLink(auth, email, window.location.href);
      
      // Kullanıcı verisini Firestore'a kaydet
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // İlk giriş - kullanıcı kaydı oluştur
        await setDoc(userRef, {
          email: result.user.email,
          studentId: email.split('@')[0].substring(1), // e1234567 -> 1234567
          points: 0,
          totalContributions: 0,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      } else {
        // Mevcut kullanıcı - son giriş tarihini güncelle
        await setDoc(userRef, {
          lastLogin: new Date()
        }, { merge: true });
      }

      // localStorage'ı temizle
      window.localStorage.removeItem('emailForSignIn');
      
      setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
      return result.user;
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err.message || 'Doğrulama başarısız. Lütfen tekrar deneyin.');
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
