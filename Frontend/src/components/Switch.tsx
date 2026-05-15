import React, { useState } from 'react';
import ConfirmModal from './modal/ConfirmModal';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  confirmOnDisable?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmText?: string;
};

const Switch: React.FC<Props> = ({ checked, onChange, disabled, ariaLabel, confirmOnDisable = false, confirmTitle, confirmMessage, confirmText }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerChange(!checked);
    }
  };

  const triggerChange = (next: boolean) => {
    if (disabled) return;
    if (confirmOnDisable && checked && next === false) {
      setConfirmOpen(true);
      return;
    }
    onChange(next);
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      onChange(false);
      setConfirmOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && triggerChange(!checked)}
        onKeyDown={handleKey}
        className={checked ? 'toggle-switch on' : 'toggle-switch'}
      >
        <span className="thumb" />
      </button>
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle || 'Confirmar'}
        message={confirmMessage || '¿Confirmas esta acción?'}
        confirmText={confirmText || 'Confirmar'}
        loading={confirmLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default Switch;
