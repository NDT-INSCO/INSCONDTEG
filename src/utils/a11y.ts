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
import { useEffect } from 'react';
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
