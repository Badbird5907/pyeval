import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import React from "react";

import { ResizablePanel } from "@/components/ui/resizable";
import { channel } from "@/main";
import { writeMessage } from "sync-message";

import "@xterm/xterm/css/xterm.css";
import "@/components/xterm-console/index.css";

const XTermConsole = () => {
  const termRef = React.useRef<HTMLDivElement>(null);
  const term = React.useRef<Terminal>(
    new Terminal({
      convertEol: true,
      theme: {
        foreground: "#F8F8F8",
        selectionBackground: "#5DA5D533",
        selectionInactiveBackground: "#555555AA",
        black: "#1E1E1D",
        brightBlack: "#262625",
        red: "#CE5C5C",
        brightRed: "#FF7272",
        green: "#5BCC5B",
        brightGreen: "#72FF72",
        yellow: "#CCCC5B",
        brightYellow: "#FFFF72",
        blue: "#5D5DD3",
        brightBlue: "#7279FF",
        magenta: "#BC5ED1",
        brightMagenta: "#E572FF",
        cyan: "#5DA5D5",
        brightCyan: "#72F0FF",
        white: "#F8F8F8",
        brightWhite: "#FFFFFF",
      },
    }),
  );
  const fitAddon = React.useRef<FitAddon>(new FitAddon());

  const [stdinBuffer, setStdinBuffer] = React.useState<string[]>([]);
  const [currentStdin, setCurrentStdin] = React.useState<string>("");
  const [queuedReads, setQueuedReads] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (termRef.current) {
      const terminal = term.current;
      terminal.loadAddon(fitAddon.current);
      terminal.loadAddon(new WebLinksAddon());
      terminal.open(termRef.current);
      fitAddon.current.fit();

      window.term = terminal;
    }
  }, [termRef]);

  React.useEffect(() => {
    const terminal = term.current;
    if (!terminal) {
      return;
    }
    const listener = terminal.onData((e) => {
      if (e === "\r") {
        console.log("ENTER");
        terminal.write("\r\n");
        console.log("Current queue", queuedReads);
        console.log("Current buffer", stdinBuffer);
        if (queuedReads.length > 0 && channel) {
          console.log("Writing pending stdin read");
          const id = queuedReads.shift()!;
          writeMessage(channel, currentStdin, id);
          setCurrentStdin("");
          return;
        }
        console.log("Writing to buffer");
        setStdinBuffer([...stdinBuffer, currentStdin]);
        setCurrentStdin("");
      } else if (e === "\x7f") {
        terminal.write("\b \b");
        setCurrentStdin(currentStdin.slice(0, -1));
      } else if (e === "\x03") {
        // delete char to the right
        terminal.write("\x1b[P");
        setCurrentStdin(currentStdin.slice(0, -1));
      } else {
        // console.log("Adding to stdin", e.key);
        // terminal.write(e.key);
        terminal.write("\x1b[2m" + e + "\x1b[0m");
        setCurrentStdin(currentStdin + e);
      }
    });
    return () => {
      listener.dispose();
    };
  }, [term, queuedReads, stdinBuffer, currentStdin]);

  const handleStd = (e: Event) => {
    const data = (e as CustomEvent).detail;
    const str = data.data.replace("\t", "  ");
    console.log(">>>> Printing", str);
    if ((e as CustomEvent).type === "stderr") {
      term.current.write("\x1b[31m" + str + "\x1b[0m");
    } else {
      term.current.write(str);
    }
  };
  const clear = () => {
    term.current.writeln("\x1b[2J\x1b[3J\x1b[H");
    setStdinBuffer([]);
    setCurrentStdin("");
    setQueuedReads([]);
  };

  const handleDone = (e: Event) => {
    const { results, error } = (e as CustomEvent).detail;
    term.current.writeln("");
    term.current.writeln(
      `\x1b[3${error ? "1" : "2"}mExecution completed${results ? " with return value: " + results : ""}\x1b[0m`,
    );
  };
  const handleResize = () => {
    fitAddon.current.fit();
  };

  const handleStdinRead = (event: Event) => {
    // const data = window.prompt("Enter input");
    // window.dispatchEvent(new CustomEvent("stdin:write", { detail: data }));
    if (!channel) {
      console.error("No channel available for stdin:read");
    } else {
      const id = (event as CustomEvent).detail.id;
      console.log("STDIN:READ", id);
      // const data = window.prompt("Enter input");
      const data = stdinBuffer.shift();
      if (data) {
        // if there is data pushed to the buffer, write it
        console.log("Writing stdin read", data);
        writeMessage(channel, data, id);
      } else {
        // queue the read
        console.log("Queueing stdin read", id);
        setQueuedReads([...queuedReads, id]);
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener("stdout", handleStd);
    window.addEventListener("stderr", handleStd);
    window.addEventListener("clear", clear);
    window.addEventListener("done", handleDone);
    window.addEventListener("resize", handleResize);
    window.addEventListener("stdin:read", handleStdinRead);
    return () => {
      window.removeEventListener("stdout", handleStd, true);
      window.removeEventListener("stderr", handleStd, true);
      window.removeEventListener("clear", clear, true);
      window.removeEventListener("done", handleDone, true);
      window.removeEventListener("resize", handleResize, true);
      window.removeEventListener("stdin:read", handleStdinRead, true);
    };
  }, []);

  return (
    <ResizablePanel
      defaultSize={30}
      onResize={() => {
        fitAddon.current.fit();
      }}
      className="h-full"
    >
      <div id="terminal" ref={termRef} className={"w-full h-full "}></div>
    </ResizablePanel>
  );
};
export default XTermConsole;
