import { Terminal } from "@xterm/xterm";

declare global {
  interface Window {
    setup: boolean;
    term: Terminal;
    runPython: (script: string, context: unknwon) => Promise<unknown>;
    readingStdin: string | null;
  }
}
export {};
