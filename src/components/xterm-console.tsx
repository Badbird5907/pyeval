import { Button } from "@mui/material";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import React from "react";

import "@xterm/xterm/css/xterm.css";
import { ResizablePanel } from "@/components/resizable";
import { channel } from "@/main";
import { writeMessage } from "sync-message";

type XTermConsoleProps = {
}
const XTermConsole = ({ }: XTermConsoleProps) => {
  const termRef = React.useRef<HTMLDivElement>(null)
  const term = React.useRef<Terminal>(new Terminal({
    theme: {
      foreground: '#F8F8F8',
      selectionBackground: '#5DA5D533',
      selectionInactiveBackground: '#555555AA',
      black: '#1E1E1D',
      brightBlack: '#262625',
      red: '#CE5C5C',
      brightRed: '#FF7272',
      green: '#5BCC5B',
      brightGreen: '#72FF72',
      yellow: '#CCCC5B',
      brightYellow: '#FFFF72',
      blue: '#5D5DD3',
      brightBlue: '#7279FF',
      magenta: '#BC5ED1',
      brightMagenta: '#E572FF',
      cyan: '#5DA5D5',
      brightCyan: '#72F0FF',
      white: '#F8F8F8',
      brightWhite: '#FFFFFF'
    }
  }));
  const fitAddon = React.useRef<FitAddon>(new FitAddon());
  React.useEffect(() => {
    if (termRef.current) {
      term.current.loadAddon(fitAddon.current);
      term.current.open(termRef.current);
      term.current.onResize((arg1, arg2) => {
        console.log("RESIZE", arg1, arg2);
      })
      fitAddon.current.fit();
      window.term = term.current;
    }
  }, [termRef]);
  const handleStd = (e: Event) => {
    const data = (e as CustomEvent).detail;
    const str = data.data.replace("\t", "  ");
    if ((e as CustomEvent).type === "stderr") {
      term.current.writeln("\x1b[31m" + str + "\x1b[0m");
    } else {
      term.current.writeln(str);
    }
  }
  const clear = () => {
    term.current.writeln("\x1b[2J\x1b[3J\x1b[H");
  }

  const handleDone = (e: Event) => {
    const { results, error } = (e as CustomEvent).detail;
    term.current.writeln(`\x1b[3${error ? "1" : "2"}mExecution completed${results ? " with return value: " + results : ""}\x1b[0m`);
  }
  const handleResize = () => {
    fitAddon.current.fit();
  }

  const handleStdinRead = (event: Event) => {
    console.log("STDIN:READ");
    // const data = window.prompt("Enter input");
    // window.dispatchEvent(new CustomEvent("stdin:write", { detail: data }));
    if (!channel) {
      console.error("No channel available for stdin:read");
    } else {
      const id = (event as CustomEvent).detail.id;
      const data = window.prompt("Enter input");
      writeMessage(channel, data, id);
    }
  }

  React.useEffect(() => {
    window.addEventListener("stdout", handleStd);
    window.addEventListener("stderr", handleStd);
    window.addEventListener("clear", clear);
    window.addEventListener("done", handleDone);
    window.addEventListener("resize", handleResize)
    window.addEventListener("stdin:read", handleStdinRead);
    return () => {
      window.removeEventListener("stdout", handleStd, true);
      window.removeEventListener("stderr", handleStd, true);
      window.removeEventListener("clear", clear, true);
      window.removeEventListener("done", handleDone, true);
      window.removeEventListener("resize", handleResize, true);
      window.removeEventListener("stdin:read", handleStdinRead, true);
    }
  }, []);

  return (
    <ResizablePanel defaultSize={30} onResize={() => {
      fitAddon.current.fit();
    }}>
      <div id="terminal" ref={termRef} className="w-full h-full bg-black"></div>
    </ResizablePanel>
  );
}
export default XTermConsole;