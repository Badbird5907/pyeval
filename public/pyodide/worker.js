importScripts("/sync-message.js");
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

if (!crossOriginIsolated) {
    // throw new Error("SharedArrayBuffer is not available in this context!");
    console.warn("SharedArrayBuffer is not available in this context!");
}

const syncMessage = self.syncMessage;
const { readMessage, uuidv4 } = syncMessage;
console.log("WORKER STARTED");
console.log({ readMessage })

let ready = false;
let channel = null;
async function setup() {
    self.pyodide = await loadPyodide({
        stdout: (msg) => {
            self.postMessage({ cmd: "stdout", data: msg });
        },
        stderr: (msg) => {
            self.postMessage({ cmd: "stderr", data: msg });
        },
        stdin: () => {
            console.log("STDIN READ");
            const id = uuidv4();
            self.postMessage({ cmd: "stdin:read", id });
            const message = readMessage(channel, id);
            return message;
        }
    });
    ready = true;
}
let pyodideReadyPromise = setup();

self.addEventListener("message", async (msg) => {
    if (!ready) {
        await pyodideReadyPromise.then(() => {
            self.postMessage({ cmd: "ready" });
        });
    }
    if (msg.data.cmd === "channel") {
        channel = msg.data.channel;
        return;
    }
    if (msg.data.cmd === "setInterruptBuffer") {
        self.pyodide.setInterruptBuffer(msg.data.interruptBuffer);
        return;
    }
    if (msg.data.cmd === "stdin:write") {
        console.log("STDIN WRITE", msg.data.data);
        inputStr = msg.data.data;
        Atomics.store(int32View, 0, 1); // Set the value in int32View to 1
        Atomics.notify(int32View, 0, 1); // Notify the waiting thread
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
        console.log("EXEC",python);
        self.pyodide.runPythonAsync(python)
            .then(results => {
                self.postMessage({ cmd: "done", results, id });
            })
            .catch(err => {
                console.error(err);
                self.postMessage({ cmd: "stderr", data: err.message.toString().replace("\t", " ") });
                self.postMessage({ cmd: "done", results: undefined, error: true, id });
            });
    }
});