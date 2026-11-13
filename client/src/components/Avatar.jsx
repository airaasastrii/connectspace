export default function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  return user?.avatar ? (
    <img className="avatar" style={style} src={user.avatar} alt={user.name} />
  ) : (
    <span className="avatar avatar-fallback" style={style} aria-hidden="true">
      {(user?.name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

export const formatTime = (s) =>
  new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
