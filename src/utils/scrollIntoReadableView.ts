/** Минимальная прокрутка поля ввода — только когда клавиатура открыта и поле перекрыто. */

const TOP_INSET_PX = 12;
const BOTTOM_GAP_PX = 12;
const FIELD_PADDING_PX = 10;
const KEYBOARD_OPEN_HEIGHT_RATIO = 0.72;
const KEYBOARD_SETTLE_MS = 300;

export function isVisualKeyboardOpen(): boolean {
  const vv = window.visualViewport;
  if (!vv) {
    return false;
  }
  return vv.height < window.innerHeight * KEYBOARD_OPEN_HEIGHT_RATIO;
}

export function getDocumentMaxScrollY(): number {
  const doc = document.documentElement;
  const vv = window.visualViewport;
  if (!vv) {
    return Math.max(0, doc.scrollHeight - window.innerHeight);
  }
  return Math.max(0, doc.scrollHeight - vv.height - vv.offsetTop);
}

function getVisibleScrollBounds(): { top: number; bottom: number } | null {
  const vv = window.visualViewport;
  if (!vv) {
    return null;
  }

  const nav = document.querySelector<HTMLElement>(".app-bottom-nav");
  const navTop = nav?.getBoundingClientRect().top ?? vv.offsetTop + vv.height;

  const top = vv.offsetTop + TOP_INSET_PX;
  const bottom = Math.min(vv.offsetTop + vv.height, navTop) - BOTTOM_GAP_PX;

  if (bottom - top < 64) {
    return null;
  }

  return { top, bottom };
}

function clampScrollDelta(scrollDelta: number): number {
  const maxScroll = getDocumentMaxScrollY();
  const targetScroll = window.scrollY + scrollDelta;
  if (targetScroll > maxScroll) {
    scrollDelta = maxScroll - window.scrollY;
  }
  if (targetScroll < 0) {
    scrollDelta = -window.scrollY;
  }
  return scrollDelta;
}

/** Прокрутить ровно настолько, чтобы поле целиком поместилось в видимую зону. */
export function scrollFieldIntoReadableView(field: HTMLElement): void {
  if (!field.classList.contains("vs-text-input")) {
    return;
  }
  if (!isVisualKeyboardOpen()) {
    return;
  }

  const bounds = getVisibleScrollBounds();
  if (!bounds) {
    return;
  }

  const { top: visibleTop, bottom: visibleBottom } = bounds;
  const rect = field.getBoundingClientRect();

  let scrollDelta = 0;

  if (rect.bottom > visibleBottom - FIELD_PADDING_PX) {
    scrollDelta = rect.bottom - (visibleBottom - FIELD_PADDING_PX);
  } else if (rect.top < visibleTop + FIELD_PADDING_PX) {
    scrollDelta = rect.top - (visibleTop + FIELD_PADDING_PX);
  }

  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  scrollDelta = clampScrollDelta(scrollDelta);
  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  window.scrollBy({ top: scrollDelta, behavior: "auto" });
}

const pendingScrollTimers = new WeakMap<HTMLElement, number[]>();

export function scheduleScrollFieldIntoReadableView(field: HTMLElement): void {
  if (!field.classList.contains("vs-text-input")) {
    return;
  }

  const prev = pendingScrollTimers.get(field);
  if (prev) {
    prev.forEach((id) => window.clearTimeout(id));
  }

  const run = () => scrollFieldIntoReadableView(field);
  const timers = [KEYBOARD_SETTLE_MS, KEYBOARD_SETTLE_MS + 180].map((ms) => window.setTimeout(run, ms));
  pendingScrollTimers.set(field, timers);
}

export function cancelScheduledScrollField(field: HTMLElement): void {
  const prev = pendingScrollTimers.get(field);
  if (prev) {
    prev.forEach((id) => window.clearTimeout(id));
    pendingScrollTimers.delete(field);
  }
}
