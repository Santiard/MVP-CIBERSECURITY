import React from 'react';
import '../styles/theme.css';

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
};

const FilterInput: React.FC<Props> = ({ value='', onChange, placeholder='Filtrar por organización' }) => {
  return (
    <input
      aria-label="filter-input"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid var(--gray-200)',
        background: 'var(--surface-light)',
        boxShadow: 'var(--shadow-sm)',
        width: 320,
        maxWidth: '100%'
      }}
    />
  );
};

export default FilterInput;
