import React from 'react';
import '../styles/theme.css';

type Props = { status: string };

const mapStatus = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('final')) return { bg: 'var(--success)', color: '#042913' };
  if (s.includes('progr')) return { bg: 'var(--warning)', color: '#3B2B00' };
  if (s.includes('cancel') || s.includes('fail')) return { bg: 'var(--danger)', color: '#3A0B0B' };
  return { bg: 'var(--info)', color: '#001A1F' };
};

const Badge: React.FC<Props> = ({ status }) => {
  const style = mapStatus(status);
  return (
    <span style={{
      display:'inline-block',
      padding:'6px 10px',
      borderRadius:999,
      fontSize:12,
      fontWeight:700,
      background: style.bg,
      color: style.color,
      boxShadow: '0 4px 12px rgba(2,6,23,0.08)'
    }}>{status}</span>
  );
};

export default Badge;
