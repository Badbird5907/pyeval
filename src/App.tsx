import React, { useEffect, useRef, useState } from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';
import {
  Button,
  createTheme,
  CssBaseline,
  FormControlLabel,
  FormGroup,
  IconButton,
  Popover,
  Stack,
  Switch,
  ThemeProvider,
  Typography
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IosShareIcon from '@mui/icons-material/IosShare';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import '@/App.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Editor from "@monaco-editor/react";
import { Config, defaultConfig } from '@/types/config';
import { SettingsModal } from '@/components/settings-modal';
import { MonacoDummySelectionType } from "@/types/MonacoDummySelectionType";
import { OutputData } from "@/types/output";
import Console from "@/components/console";
import AppVersion from "@/components/app-version";
import LinkIcons from '@/components/link-icons';

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {
  }
});

function App() { // god awful code, but it works lmao
  const shareApiEndpoint = "https://bytebin.lucko.me/" // public instance of bytebin, using this as there is no api auth - https://github.com/lucko/bytebin
  const tabSpacesDefault = 2;

  const [layoutName, setLayoutName] = useState("default");
  const [input, setInput] = useState("print('Hello, World!')");
  const [output, setOutput] = useState<OutputData>();
  const keyboard = useRef<any>(null);
  const [textArea, setTextArea] = useState<HTMLTextAreaElement>();

  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [monacoSelection, setMonacoSelection] = useState<MonacoDummySelectionType | null>(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [shareProcessing, setShareProcessing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [shareButton, setShareButton] = useState<HTMLButtonElement | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [mode, setMode] = React.useState<'light' | 'dark'>('dark');

  // settings
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
    if (savedConfig){
      setConfig(JSON.parse(savedConfig));
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

  function updateSelection(e: any) {
    const target = e.currentTarget;
    const selectionStart = target?.selectionStart;
    const selectionEnd = target?.selectionEnd;
    console.log({e, selectionStart, selectionEnd});
    if (selectionStart !== null && selectionStart !== undefined && selectionEnd !== null && selectionEnd !== undefined){
      setSelectionStart(selectionStart);
      setSelectionEnd(selectionEnd);
    }
  }

  const addInput = async (inputStr: string) => {
    async function resetSelections(input: string) {
      //(A)console.log("Resetting selections");
      // WE ARE AWAITING THIS BECAUSE WE NEED TO WAIT FOR THE STATE TO UPDATE BEFORE WE CAN USE IT IDK IF IT ACTUALLY WORKS BUT I'VE GOTTEN RACE CONDITIONS BEFORE AND I REALLY DONT WANT TO WORK THAT OUT AAAAAAAAAAAAAAAAAAAA
      await setSelectionStart(input.length + 1); // update the selection
      await setSelectionEnd(input.length + 1);
    }

    if (inputStr === "{tab}"){
      inputStr = " ".repeat(config.tabSpaces);
    }
    if (inputStr === "{space}"){
      inputStr = " ";
    }
    if (inputStr === "{enter}"){
      inputStr = "\n";
    }
    if (selectionStart && selectionEnd){
      // check out of bounds (input)
      if (selectionStart < 0 || selectionStart > input.length){
        console.log("Selection start is out of bounds, resetting to end");
        await resetSelections(input);
      }
      if (selectionEnd < 0 || selectionEnd > input.length){
        console.log("Selection end is out of bounds, resetting to end");
        await resetSelections(input);
      }
      const hasSelection = selectionStart !== selectionEnd; // are we selecting text? or just typing?
      if (hasSelection){
        //(A)console.log("We are selecting text");
        const before = input.substring(0, selectionStart); // get the text before the selection
        const after = input.substring(selectionEnd); // get the text after the selection
        const middle = input.substring(selectionStart, selectionEnd); // get the text we are selecting
        const allTextSelected = selectionStart === 0 && selectionEnd === input.length; // are we selecting all the text?
        console.log("before", before, "middle", middle, "after", after, "allTextSelected", allTextSelected);
        // handle backspace
        if (inputStr === "{bksp}"){
          if (allTextSelected){
            setInput("");
            await resetSelections("");
            return "";
          }
          const inp = before + after;
          await setInput(inp); // set the input to the text before the selection + the text after the selection
          await setSelectionStart(selectionStart); // set the selection to the end of the text we just added
          await setSelectionEnd(selectionStart);
          return inp;
        }
        if (allTextSelected){
          await setInput(inputStr); // set the input to the text before the selection + the input + the text after the selection
          await resetSelections(inputStr);
          return inputStr;
        }
        const res = before + inputStr + after;
        await setInput(res); // set the input to the text before the selection + the input + the text after the selection
        // await resetSelections();
        // set the selection to the end of the text we just added
        await setSelectionStart(selectionStart + inputStr.length);
        await setSelectionEnd(selectionStart + inputStr.length);
        return res;
      } else { // we are not selecting text, just typing
        if (inputStr === "{bksp}"){
          // remove the character before the selection
          const before = input.substring(0, selectionStart - 1); // get the text before the selection
          const after = input.substring(selectionEnd); // get the text after the selection
          const res = before + after;
          await setInput(res); // set the input to the text before the selection + the text after the selection
          await setSelectionStart(selectionStart - 1); // update the selection
          await setSelectionEnd(selectionStart - 1);
          return res; // Don't need to reset the selections because we are not selecting text
        }
        //(A)console.log("We are not selecting text");
        const before = input.substring(0, selectionStart); // get the text before the selection
        const after = input.substring(selectionEnd); // get the text after the selection
        const res = before + inputStr + after;
        await setInput(res); // set the input to the text before the selection + the input + the text after the selection
        if (after.length > 0){
          await setSelectionStart(selectionStart + inputStr.length); // update the selection
          await setSelectionEnd(selectionStart + inputStr.length);
        }
        return res; // we don't need to reset the selections because we are not selecting text
      }
    } else {
      if (inputStr === "{bksp}"){
        const res = input.substring(0, input.length - 1);
        await setInput(res);
        await resetSelections(res);
        return res;
      }
      const res = input + inputStr;
      await setInput(res);
      await resetSelections(res);
      return res;
    }
    return input;
  }

  const exec = async (code: string) => {
    //(A)console.log("Executing code: ", input);
    const out = await runScript(code);
    setOutput(JSON.parse(out));
  }

  const onKeyPress = async (button: string) => {
    //(A)console.log("Button pressed", button);
    if (button === "{shift}" || button === "{lock}"){
      handleShift();
      return;
    }
    const res = await addInput(button);
    console.log({res});
    if (config.autoRun){
      await exec(res as string);
    }
  };

  const handleShift = () => {
    setLayoutName(layoutName === "default" ? "shift" : "default");
  };

  const onChangeInput = async (event: { target: { value: string } }) => {
    const input = event.target.value;
    setInput(input);
    keyboard.current?.setInput(input);
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
        <CssBaseline/>
        <AppVersion/>
        <div>
          <SettingsModal open={settingsModalOpen} close={() => {
            setSettingsModalOpen(false);
          }} config={config} saveConfig={(cfg) => setConfig(cfg)}/>
          <div className={"m-4 gap-4 flex flex-row w-full"}>
            <FormControlLabel control={<Switch checked={config.autoRun} onChange={() => {
              setConfig({...config, autoRun: !config.autoRun});
            }}/>} label="Auto Run"/>
            <div>
              <Button
                variant="contained"
                color="info"
                onClick={(e) => {
                  setShareButton(e.currentTarget)
                  setSharePopoverOpen(true);
                  setShareProcessing(true);
                  fetch("https://corsproxy.io/?" + encodeURIComponent(shareApiEndpoint + "post"), {
                    method: "POST",
                    headers: {
                      "Content-Type": "text/plain",
                      "User-Agent": "PyEval - Badbird5907",
                    },
                    body: input,
                  }).then((res) => {
                    console.log({res});
                    if (res.status >= 200 && res.status < 300){
                      res.json().then((data) => {
                        const key = data.key;
                        if (key){
                          // create a new url with the encoded input
                          const url = new URL(window.location.href);
                          url.searchParams.set("share", key);
                          // copy the url to the clipboard
                          navigator.clipboard.writeText(url.toString());
                          setShareProcessing(false);
                        } else {
                          setShareError(true);
                        }
                      });
                    } else {
                      setShareError(true);
                    }
                  }).catch((err) => {
                    console.error(err);
                    setShareError(true);
                  });
                }}
                endIcon={<IosShareIcon/>}
                aria-describedby={"share-popover"}
              >
                Share
              </Button>
              <Popover
                id={"share-popover"}
                open={sharePopoverOpen}
                anchorEl={shareButton}
                onClose={() => {
                  setSharePopoverOpen(false);
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                <Typography
                  sx={{p: 2}}>{shareError ? "Error!" : shareProcessing ? "Processing..." : "Link copied to clipboard"}</Typography>
              </Popover>
            </div>
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
            <Button
              color={"error"}
              variant={"contained"}
              className={"ml-auto mr-20"}
              onClick={() => {
                setInput("");
              }}
            >
              <DeleteForeverIcon/>
            </Button>
          </div>
        </div>
        {/* Float on the top right */}
        <LinkIcons config={config} setConfig={setConfig}/>
        <div className={"flex flex-col items-center justify-center gap-4"}>
          <div data-color-mode={mode || "dark"} className={"resize-y overflow-hidden h-[75vh]"} >
            {
              config.useFallbackEditor ? (
                <CodeEditor
                  id={"code-editor"}
                  value={input}
                  language="python"
                  placeholder="Please enter code."
                  onChange={(evn) => onChangeInput(evn)}
                  minHeight={20}
                  onClick={updateSelection}
                  onMouseUp={updateSelection}
                  onKeyDown={updateSelection}
                  onKeyUp={updateSelection}
                  data-color-mode={mode}
                  style={{
                    fontSize: 12,
                    marginTop: 20,
                    width: "90vw",
                    height: "40vh",
                    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                  }}
                />
              ) : (
                <Editor
                  height="100%"
                  width="90vw"
                  defaultLanguage="python"
                  value={input}
                  onChange={(evn) => onChangeInput({target: {value: evn ?? ""}})}
                  theme={mode === "dark" ? "vs-dark" : "vs"}
                  onMount={(editor, monaco) => {
                    console.log("editor mounted, ", {editor, monaco});
                    editor.onDidChangeCursorSelection((e: any) => {
                      console.log("cursor selection changed, ", {e});
                      setSelectionEnd(e.selection.endColumn);
                      setSelectionStart(e.selection.startColumn);
                    });
                  }}
                />
              )
            }
          </div>
          {config.enableKeyboard &&
              <div className={"text-black w-full"}>
                  <Keyboard
                      keyboardRef={r => (keyboard.current = r)}
                      layoutName={layoutName}
                      onKeyPress={onKeyPress}
                      display={{
                        '{bksp}': '⌫',
                        '{enter}': '↵',
                        '{shift}': '⇧',
                        '{lock}': '⇪',
                        '{tab}': '⇥',
                        '{space}': '␣',
                      }}
                      theme={`hg-theme-default ${mode === "dark" ? "darkTheme" : ""}`}
                  />
              </div>
          }
          <div>
            <h3>Output</h3>
            <Console errorHighlighting={config.errorHighlighting}
                     aggressiveErrorHighlighting={config.aggressiveErrorHighlighting} output={output}/>
          </div>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App
