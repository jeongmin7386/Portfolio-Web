export function scrollEditorPanelToElement(selector: string) {
  window.requestAnimationFrame(() => {
    const element = document.querySelector<HTMLElement>(selector);
    const panel = element?.closest<HTMLElement>("[data-editor-settings-panel]");
    if (!element || !panel || !/auto|scroll/.test(getComputedStyle(panel).overflowY)) return;

    const target = element.getBoundingClientRect();
    const container = panel.getBoundingClientRect();
    const top = container.top + panel.clientTop;
    const bottom = top + panel.clientHeight;
    // Move only the inspector's scroll container, never the document or canvas.
    const delta = target.top < top || target.height > panel.clientHeight
      ? target.top - top
      : target.bottom > bottom ? target.bottom - bottom : 0;
    if (delta) panel.scrollBy({ top: delta, behavior: "smooth" });
  });
}
