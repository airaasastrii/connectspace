// Menampilkan koordinat yang disimpan sebagai tautan ke Google Maps.
export default function LocationLink({ latitude, longitude, locationName }) {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) return null;

  const coordinates = `${Number(latitude)},${Number(longitude)}`;
  return (
    <span className="location-display">
      <a
        className="location-link"
        href={`https://www.google.com/maps?q=${encodeURIComponent(coordinates)}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Buka ${locationName || 'lokasi'} di Google Maps`}
      >
        <i className="bi bi-geo-alt" aria-hidden="true"></i>
        {locationName || `Lokasi · ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`}
      </a>
      <span className="location-attribution">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
      </span>
    </span>
  );
}
