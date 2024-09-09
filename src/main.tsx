import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { StyledEngineProvider } from "@mui/material";
import { makeChannel } from 'sync-message';

export const channel = makeChannel();

window.addEventListener("stdout", (data: Event) => {
  console.log((data as CustomEvent).detail);
});
window.interruptBuffer = new Uint8Array(new ArrayBuffer(1));
let pyodideWorker = new Worker("pyodide/worker.js");
pyodideWorker.postMessage({
  cmd: "setInterruptBuffer",
  interruptBuffer: window.interruptBuffer,
});
pyodideWorker.postMessage({ cmd: "channel", channel });

const callbacks: { [key: number]: (result: any) => void } = {};

function interruptExecution() {
  // 2 stands for SIGINT.
  window.interruptBuffer[0] = 2;
}

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
  window.interruptBuffer[0] = 0;
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
