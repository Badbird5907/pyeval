import { OutputData } from "@/types/output";
import { Terminal } from "@xterm/xterm";

declare global {
  interface Window {
    setup: boolean;
    runPython: (script: string, context: any) => Promise<unknown>;
    interruptBuffer: Uint8Array;
    term: Terminal;
  }
}
export {};