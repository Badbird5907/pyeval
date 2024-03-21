import '@/App.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React, { useEffect, useState } from 'react'
import {
  Button,
  createTheme,
  CssBaseline,
  FormControlLabel,
  Popover,
  Switch,
  ThemeProvider,
  Typography
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IosShareIcon from '@mui/icons-material/IosShare';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import Editor from "@monaco-editor/react";
import { Config, defaultConfig } from '@/types/config';
import { SettingsModal } from '@/components/settings-modal';
import { OutputData } from "@/types/output";
import Console from "@/components/console";
import LinkIcons from '@/components/link-icons';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/resizable";
import ShareButton from "@/components/share-button";

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {
  }
});

function App() { // god awful code, but it works lmao
  const shareApiEndpoint = "https://bytebin.lucko.me/" // public instance of bytebin, using this as there is no api auth - https://github.com/lucko/bytebin

  const [input, setInput] = useState("print('Hello, World!')");
  const [output, setOutput] = useState<OutputData>();

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [mode, setMode] = React.useState<'light' | 'dark'>('dark');
  const [config, setConfig] = useState<Config>(defaultConfig)

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
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

  function saveSettings() { // make sure to modify the useEffect below when adding new settings
    console.log("Saving settings");
    localStorage.setItem("config", JSON.stringify(config));
  }

  function loadSettings() {
    console.log("Loading settings");
    const savedConfig = localStorage.getItem("config");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);

      // sync up themes
      setMode(parsed.customTheme);
      theme.palette.mode = parsed.customTheme;
    }

    setSettingsLoaded(true);
  }

  useEffect(() => {
    if (!settingsLoaded){
      return;
    }
    saveSettings();
  }, [config]);
  useEffect(() => {
    loadSettings();
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get('share');
    if (shareCode){
      setInput("# Loading share code...")
      const promises = [
        window.setupPyodide(),
        fetch("https://corsproxy.io/?" + encodeURIComponent(shareApiEndpoint + shareCode)).then(async (res) => {
          if (res.status >= 200 && res.status < 300){
            const data = await res.text();
            setInput(data);
          } else {
            alert("Failed to load share code");
          }
        })
      ];
      Promise.all(promises).then(() => {
        console.log("Setup complete")
      })
    } else {
      setInput("print('Hello, World!')");
      exec(input)
    }
  }, []);

  const runScript = async (code: string) => {
    console.log("Running python code", code);
    return await window.runPython(code);
  }

  const exec = async (code: string) => {
    //(A)console.log("Executing code: ", input);
    const out = await runScript(code);
    setOutput(JSON.parse(out));
  }

  const onChangeInput = async (event: { target: { value: string } }) => {
    const input = event.target.value;
    setInput(input);
    if (input.includes("input(")){
      setConfig({...config, autoRun: false}); // disable auto run if we are using input()
      return;
    }
    if (config.autoRun){
      console.log("Auto running", input);
      await exec(input);
    }
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <div className={theme.palette.mode}>
          <CssBaseline/>
          <SettingsModal open={settingsModalOpen} close={() => {
            setSettingsModalOpen(false);
          }} config={config} saveConfig={(cfg) => setConfig(cfg)}/>
          <div className={"m-4 gap-4 flex flex-row w-full h-[4vh]"}>
            <FormControlLabel control={<Switch checked={config.autoRun} onChange={() => {
              setConfig({...config, autoRun: !config.autoRun});
            }}/>} label="Auto Run"/>
            <ShareButton input={input} shareApiEndpoint={shareApiEndpoint} />
            <Button
              variant="contained"
              color="info"
              onClick={() => {
                setSettingsModalOpen(true);
              }}
              endIcon={<SettingsIcon/>}
            >
              Settings
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                await exec(input)
              }}
              endIcon={<PlayArrowIcon/>}
            >
              Run
            </Button>
            <div className={"ml-auto mr-8 flex flex-row"}>
              <Button
                color={"error"}
                variant={"contained"}
                onClick={() => {
                  setInput("");
                }}
              >
                <DeleteForeverIcon/>
              </Button>
              <LinkIcons config={config} setConfig={(cfg) => {
                setConfig(cfg);
              }} />
            </div>
          </div>
          <div className={"h-[92vh]"}>
            <ResizablePanelGroup direction={config.layout} className={"w-full h-full"}>
              <ResizablePanel>
                <Editor
                  height={"100%"}
                  width={"100%"}
                  defaultLanguage="python"
                  value={input}
                  onChange={(evn) => onChangeInput({target: {value: evn ?? ""}})}
                  theme={mode === "dark" ? "vs-dark" : "vs"}
                />
              </ResizablePanel>
              <ResizableHandle withHandle/>
              <ResizablePanel defaultSize={30}>
                <Console errorHighlighting={config.errorHighlighting}
                         aggressiveErrorHighlighting={config.aggressiveErrorHighlighting} output={output}
                         position={config.layout} config={config}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App
