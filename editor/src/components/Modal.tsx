import { createPortal } from 'preact/compat';
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

  const content = (
    <div class="modal-backdrop" onClick={onClose}>
      <div class="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h3 class="modal-title">{title}</h3>
          <button class="modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
