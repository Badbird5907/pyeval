import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import React, { useEffect, useState } from "react";
import {
  Button,
  createTheme,
  CssBaseline,
  FormControlLabel,
  Switch,
  ThemeProvider,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import LinkIcons from "@/components/link-icons";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/resizable";
import ShareButton from "@/components/share-button";
import XTermConsole from "@/components/xterm-console";
import { interruptExecution } from "@/main";
import { MonacoLSPEditor } from "@/components/editor/editor-lsp";
import { cn } from "@/utils";
import { create } from "zustand";
import { useConfig } from "@/types/config";
import { StatusBar } from "@/components/editor/status-bar";

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  theme: "dark",
});
const defaultInput = `print('Hello, World!')`;

type AppState = {
  running: boolean;
  input: string;
  interpreterLoading: boolean;
  lspLoading: boolean;

  setRunning: (running: boolean) => void;
  setInput: (input: string) => void;
  setInterpreterLoading: (interpreterLoading: boolean) => void;
  setLspLoading: (lspLoading: boolean) => void;

  exec: (code: string) => void;
};

export const useAppState = create<AppState>((set, get) => ({
  running: false,
  input: defaultInput,
  interpreterLoading: !window.setup,
  lspLoading: true,

  setRunning: (running: boolean) => set({ running }),
  setInput: (input: string) => {
    const autoRun = useConfig.getState().autoRun;
    if (autoRun && input.includes("input(")) {
      console.log("Auto run disabled due to input() call");
      useConfig.setState({ autoRun: false });
    }
    set({ input });
    if (autoRun) {
      get().exec(input);
    }
  },
  setInterpreterLoading: (interpreterLoading: boolean) =>
    set({ interpreterLoading }),
  setLspLoading: (lspLoading: boolean) => set({ lspLoading }),

  exec: (code: string) => {
    console.log("========== Begin Execution ==========");
    if (get().running) {
      console.log("Execution already in progress");
      console.log("========== End Execution ==========");
      return;
    }
    console.log("Executing code: ", get().input);
    set({ running: true });
    window.dispatchEvent(new Event("clear"));
    window.dispatchEvent(new Event("resize"));
    console.log("Executing code");
    window.runPython(code, {}).finally(() => {
      console.log("Execution complete");
      set({ running: false });
      console.log("========== End Execution ==========");
    });
  },
}));

function App() {
  const shareApiEndpoint = "https://bytebin.lucko.me/"; // public instance of bytebin, using this as there is no api auth - https://github.com/lucko/bytebin
  const appState = useAppState();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [mode, setMode] = React.useState<"light" | "dark">("dark");
  const config = useConfig();

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
      theme: mode,
    }),
    [],
  );

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  const confTheme = useConfig((conf) => conf.customTheme);
  useEffect(() => {
    setMode(confTheme);
    theme.palette.mode = confTheme;
  }, [confTheme]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get("share");
    if (shareCode) {
      appState.setInput("# Loading share code...");
      const promises = [
        // window.setupPyodide(),
        fetch(
          `https://proxy.badbird.dev/?rewrite=cors&url=${encodeURIComponent(shareApiEndpoint + shareCode)}`,
        ).then(async (res) => {
          if (res.status >= 200 && res.status < 300) {
            const data = await res.text();
            appState.setInput(data);
          } else {
            alert("Failed to load share code");
          }
        }),
      ];
      Promise.all(promises).then(() => {
        console.log("Setup complete");
      });
    } else {
      appState.setInput(defaultInput);
      appState.exec(appState.input);
    }
  }, []);

  useEffect(() => {
    const load = () => {
      appState.setInterpreterLoading(false);
    };
    document.addEventListener("pyodideLoad", load);
    return () => {
      document.removeEventListener("pyodideLoad", load);
    };
  }, []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <div className={cn(theme.palette.mode, "h-screen flex flex-col")}>
          <CssBaseline />
          {/*<SettingsModal
              open={settingsModalOpen}
              close={() => {
                setSettingsModalOpen(false);
              }}
              config={config}
            />*/}
          <div className="p-4 gap-4 flex flex-row w-full">
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoRun}
                  onChange={() => {
                    config.setAutoRun(!config.autoRun);
                  }}
                />
              }
              label="Auto Run"
            />
            <ShareButton shareApiEndpoint={shareApiEndpoint} />
            <Button
              variant="contained"
              color="info"
              onClick={() => {
                setSettingsModalOpen(true);
              }}
              endIcon={<SettingsIcon />}
            >
              Settings
            </Button>
            <Button
              variant="contained"
              color={appState.running ? "error" : "success"}
              onClick={() => {
                if (appState.running) {
                  interruptExecution();
                } else {
                  appState.exec(appState.input);
                }
              }}
              endIcon={appState.running ? <StopIcon /> : <PlayArrowIcon />}
            >
              {appState.running ? "Stop" : "Run"}
            </Button>
            <div className="ml-auto mr-8 flex flex-row">
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  appState.setInput("");
                }}
              >
                <DeleteForeverIcon />
              </Button>
              <LinkIcons />
            </div>
          </div>
          <div className="flex-1 flex w-full ">
            <ResizablePanelGroup
              direction={config.layout}
              className="w-full h-full"
            >
              <ResizablePanel className="h-full">
                <MonacoLSPEditor />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <XTermConsole />
            </ResizablePanelGroup>
          </div>
          <StatusBar />
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
