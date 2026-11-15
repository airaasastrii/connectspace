import { useEffect, useMemo, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MAX = 2 * 1024 * 1024;

// value = { file, url }; pengguna memilih upload file ATAU URL gambar
// Mengelola pemilihan gambar melalui unggahan berkas atau URL.
export default function ImageInput({ value, onChange, label = 'Gambar (opsional)', current }) {
  const [mode, setMode] = useState('file');
  const [error, setError] = useState('');
  // Menyiapkan URL pratinjau berdasarkan berkas atau URL gambar yang dipilih.
  const preview = useMemo(
    () => (mode === 'file' ? (value.file ? URL.createObjectURL(value.file) : null) : value.url || null),
    [mode, value.file, value.url]
  );
  // Mengelola pembersihan URL pratinjau ketika gambar atau mode input berubah.
  useEffect(
    // Menjalankan efek pembersihan ketika dependensi efek diperbarui.
    () => (
      // Melepas URL objek lokal setelah pratinjau tidak lagi digunakan.
      () => mode === 'file' && preview && URL.revokeObjectURL(preview)
    ),
    [preview, mode]
  );

  // Memvalidasi ukuran berkas gambar sebelum meneruskannya ke komponen pemanggil.
  const pickFile = (e) => {
    const f = e.target.files[0];
    setError('');
    if (f && f.size > MAX) {
      setError('Ukuran gambar maksimal 2 MB.');
      e.target.value = '';
      return;
    }
    onChange({ file: f || null, url: '' });
  };

  return (
    <div className="image-input">
      <div className="image-input-head">
        <span className="label">{label}</span>
        <div className="seg" style={{ marginBottom: '1rem' }}>
          {/* Callback ini memilih mode unggah berkas dan mengosongkan nilai lama. */}
          <button
            type="button"
            className={mode === 'file' ? 'on' : ''}
            onClick={() => { setMode('file'); onChange({ file: null, url: '' }); }}
            aria-label="Unggah gambar"
            title="Unggah gambar"
          >
            <i className="bi bi-upload" aria-hidden="true"></i>
          </button>
          {/* Callback ini memilih mode URL dan mengosongkan nilai lama. */}
          <button
            type="button"
            className={mode === 'url' ? 'on' : ''}
            onClick={() => { setMode('url'); onChange({ file: null, url: '' }); }}
            aria-label="Gunakan URL gambar"
            title="Gunakan URL gambar"
          >
            <i className="bi bi-link-45deg" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      {mode === 'file' ? (
        <input key={value.file ? 'f' : 'n'} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={pickFile} />
      ) : (
        <input
          type="url"
          placeholder="https://contoh.com/gambar.jpg"
          value={value.url}
          /* Meneruskan URL yang diketik dan menghapus pilihan berkas sebelumnya. */
          onChange={(e) => onChange({ file: null, url: e.target.value })}
        />
      )}
      {error && <p className="field-error">{error}</p>}
      {(preview || current) && (
        /* Callback onError menyembunyikan pratinjau yang gagal dimuat; onLoad menampilkannya kembali. */
        <img
          className="preview"
          src={preview || current}
          alt="Pratinjau"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          onLoad={(e) => (e.currentTarget.style.display = '')}
        />
      )}
    </div>
  );
}

export const emptyImage = { file: null, url: '' };
