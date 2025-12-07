import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './config';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Veritabanı hazırlanıyor...');

    // Kütüphane katları
    const libraryFloors = ['1B', '2B', '3B', '1A', '2A', '3A', 'SESLİ'];
    const occupancies = [45, 67, 82, 34, 56, 71, 89];

    for (let i = 0; i < libraryFloors.length; i++) {
      await setDoc(doc(db, 'library', libraryFloors[i]), {
        occupancy: occupancies[i],
        lastUpdated: new Date(),
        updatedBy: 'system'
      });
      console.log(`✓ ${libraryFloors[i]} eklendi`);
    }

    // Yemekhane
    await setDoc(doc(db, 'cafeteria', 'ÜST_KAT'), {
      occupancy: 72,
      queueStatus: 'Orta',
      lastUpdated: new Date(),
      updatedBy: 'system'
    });

    await setDoc(doc(db, 'cafeteria', 'ALT_KAT'), {
      occupancy: 58,
      queueStatus: 'Kısa',
      lastUpdated: new Date(),
      updatedBy: 'system'
    });

    // Ödüller
    const rewards = [
      { id: 'reward1', name: 'Çatı Cafe - Kahve', points: 50, venue: 'Çatı', icon: '☕', available: true },
      { id: 'reward2', name: 'Yemekhane - Tatlı', points: 30, venue: 'Yemekhane', icon: '🍰', available: true },
      { id: 'reward3', name: 'Zeynel - Sandviç', points: 40, venue: 'Zeynel', icon: '🥪', available: true },
      { id: 'reward4', name: 'Çatı Cafe - Çay + Poğaça', points: 25, venue: 'Çatı', icon: '🫖', available: true },
      { id: 'reward5', name: 'Yemekhane - İçecek', points: 20, venue: 'Yemekhane', icon: '🥤', available: true },
      { id: 'reward6', name: 'Zeynel - Tost', points: 35, venue: 'Zeynel', icon: '🥙', available: true }
    ];

    for (const reward of rewards) {
      await setDoc(doc(db, 'rewards', reward.id), reward);
      console.log(`✓ ${reward.name} eklendi`);
    }

    console.log('✅ Veritabanı hazır!');
    return { success: true, message: 'Veritabanı başarıyla hazırlandı!' };
  } catch (error) {
    console.error('❌ Hata:', error);
    return { success: false, message: error.message };
  }
};

export const checkIfSeeded = async () => {
  try {
    const librarySnapshot = await getDocs(collection(db, 'library'));
    const rewardsSnapshot = await getDocs(collection(db, 'rewards'));
    return librarySnapshot.size > 0 && rewardsSnapshot.size > 0;
  } catch (error) {
    console.error('Kontrol hatası:', error);
    return false;
  }
};
