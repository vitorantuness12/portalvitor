import { useEffect } from "react";

const CLOSE_BUTTON_SELECTORS = [
  // shadcn/ui toast close button
  "[toast-close]",

  // sonner close button variants (depends on version)
  "[data-sonner-toast] button[aria-label='Close toast']",
  "[data-sonner-toast] button[aria-label='Close']",
  "[data-sonner-toast] button[aria-label='Fechar']",
  "[data-sonner-toaster] button[aria-label='Close toast']",
  "[data-sonner-toaster] button[aria-label='Close']",
  "[data-sonner-toaster] button[aria-label='Fechar']",

  // common data attrs used by toast libraries
  "[data-close-button]",
  "[data-toast-close]",
].join(", ");

/**
 * Hard kill-switch to prevent any toast "X" close button from showing.
 * This is intentionally aggressive and only targets known toast close selectors.
 */
export function useHideToastCloseButtons() {
  useEffect(() => {
    const hide = () => {
      document.querySelectorAll(CLOSE_BUTTON_SELECTORS).forEach((el) => {
        const node = el as HTMLElement;
        node.style.display = "none";
        node.style.opacity = "0";
        node.style.visibility = "hidden";
        node.style.pointerEvents = "none";
      });
    };

    hide();

    const observer = new MutationObserver(() => hide());
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);
}
