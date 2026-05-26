/** Прокрутка поля ввода в зону над клавиатурой, MainButton и нижним меню. */

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

  window.scrollBy({ top: scrollDelta, behavior: "smooth" });
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
