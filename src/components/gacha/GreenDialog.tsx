import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface GreenDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
  nested?: boolean;
  closeDisabled?: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusFallbackRef?: React.RefObject<HTMLElement | null>;
  titleFocusRef?: React.RefObject<HTMLHeadingElement | null>;
}

/** Controlled dialogs share focus trapping, Escape and a safe initial focus. */
export function GreenDialog({ open, onClose, title, description, children, wide, nested, closeDisabled = false, returnFocusRef, returnFocusFallbackRef, titleFocusRef }: GreenDialogProps) {
  const internalTitleRef = useRef<HTMLHeadingElement>(null);
  const titleRef = titleFocusRef ?? internalTitleRef;
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !closeDisabled) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={`gacha-dialog-overlay${nested ? ' gacha-dialog-overlay-nested' : ''}`} />
        <Dialog.Content
          className={`gacha-dialog${wide ? ' gacha-dialog-wide' : ''}${nested ? ' gacha-dialog-nested' : ''}`}
          onOpenAutoFocus={(event) => { event.preventDefault(); titleRef.current?.focus(); }}
          onCloseAutoFocus={(event) => {
            const canFocus = (element: HTMLElement | null | undefined) => element?.isConnected && !element.matches(':disabled, [aria-disabled="true"]');
            const target = canFocus(returnFocusRef?.current) ? returnFocusRef?.current : returnFocusFallbackRef?.current;
            if (canFocus(target)) { event.preventDefault(); target?.focus(); }
          }}
          onEscapeKeyDown={(event) => { if (closeDisabled) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (closeDisabled) event.preventDefault(); }}
          onInteractOutside={(event) => { if (closeDisabled) event.preventDefault(); }}
        >
          <header className="gacha-dialog-header">
            <div>
              <Dialog.Title ref={titleRef} tabIndex={-1}>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="gacha-icon-button" disabled={closeDisabled} aria-label={`關閉${title}`}>
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
