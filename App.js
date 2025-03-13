import React, { useEffect } from 'react';
import Navigation from './src/navigation';
import { ThemeProvider } from './src/context/ThemeContext';
import { loadSavedNotificationTimers } from './src/services/notificationService';

export default function App() {
  // Uygulama başlatıldığında kaydedilmiş zamanlayıcıları yükle
  useEffect(() => {
    loadSavedNotificationTimers();
  }, []);

  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
