import { OutputData } from "@/types/output";

declare global {
  interface Window {
    setup: boolean;
    setupPyodide: () => Promise<void>;
    runPython: (code: string) => Promise<string>;
  }
}
export {};