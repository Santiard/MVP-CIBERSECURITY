import React from 'react';
import Modal from './Modal';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmModal: React.FC<Props> = ({
  open,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div>
        <p style={{ marginTop: 0 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

