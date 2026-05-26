/** Прокрутка поля ввода в зону над клавиатурой, MainButton и нижним меню. */

const SCROLL_END_GAP_PX = 12;

const TOP_INSET_PX = 16;
const BOTTOM_GAP_PX = 10;
/** Доля видимой высоты от верха — поле оказывается в верхней трети, виден ввод. */
const FIELD_TOP_RATIO = 0.2;

function getReadableViewportBounds(): { top: number; bottom: number } | null {
  const vv = window.visualViewport;
  if (!vv) {
    return null;
  }

  const nav = document.querySelector<HTMLElement>(".app-bottom-nav");
  const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;

  const top = vv.offsetTop + TOP_INSET_PX;
  const bottom = Math.min(vv.offsetTop + vv.height, navTop) - BOTTOM_GAP_PX;

  if (bottom - top < 72) {
    return null;
  }

  return { top, bottom };
}

/** Максимальный scrollY: низ маркера .app-page-scroll-end не уходит под нижнее меню. */
export function getMaxAllowedScrollY(): number {
  const end = document.querySelector<HTMLElement>(".app-page-scroll-end");
  const nav = document.querySelector<HTMLElement>(".app-bottom-nav");
  if (!end || !nav) {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollHeight - window.innerHeight);
  }

  const endRect = end.getBoundingClientRect();
  const navTop = nav.getBoundingClientRect().top;
  const endDocBottom = endRect.bottom + window.scrollY;
  return Math.max(0, endDocBottom - navTop + SCROLL_END_GAP_PX);
}

export function clampDocumentScroll(behavior: ScrollBehavior = "auto"): void {
  const max = getMaxAllowedScrollY();
  if (window.scrollY > max + 0.5) {
    window.scrollTo({ top: max, behavior });
  }
}

export function scrollFieldIntoReadableView(field: HTMLElement): void {
  const bounds = getReadableViewportBounds();
  if (!bounds) {
    field.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    return;
  }

  const { top: readableTop, bottom: readableBottom } = bounds;
  const readableHeight = readableBottom - readableTop;
  const targetTop = readableTop + readableHeight * FIELD_TOP_RATIO;
  const targetBottom = readableTop + readableHeight * 0.78;

  const rect = field.getBoundingClientRect();
  let scrollDelta = 0;

  if (rect.bottom > targetBottom) {
    scrollDelta = rect.bottom - targetBottom;
  } else if (rect.top < targetTop) {
    scrollDelta = rect.top - targetTop;
  }

  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  const maxScroll = getMaxAllowedScrollY();
  const targetScroll = window.scrollY + scrollDelta;
  if (targetScroll > maxScroll) {
    scrollDelta = maxScroll - window.scrollY;
  }
  if (targetScroll < 0) {
    scrollDelta = -window.scrollY;
  }
  if (Math.abs(scrollDelta) < 4) {
    return;
  }

  window.scrollBy({ top: scrollDelta, behavior: "smooth" });
  window.setTimeout(() => clampDocumentScroll("auto"), 450);
}

const pendingScrollTimers = new WeakMap<HTMLElement, number[]>();

export function scheduleScrollFieldIntoReadableView(field: HTMLElement): void {
  const prev = pendingScrollTimers.get(field);
  if (prev) {
    prev.forEach((id) => window.clearTimeout(id));
  }

  const run = () => scrollFieldIntoReadableView(field);
  run();
  requestAnimationFrame(run);

  const ids = [80, 200, 420, 700].map((ms) => window.setTimeout(run, ms));
  pendingScrollTimers.set(field, ids);
}

export function cancelScheduledScrollField(field: HTMLElement): void {
  const prev = pendingScrollTimers.get(field);
  if (prev) {
    prev.forEach((id) => window.clearTimeout(id));
    pendingScrollTimers.delete(field);
  }
}
