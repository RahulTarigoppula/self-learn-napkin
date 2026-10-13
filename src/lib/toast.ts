/** Small, non-modal tickets at the bottom of the screen. Never blocks; role="status" for screen readers. */
export interface ToastOptions {
  action?: { label: string; run: () => void };
  danger?: boolean;
  ms?: number;
}

function region(): HTMLElement {
  let r = document.querySelector<HTMLElement>('.toast-region');
  if (!r) {
    r = document.createElement('div');
    r.className = 'toast-region';
    r.setAttribute('role', 'status');
    r.setAttribute('aria-live', 'polite');
    document.body.append(r);
  }
  return r;
}

export function toast(message: string, o: ToastOptions = {}): () => void {
  const el = document.createElement('div');
  el.className = `toast${o.danger ? ' toast--danger' : ''}`;
  const span = document.createElement('span');
  span.textContent = message;
  el.append(span);
  const close = () => el.remove();
  if (o.action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = o.action.label;
    b.addEventListener('click', () => {
      o.action?.run();
      close();
    });
    el.append(b);
  }
  region().append(el);
  if (o.ms !== 0) setTimeout(close, o.ms ?? 4200);
  return close;
}
