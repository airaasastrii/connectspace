import { useEffect, useMemo, useState } from 'react';

const MAX = 2 * 1024 * 1024;

// value = { file, url }; pengguna memilih upload file ATAU URL gambar
export default function ImageInput({ value, onChange, label = 'Gambar (opsional)', current }) {
  const [mode, setMode] = useState('file');
  const [error, setError] = useState('');
  const preview = useMemo(
    () => (mode === 'file' ? (value.file ? URL.createObjectURL(value.file) : null) : value.url || null),
    [mode, value.file, value.url]
  );
  useEffect(() => () => mode === 'file' && preview && URL.revokeObjectURL(preview), [preview, mode]);

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
        <div className="seg">
          <button type="button" className={mode === 'file' ? 'on' : ''} onClick={() => { setMode('file'); onChange({ file: null, url: '' }); }}>Unggah</button>
          <button type="button" className={mode === 'url' ? 'on' : ''} onClick={() => { setMode('url'); onChange({ file: null, url: '' }); }}>URL</button>
        </div>
      </div>
      {mode === 'file' ? (
        <input key={value.file ? 'f' : 'n'} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={pickFile} />
      ) : (
        <input type="url" placeholder="https://contoh.com/gambar.jpg" value={value.url} onChange={(e) => onChange({ file: null, url: e.target.value })} />
      )}
      {error && <p className="field-error">{error}</p>}
      {(preview || current) && <img className="preview" src={preview || current} alt="Pratinjau" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = '')} />}
    </div>
  );
}

export const emptyImage = { file: null, url: '' };
