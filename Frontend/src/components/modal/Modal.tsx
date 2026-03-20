import React from 'react';
import '../../styles/theme.css';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
};

const Modal: React.FC<Props> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ width: 720, maxWidth: '95%', background: 'var(--surface)', color: 'var(--text-primary)', borderRadius: 12, boxShadow: 'var(--shadow-md)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button aria-label="Cerrar" onClick={onClose} className="btn">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
