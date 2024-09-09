import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { StyledEngineProvider } from "@mui/material";
import { makeChannel, writeMessage } from 'sync-message';

export const channel = makeChannel();

window.readingStdin = null;
window.addEventListener("stdin:read_fin", (data: Event) => {
  console.log("finished reading stdin");
  window.readingStdin = null;
});
window.addEventListener("stdin:read", (data: Event) => {
  console.log("reading stdin");
  const id = (data as CustomEvent).detail.id;
  window.readingStdin = id;
});

const pyodideWorker = new Worker("pyodide/worker.js");
const interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
pyodideWorker.postMessage({
  cmd: "setInterruptBuffer",
  interruptBuffer: interruptBuffer,
});
pyodideWorker.postMessage({ cmd: "channel", channel });
export const interruptExecution = () => {
  console.log("Interrupting execution");
  // 2 stands for SIGINT.
  interruptBuffer[0] = 2;
  if (window.readingStdin && channel) {
    writeMessage(channel, "\x03", window.readingStdin); 
  }
  pyodideWorker.postMessage({ cmd: "interrupt" });
}

const callbacks: { [key: number]: (result: any) => void } = {};

pyodideWorker.onmessage = (event) => {
  if (!event.data.cmd) {
    console.log("E", {event})
  }
  const { cmd } = event.data;
  if (cmd === "ready") {
    window.dispatchEvent(new Event("pyodideLoad"));
    window.setup = true;
  } else {
    console.log(cmd + ":", event.data);
    const e = new CustomEvent(cmd, { detail: event.data });
    window.dispatchEvent(e);
    if (cmd === "done") {
      const onSuccess = callbacks[event.data.id];
      if (onSuccess) {
        onSuccess(event.data.result);
        delete callbacks[event.data.id];
      }
    }
  }
};

const runPython = (() => {
  let id = 0;
  // Clear interruptBuffer in case it was accidentally left set after previous code completed.
  interruptBuffer[0] = 0;
  return (script: string, context: any) => {
    id = (id + 1) % Number.MAX_SAFE_INTEGER;
    return new Promise((onSuccess) => {
      callbacks[id] = onSuccess;
      pyodideWorker.postMessage({
        ...context,
        cmd: "run",
        code: script,
        id,
      });
    });
  };
})();
window.runPython = runPython;


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
  </React.StrictMode>,
)
