import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import LoginScreen from './components/LoginScreen';
import LibocculusApp from './LibocculusApp';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <LoginScreen />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <LibocculusApp /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App();
