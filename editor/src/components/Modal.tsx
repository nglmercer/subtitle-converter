import type { JSX } from 'preact';
import './Modal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element | JSX.Element[] | null | false | undefined;
}

export function Modal({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null;

  return (
    <div class="modal-backdrop" onClick={onClose}>
      <div class="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h3 class="modal-title">{title}</h3>
          <button class="modal-close" onClick={onClose}>✕</button>
        </div>
        <div class="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
