/**
 * Stand-in for "msw/browser" during server rendering, where MSW's browser build does not exist.
 * The mock API only ever starts in the browser (MockApiGate), so this is never called.
 */
export function setupWorker(): never {
  throw new Error("The mock API runs only in the browser.");
}
