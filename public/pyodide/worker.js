importScripts("/sync-message.js");
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

if (!crossOriginIsolated) {
  // throw new Error("SharedArrayBuffer is not available in this context!");
  console.warn("SharedArrayBuffer is not available in this context!");
}

const syncMessage = self.syncMessage;
const { readMessage, uuidv4 } = syncMessage;

const decoder = new TextDecoder("utf-8");
let ready = false;
let channel = null;
async function setup() {
  console.log(">>>>>>>> Setting up pyodide worker");
  self.pyodide = await loadPyodide({
    stdin: () => {
      const id = uuidv4();
      self.postMessage({ cmd: "stdin:read", id });
      const message = readMessage(channel, id);
      self.postMessage({ cmd: "stdin:read_fin", id });
      return message;
    },
  });
  self.pyodide.setStdout({
    write(buf) {
      const written_string = decoder.decode(buf);
      self.postMessage({ cmd: "stdout", data: written_string });
      return buf.length;
    },
  });
  self.pyodide.setStderr({
    write(buf) {
      const written_string = decoder.decode(buf);
      self.postMessage({ cmd: "stderr", data: written_string });
      return buf.length;
    },
  });
  ready = true;
  self.postMessage({ cmd: "ready" });
  console.log("<<<<<<<< Pyodide worker is ready");
}
const setupPromise = setup();
self.addEventListener("message", async (msg) => {
  if (msg.data.cmd === "channel") {
    channel = msg.data.channel;
    return;
  }
  if (!ready) {
    await setupPromise;
  }
  if (msg.data.cmd === "setInterruptBuffer") {
    console.log("SET INTERRUPT BUFFER", msg.data.interruptBuffer);
    self.pyodide.setInterruptBuffer(msg.data.interruptBuffer);
    return;
  }
  if (msg.data.cmd === "run") {
    const context = msg.data.context;
    if (context) {
      for (const key of Object.keys(context)) {
        self[key] = context[key];
      }
    }
    const python = msg.data.code;
    const id = msg.data.id;
    await self.pyodide.loadPackagesFromImports(python);
    console.log("EXEC", python);
    self.pyodide
      .runPythonAsync(python)
      .then((results) => {
        self.postMessage({ cmd: "done", results, id });
      })
      .catch((err) => {
        console.error(err);
        self.postMessage({
          cmd: "stderr",
          data: err.message.toString().replace("\t", " "),
        });
        self.postMessage({ cmd: "done", results: undefined, error: true, id });
      });
  }
});
