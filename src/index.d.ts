declare global {
  interface Window {
    setup: boolean;
    setupPyodide: () => Promise<void>;
  }
}
export {};