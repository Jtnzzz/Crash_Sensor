import { Linking } from 'react-native';

export const openNavigation = (lat, lng) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.openURL(url);
};

export const getDistance = (lat1, lng1, lat2, lng2) => {
  // Implementasi perhitungan jarak Haversine
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Jarak dalam km
};