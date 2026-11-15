// Mengambil koordinat lokasi terbaru setelah aksi pengguna memicu permintaan.
export const getCurrentLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Browser ini tidak mendukung akses lokasi.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini lalu coba lagi.'
        : error.code === error.POSITION_UNAVAILABLE
          ? 'Lokasi saat ini tidak tersedia. Coba lagi.'
          : 'Waktu pengambilan lokasi habis. Coba lagi.';
      reject(new Error(message));
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
});
