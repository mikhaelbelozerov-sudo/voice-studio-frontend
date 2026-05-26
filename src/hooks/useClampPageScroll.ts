import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { clampDocumentScroll } from "../utils/scrollIntoReadableView";

/** Не даём прокрутить ниже последнего блока контента (пустая зона под меню). */
export function useClampPageScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    const run = () => clampDocumentScroll();

    run();
    const afterPaint = window.requestAnimationFrame(run);
    const delayed = window.setTimeout(run, 120);

    window.addEventListener("scroll", run, { passive: true });
    window.visualViewport?.addEventListener("resize", run);
    window.addEventListener("resize", run);

    const end = document.querySelector(".app-page-scroll-end");
    const main = document.querySelector(".app-main");
    const observer = new ResizeObserver(run);
    if (end) {
      observer.observe(end);
    }
    if (main) {
      observer.observe(main);
    }

    return () => {
      window.cancelAnimationFrame(afterPaint);
      window.clearTimeout(delayed);
      window.removeEventListener("scroll", run);
      window.visualViewport?.removeEventListener("resize", run);
      window.removeEventListener("resize", run);
      observer.disconnect();
    };
  }, [pathname]);
}
