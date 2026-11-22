/**
 * Keyboard semantics for surfaces that are visually clickable.
 *
 * Cards, table rows and ribbons were plain `<div onClick>` throughout the app:
 * a mouse could open them, a keyboard or screen reader could not. Where the
 * element can become a real `<button>` it should; where layout forbids it
 * (absolutely-positioned ribbon, table row, timeline node) these helpers add the
 * minimum contract: focusable, announced as a control, activated by Enter and
 * Space, and visible focus via `focus-visible` classes in the component.
 */
import { useEffect, useLayoutEffect } from 'react';
import type React from 'react';

type ActivationEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
export type ActivateHandler<E extends ActivationEvent = ActivationEvent> = (event: E) => void;

function isActivationKey(event: React.KeyboardEvent<HTMLElement>): boolean {
  return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
}

export interface ClickableProps {
  role: 'button';
  tabIndex: 0;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  'aria-label'?: string;
}

/** Props that turn a non-button element into an accessible control. */
export function clickable<E extends ActivationEvent>(
  handler: ActivateHandler<E>,
  label?: string,
): ClickableProps {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: event => handler(event as E),
    onKeyDown: event => {
      if (!isActivationKey(event)) return;
      event.preventDefault(); // Space must not scroll the page
      handler(event as E);
    },
    ...(label ? { 'aria-label': label } : {}),
  };
}

export interface ClickableRowProps {
  tabIndex: 0;
  onClick: (event: React.MouseEvent<HTMLTableRowElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => void;
  'aria-selected'?: boolean;
}

/**
 * Selectable table rows keep their row role (announcing them as buttons would
 * break the table), but become reachable and activatable from the keyboard.
 */
export function clickableRow<E extends React.MouseEvent<HTMLTableRowElement> | React.KeyboardEvent<HTMLTableRowElement>>(
  handler: ActivateHandler<E>,
  selected?: boolean,
): ClickableRowProps {
  return {
    tabIndex: 0,
    onClick: event => handler(event as E),
    onKeyDown: event => {
      if (!isActivationKey(event)) return;
      event.preventDefault();
      handler(event as E);
    },
    ...(typeof selected === 'boolean' ? { 'aria-selected': selected } : {}),
  };
}

/** Dismiss a dialog with Escape. Call inside a component that owns the state. */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}

/** Focus the dialog, keep sequential keyboard navigation inside it, and restore its opener. */
export function useModalFocus(active: boolean, ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!active || !dialog) return;
    const opener = document.activeElement;
    const native = dialog.tagName === 'DIALOG' ? dialog as HTMLDialogElement : null;
    if (native && !native.open) {
      if (typeof native.showModal === 'function') native.showModal();
      else native.setAttribute('open', '');
    }
    const tabbables = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]',
    )).filter(element => {
      if (element.matches(':disabled') || element.tabIndex < 0 || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
      // Only the summary of a closed disclosure is in the tab order.
      const closedDetails = element.closest('details:not([open])');
      if (closedDetails && !(element.tagName === 'SUMMARY' && element.parentElement === closedDetails)) return false;
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return style?.visibility !== 'hidden' && style?.display !== 'none' &&
        (element.checkVisibility?.({ visibilityProperty: true }) ?? true);
    });
    const initial = dialog.querySelector<HTMLElement>('[data-modal-initial-focus]') ?? tabbables()[0] ?? dialog;
    initial.focus();
    const containTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const candidates = tabbables();
      const first = candidates[0];
      const last = candidates.at(-1);
      const focus = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (!focus || !candidates.includes(focus as HTMLElement) || (event.shiftKey ? focus === first : focus === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', containTab);
    return () => {
      document.removeEventListener('keydown', containTab);
      if (native?.open) {
        if (typeof native.close === 'function') native.close();
        else native.removeAttribute('open');
      }
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [active, ref]);
}
