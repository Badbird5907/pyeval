import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { useEffect } from "react";

import LinkIcons from "@/components/link-icons";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ShareButton from "@/components/share-button";
import XTermConsole from "@/components/xterm-console";
import { interruptExecution } from "@/main";
import { MonacoLSPEditor } from "@/components/editor/editor-lsp";
import { create } from "zustand";
import { useConfig } from "@/lib/config";
import { StatusBar } from "@/components/editor/status-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { FaStop, FaPlay, FaTrashAlt } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import SettingsButton from "@/components/settings";
import { SavesButton } from "@/components/saves/buttons";
import { useSaves } from "@/lib/saves";

export const defaultInput = `print('Hello, World!')`;
type AppState = {
  running: boolean;
  input: string;
  interpreterLoading: boolean;
  lspLoading: boolean;
  currentSave: string | null;

  __INTERNAL__: {
    setCurrentSave: (currentSave: string | null) => void;
  };

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
  currentSave: null,

  setRunning: (running: boolean) => set({ running }),
  setInput: (input: string) => {
    const { autoRun, autoSave } = useConfig.getState();
    if (autoSave) {
      const saves = useSaves.getState();
      const { currentSave } = get();
      if (currentSave) {
        saves.save(currentSave, input);
      }
    }
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

  __INTERNAL__: {
    setCurrentSave: (currentSave: string | null) => set({ currentSave }),
  },
}));

function App() {
  const shareApiEndpoint = "https://bytebin.lucko.me/"; // public instance of bytebin, using this as there is no api auth - https://github.com/lucko/bytebin
  const appState = useAppState();

  const config = useConfig();

  const saves = useSaves((state) => state.saves);

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
      const saveState = useSaves.getState();
      appState.setInput(saveState.getCurrentSave()?.code ?? defaultInput);
      if (config.autoRun) {
        appState.exec(appState.input);
      }
    }
    const load = () => {
      appState.setInterpreterLoading(false);
    };
    document.addEventListener("pyodideLoad", load);
    const beforeunload = (e: BeforeUnloadEvent) => {
      if (
        appState.running ||
        useSaves.getState().isCurrentInputDirtyIgnoreSave()
      ) {
        e.preventDefault();
        e.returnValue = true;
      }
    };
    window.addEventListener("beforeunload", beforeunload);
    return () => {
      document.removeEventListener("pyodideLoad", load);
      window.removeEventListener("beforeunload", beforeunload);
    };
  }, []);

  useEffect(() => {
    // handle code changes from another tab
    if (appState.currentSave) {
      const save = saves.find((save) => save.id === appState.currentSave);
      if (save && appState.input !== save.code) {
        // very important! prevents infinite loop
        appState.setInput(save.code);
      }
    }
  }, [saves]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="eval-theme">
      <div className={"h-screen flex flex-col"}>
        <div className="p-4 gap-4 flex flex-row w-full">
          <Button
            variant={appState.running ? "destructive" : "success"}
            onClick={() => {
              if (appState.running) {
                interruptExecution();
              } else {
                appState.exec(appState.input);
              }
            }}
          >
            {appState.running ? <FaStop /> : <FaPlay />}
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-run"
              checked={config.autoRun}
              onCheckedChange={() => config.setAutoRun(!config.autoRun)}
            />
            <label htmlFor="auto-run">Auto Run</label>
          </div>
          <ShareButton shareApiEndpoint={shareApiEndpoint} />
          <SettingsButton />

          <SavesButton />

          <div className="ml-auto mr-8 flex flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                appState.setInput("");
              }}
            >
              <FaTrashAlt />
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
  );
}

export default App;
