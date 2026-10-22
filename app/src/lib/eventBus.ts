type Listener = (...args: any[]) => void;

const listeners: Record<string, Listener[]> = {};

export function on(event: string, callback: Listener): void {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}

export function off(event: string, callback: Listener): void {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter((cb) => cb !== callback);
}

export function emit(event: string, ...args: any[]): void {
  (listeners[event] ?? []).forEach((cb) => cb(...args));
}