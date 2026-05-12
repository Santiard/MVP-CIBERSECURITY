import React from 'react';

/** SVG ojo abierto */
const EyeOpen: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx={12} cy={12} r={3} />
  </svg>
);

/** SVG ojo cerrado (tachado) */
const EyeClosed: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1={1} y1={1} x2={23} y2={23} />
  </svg>
);

type Props = {
  visible: boolean;
  onToggle: () => void;
};

/** Botón que alterna visibilidad de la contraseña con icono de ojo */
const PasswordToggle: React.FC<Props> = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    style={{
      position: 'absolute',
      top: '50%',
      right: 12,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--muted)',
      display: 'flex',
      alignItems: 'center',
      padding: 4,
      borderRadius: 4,
      transition: 'color 0.15s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gray-700)')}
    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
  >
    {visible ? <EyeClosed /> : <EyeOpen />}
  </button>
);

export default PasswordToggle;
