import './sherpi.css';

export function SherpiAvatar({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? 'sherpi-avatar sherpi-avatar--large' : 'sherpi-avatar'} aria-hidden="true">
      <span className="sherpi-avatar-cap" />
      <span className="sherpi-avatar-face" />
      <span className="sherpi-avatar-scarf" />
    </span>
  );
}
