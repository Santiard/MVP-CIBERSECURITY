import React from 'react';

type Props = {
  value: number; // 0-100
  label?: string;
  size?: 'sm' | 'md';
};

const ProgressBar: React.FC<Props> = ({ value, label, size = 'md' }) => {
  const height = size === 'sm' ? 8 : 12;
  return (
    <div style={{display:'flex', alignItems:'center', gap:12}}>
      <div style={{flex:1}}>
        <div style={{height, background: 'rgba(0,0,0,0.06)', borderRadius:9999, overflow:'hidden'}} className="progress-track">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(value)}
            style={{height, width:`${Math.max(0, Math.min(100, value))}%`, background:'var(--btn-primary-bg)'}}
          />
        </div>
      </div>
      {label && <div style={{minWidth:48, textAlign:'right', color:'var(--muted)'}}>{label}</div>}
    </div>
  );
};

export default ProgressBar;
