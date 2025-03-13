import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirim işleyicisini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Zamanlayıcıları saklamak için bir nesne
const notificationTimers = {};

// AsyncStorage anahtarları
const TIMER_STORAGE_KEY = 'parking_notification_timers';

// Uygulama başlatıldığında zamanlayıcıları yeniden yükle
export const loadSavedNotificationTimers = async () => {
  try {
    const savedTimersString = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
    if (savedTimersString) {
      const savedTimers = JSON.parse(savedTimersString);
      
      // Kaydedilmiş her zamanlayıcı için yeni zamanlayıcı oluştur
      Object.keys(savedTimers).forEach(locationId => {
        const timerData = savedTimers[locationId];
        const now = new Date().getTime();
        
        // Eğer bildirim zamanı geçmemişse yeni zamanlayıcı oluştur
        if (timerData.notificationTime > now) {
          const timeLeft = timerData.notificationTime - now;
          scheduleLocalNotification(
            locationId,
            timerData.description,
            timeLeft / 1000 // milisaniyeyi saniyeye çevir
          );
        }
      });
      
      console.log('Kaydedilmiş bildirim zamanlayıcıları yüklendi');
    }
  } catch (error) {
    console.error('Bildirim zamanlayıcıları yüklenirken hata:', error);
  }
};

// Zamanlayıcıları AsyncStorage'a kaydet
const saveNotificationTimers = async () => {
  try {
    const timersToSave = {};
    
    // Her zamanlayıcı için bilgileri sakla
    Object.keys(notificationTimers).forEach(locationId => {
      if (notificationTimers[locationId]) {
        timersToSave[locationId] = {
          locationId,
          description: notificationTimers[locationId].description,
          notificationTime: notificationTimers[locationId].notificationTime
        };
      }
    });
    
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timersToSave));
  } catch (error) {
    console.error('Bildirim zamanlayıcıları kaydedilirken hata:', error);
  }
};

// Yerel bildirim gönder (zamanlayıcı tamamlandığında)
const sendLocalNotification = async (locationId, description) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Park Süresi Uyarısı',
        body: `${description} konumundaki park sürenizin bitmesine 5 dakika kaldı!`,
        data: { locationId },
      },
      trigger: null, // Hemen gönder
    });
    
    console.log('Bildirim gönderildi:', locationId);
    
    // Zamanlayıcıyı temizle
    if (notificationTimers[locationId]) {
      notificationTimers[locationId] = null;
      saveNotificationTimers();
    }
  } catch (error) {
    console.error('Bildirim gönderilirken hata:', error);
  }
};

// Yerel zamanlayıcı ile bildirim planla
const scheduleLocalNotification = (locationId, description, seconds) => {
  // Önceki zamanlayıcıyı temizle (varsa)
  if (notificationTimers[locationId] && notificationTimers[locationId].timerId) {
    clearTimeout(notificationTimers[locationId].timerId);
  }
  
  console.log(`${locationId} için ${seconds} saniye sonra bildirim planlanıyor`);
  
  // Yeni zamanlayıcı oluştur
  const timerId = setTimeout(() => {
    sendLocalNotification(locationId, description);
  }, seconds * 1000);
  
  // Zamanlayıcı bilgilerini sakla
  notificationTimers[locationId] = {
    timerId,
    description,
    notificationTime: new Date().getTime() + (seconds * 1000)
  };
  
  // Zamanlayıcıları kaydet
  saveNotificationTimers();
  
  return timerId;
};

export const scheduleParkingNotification = async (locationId, description, totalMinutes) => {
  try {
    // Bildirim için izin iste
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Bildirim izni verilmedi');
      return;
    }

    // Önceki bildirimi iptal et (varsa)
    await cancelParkingNotification(locationId);

    // Bildirim zamanını hesapla
    const warningMinutes = 5; // Kaç dakika kala bildirim gönderilecek

    // Şu anki zamanı al
    const now = new Date();
    
    // Bildirim zamanını hesapla - bitiş zamanından 5 dakika önce
    const endTime = new Date(now.getTime() + (totalMinutes * 60 * 1000)); // Toplam süre sonundaki zaman
    const notificationTime = new Date(endTime.getTime() - (warningMinutes * 60 * 1000)); // Bitiş zamanından 5 dakika önce

    // Bildirim zamanı ile şu anki zaman arasındaki farkı saniye cinsinden hesapla
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);

    console.log('Bildirim Zamanlaması:', {
      şuAn: now.toLocaleString(),
      toplamSüre: totalMinutes + ' dakika',
      bitişZamanı: endTime.toLocaleString(),
      bildirimZamanı: notificationTime.toLocaleString(),
      kalanSüre: Math.round((notificationTime.getTime() - now.getTime()) / (60 * 1000)) + ' dakika sonra bildirim gönderilecek',
      kalanSaniye: secondsUntilNotification
    });

    // Eğer bildirim zamanı şu andan en az 1 dakika sonraysa planla
    if (totalMinutes > warningMinutes) { // En az 6 dakikalık park süresi olmalı
      // Yerel zamanlayıcı ile bildirim planla
      const timerId = scheduleLocalNotification(locationId, description, secondsUntilNotification);
      
      console.log('Bildirim zamanlayıcısı planlandı:', {
        locationId,
        timerId,
        planlanmaZamanı: notificationTime.toLocaleString(),
        kalanSaniye: secondsUntilNotification
      });
      
      return locationId;
    } else {
      console.log('Bildirim planlanmadı: Süre çok kısa (en az 6 dakika olmalı)');
    }
  } catch (error) {
    console.error('Bildirim planlama hatası:', error);
  }
};

export const cancelParkingNotification = async (locationId) => {
  try {
    // Expo bildirimlerini iptal et
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notification = scheduledNotifications.find(
      n => n.content.data?.locationId === locationId
    );
    
    if (notification) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log('Expo bildirimi iptal edildi:', locationId);
    }
    
    // Yerel zamanlayıcıyı iptal et
    if (notificationTimers[locationId] && notificationTimers[locationId].timerId) {
      clearTimeout(notificationTimers[locationId].timerId);
      notificationTimers[locationId] = null;
      saveNotificationTimers();
      console.log('Bildirim zamanlayıcısı iptal edildi:', locationId);
    }
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
}; 