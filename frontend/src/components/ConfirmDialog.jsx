import { Modal } from './Modal.jsx';

export function ConfirmDialog({ open, title = 'Confirm action', message, confirmLabel = 'Confirm', onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
