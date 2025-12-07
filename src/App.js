import React, { useState, useEffect } from 'react';
import { seedDatabase, checkIfSeeded } from './firebase/seed';
import LibocculusApp from './LibocculusApp'
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [needsSeed, setNeedsSeed] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    const isSeeded = await checkIfSeeded();
    setNeedsSeed(!isSeeded);
    setLoading(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    const result = await seedDatabase();
    setMessage(result.message);
    
    if (result.success) {
      setNeedsSeed(false);
      setTimeout(() => setMessage(''), 3000);
    }
    
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Loader2 className="w-12 h-12 animate-spin text-red-600" />
      </div>
    );
  }

  if (needsSeed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Veritabanı Kurulumu</h1>
            <p className="text-gray-600">İlk verileri yüklemek için butona tıklayın</p>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg border ${message.includes('başarıyla') ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <div className="flex items-center gap-2">
                {message.includes('başarıyla') ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={message.includes('başarıyla') ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {seeding ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Veritabanını Hazırla
              </>
            )}
          </button>

          <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold mb-2">Yüklenecek veriler:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>7 Kütüphane Katı</li>
              <li>2 Yemekhane Katı</li>
              <li>6 Ödül Kategorisi</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <LibocculusApp />;
}

export default App;
