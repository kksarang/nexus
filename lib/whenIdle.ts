// Runs background work once the page has painted, so it never delays what the visitor sees first.
export function whenIdle(work: () => void) {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(work, { timeout: 2000 });
  else window.setTimeout(work, 1200);
}
