import { useEffect, useRef, useState } from 'react';

// Menampilkan menu tindakan edit dan hapus dengan tombol meatballs.
export default function MeatballsMenu({ label, onEdit, onDelete, disabled = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Menutup menu ketika pengguna menekan Escape atau mengklik di luarnya.
  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className="meatballs-menu" ref={menuRef}>
      <button
        type="button"
        className="meatballs-trigger"
        aria-label={`Menu tindakan ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="meatballs-popover" role="menu" aria-label={`Tindakan ${label}`}>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(); }}>
            <i className="bi bi-pencil" aria-hidden="true"></i>
            Edit
          </button>
          <button type="button" role="menuitem" className="danger" onClick={() => { setOpen(false); onDelete(); }} disabled={disabled}>
            <i className="bi bi-trash" aria-hidden="true"></i>
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}
