const endpoint = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/reverse';
const cache = new Map();
const pending = new Map();
const cacheLimit = 5000;
const cacheLifetime = 24 * 60 * 60 * 1000;
let nextRequestAt = 0;
let requestQueue = Promise.resolve();

// Menjalankan permintaan Nominatim berurutan dengan jarak minimal satu detik.
const enqueueLookup = (latitude, longitude) => {
  const lookup = requestQueue.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    nextRequestAt = Date.now() + 1000;

    const url = new URL(endpoint);
    url.search = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      zoom: '12',
      lat: String(latitude),
      lon: String(longitude),
    });

    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'ConnectSpace/1.0',
          'Accept-Language': 'id,en',
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw Object.assign(new Error('Layanan pencarian nama lokasi sedang tidak tersedia. Coba lagi.'), { status: 503 });
    }

    if (!response.ok) {
      throw Object.assign(new Error('Layanan pencarian nama lokasi sedang tidak tersedia. Coba lagi.'), { status: 503 });
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw Object.assign(new Error('Layanan pencarian nama lokasi mengembalikan data yang tidak valid.'), { status: 503 });
    }

    const address = result.address;
    if (!address) {
      throw Object.assign(new Error('Nama wilayah untuk lokasi ini tidak ditemukan.'), { status: 503 });
    }

    const city = address.city_district || address.city || address.town || address.municipality || address.village || address.county;
    if (!city) {
      throw Object.assign(new Error('Nama wilayah untuk lokasi ini tidak ditemukan.'), { status: 503 });
    }

    return city.slice(0, 255);
  });

  requestQueue = lookup.then(() => undefined, () => undefined);
  return lookup;
};

// Mengubah koordinat menjadi nama wilayah dan menggunakan cache untuk lokasi berulang.
export const reverseGeocode = async (latitude, longitude) => {
  const key = `${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.name;
  if (cached) cache.delete(key);
  if (pending.has(key)) return pending.get(key);

  const lookup = enqueueLookup(latitude, longitude)
    .then((name) => {
      if (cache.size >= cacheLimit) cache.delete(cache.keys().next().value);
      cache.set(key, { name, expiresAt: Date.now() + cacheLifetime });
      return name;
    })
    .finally(() => pending.delete(key));

  pending.set(key, lookup);
  return lookup;
};
