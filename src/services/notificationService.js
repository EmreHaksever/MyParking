import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
    const now = Date.now();
    
    // Bildirim zamanını hesapla (bitiş zamanından 5 dakika önce)
    const endTime = now + (totalMinutes * 60 * 1000); // Toplam süre sonundaki zaman
    const scheduledTime = endTime - (warningMinutes * 60 * 1000); // Bitiş zamanından 5 dakika önce

    console.log('Bildirim Zamanlaması:', {
      şuAn: new Date(now).toLocaleString(),
      toplamSüre: totalMinutes + ' dakika',
      bitişZamanı: new Date(endTime).toLocaleString(),
      bildirimZamanı: new Date(scheduledTime).toLocaleString(),
      kalanSüre: Math.round((scheduledTime - now) / (60 * 1000)) + ' dakika sonra bildirim gönderilecek'
    });

    // Eğer bildirim zamanı şu andan en az 1 dakika sonraysa planla
    if (scheduledTime - now >= 60000) { // 60000 ms = 1 dakika
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Park Süresi Uyarısı',
          body: `${description} konumundaki park sürenizin bitmesine 5 dakika kaldı!`,
          data: { locationId },
        },
        trigger: {
          date: scheduledTime,
        },
      });

      console.log('Bildirim planlandı:', {
        id: identifier,
        planlanmaZamanı: new Date(scheduledTime).toLocaleString()
      });
      return identifier;
    } else {
      console.log('Bildirim planlanmadı: Süre çok kısa (en az 6 dakika olmalı)');
    }
  } catch (error) {
    console.error('Bildirim planlama hatası:', error);
  }
};

export const cancelParkingNotification = async (locationId) => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notification = scheduledNotifications.find(
      n => n.content.data?.locationId === locationId
    );
    
    if (notification) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log('Bildirim iptal edildi:', locationId);
    }
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
}; 