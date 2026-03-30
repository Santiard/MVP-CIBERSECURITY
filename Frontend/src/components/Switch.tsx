import React from 'react';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

const Switch: React.FC<Props> = ({ checked, onChange, disabled, ariaLabel }) => {
  const handleKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKey}
      className={checked ? 'toggle-switch on' : 'toggle-switch'}
    >
      <span className="thumb" />
    </button>
  );
};

export default Switch;
