import React, { useEffect, useRef, useState } from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';
import {
    Button,
    createTheme,
    CssBaseline,
    FormControlLabel,
    FormGroup, IconButton,
    Popover,
    Stack,
    Switch,
    ThemeProvider,
    Typography
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IosShareIcon from '@mui/icons-material/IosShare';
import GitHubIcon from "@mui/icons-material/GitHub";

import '@/App.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import ThemeToggler from "@/components/theme-toggle";
import Editor from "@monaco-editor/react";
import { Config, defaultConfig } from '@/types/config';
import { SettingsModal } from '@/components/settings-modal';
import Output from '@/components/output';

export const ColorModeContext = React.createContext({
    toggleColorMode: () => {
    }
});

function App() { // god awful code, but it works lmao
    const shareApiEndpoint = "https://bytebin.lucko.me/" // public instance of bytebin, using this as there is no api auth - https://github.com/lucko/bytebin
    const tabSpacesDefault = 2;

    const [layoutName, setLayoutName] = useState("default");
    const [input, setInput] = useState("print('Hello, World!')");
    const [output, setOutput] = useState<any>({});
    const keyboard = useRef<any>(null);
    const textArea = useRef<HTMLTextAreaElement>(null);

    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);

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
        if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
        }

        setSettingsLoaded(true);
    }

    useEffect(() => {
        if (!settingsLoaded) {
            return;
        }
        saveSettings();
    }, [config]);
    useEffect(() => {
        // We need this code because clicking on the keyboard (outside of the textarea) makes us lose the current selection, so we need to store that
        // listen for changes to textarea.selectionStart and textarea.selectionEnd, kinda hacky
        if (!textArea) return;

        function checkSelection() {
            if (textArea.current?.selectionStart && textArea.current?.selectionEnd) {
                setSelectionStart(textArea.current.selectionStart);
                setSelectionEnd(textArea.current.selectionEnd);
            }
        }

        textArea.current?.addEventListener("click", () => { // whenever we click inside the textarea
            //(A)console.log("Clicked inside textarea");
            checkSelection();
        });
        textArea.current?.addEventListener("keyup", () => { // whenever we press a key inside the textarea
            //(A)console.log("Keyup inside textarea");
            checkSelection();
        });
    }, [textArea]);
    useEffect(() => {
        loadSettings();
        const urlParams = new URLSearchParams(window.location.search);
        const shareCode = urlParams.get('share');
        if (shareCode) {
            setInput("# Loading share code...")
            fetch("https://corsproxy.io/?" + encodeURIComponent(shareApiEndpoint + shareCode)).then(async (res) => {
                if (res.status >= 200 && res.status < 300) {
                    const data = await res.text();
                    setInput(data);
                } else {
                    alert("Failed to load share code");
                }
            });
        } else {
            setInput("print('Hello, World!')");
            exec(input)
        }
    }, []);

    const runScript = async (code: string) => {
        console.log("Running python code", code);
        // @ts-ignore
        return await runPython(code);
    }
    const addInput = async (inputStr: string) => {
        async function resetSelections() {
            //(A)console.log("Resetting selections");
            // WE ARE AWAITING THIS BECAUSE WE NEED TO WAIT FOR THE STATE TO UPDATE BEFORE WE CAN USE IT IDK IF IT ACTUALLY WORKS BUT I'VE GOTTEN RACE CONDITIONS BEFORE AND I REALLY DONT WANT TO WORK THAT OUT AAAAAAAAAAAAAAAAAAAA
            await setSelectionStart(input.length + 1); // update the selection
            await setSelectionEnd(input.length + 1);
        }

        if (inputStr === "{tab}") {
            inputStr = " ".repeat(config.tabSpaces);
        }
        if (inputStr === "{space}") {
            inputStr = " ";
        }
        if (inputStr === "{enter}") {
            inputStr = "\n";
        }
        if (selectionStart && selectionEnd) {
            // check out of bounds (input)
            if (selectionStart < 0 || selectionStart > input.length) {
                //(A)console.log("Selection start is out of bounds, resetting to end");
                await resetSelections();
            }
            if (selectionEnd < 0 || selectionEnd > input.length) {
                //(A)console.log("Selection end is out of bounds, resetting to end");
                await resetSelections();
            }
            const hasSelection = selectionStart !== selectionEnd; // are we selecting text? or just typing?
            if (hasSelection) {
                //(A)console.log("We are selecting text");
                const before = input.substring(0, selectionStart); // get the text before the selection
                const after = input.substring(selectionEnd); // get the text after the selection
                // handle backspace
                if (inputStr === "{bksp}") {
                    await setInput(before + after); // set the input to the text before the selection + the text after the selection
                    await resetSelections();
                    return;
                }
                await setInput(before + inputStr + after); // set the input to the text before the selection + the input + the text after the selection
                await resetSelections();
                return;
            } else { // we are not selecting text, just typing
                if (inputStr === "{bksp}") {
                    // remove the character before the selection
                    const before = input.substring(0, selectionStart - 1); // get the text before the selection
                    const after = input.substring(selectionEnd); // get the text after the selection
                    await setInput(before + after); // set the input to the text before the selection + the text after the selection
                    await setSelectionStart(selectionStart - 1); // update the selection
                    await setSelectionEnd(selectionStart - 1);
                    return; // Don't need to reset the selections because we are not selecting text
                }
                //(A)console.log("We are not selecting text");
                const before = input.substring(0, selectionStart); // get the text before the selection
                const after = input.substring(selectionEnd); // get the text after the selection
                await setInput(before + inputStr + after); // set the input to the text before the selection + the input + the text after the selection
                return; // we don't need to reset the selections because we are not selecting text
            }
        } else {
            await setInput(input + inputStr);
        }
        await resetSelections();
    }

    const exec = async (code: string) => {
        //(A)console.log("Executing code: ", input);
        const out = await runScript(code);
        setOutput(JSON.parse(out));
    }

    const onKeyPress = async (button: string) => {
        //(A)console.log("Button pressed", button);
        if (button === "{shift}" || button === "{lock}") {
            handleShift();
            return;
        }
        await addInput(button);
        if (config.autoRun) {
            await exec(input);
        }
    };

    const handleShift = () => {
        setLayoutName(layoutName === "default" ? "shift" : "default");
    };

    const onChangeInput = async (event: { target: { value: string } }) => {
        const input = event.target.value;
        setInput(input);
        keyboard.current?.setInput(input);
        if (input.includes("input(")) {
            setConfig({ ...config, autoRun: false }); // disable auto run if we are using input()
            return;
        }
        if (config.autoRun) {
            console.log("Auto running", input);
            await exec(input);
        }
    };

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div>
                    <SettingsModal open={settingsModalOpen} close={() => {
                        setSettingsModalOpen(false);
                    }} config={config} saveConfig={(cfg) => setConfig(cfg)} />
                    <Stack direction={"row"} spacing={2} style={{
                        margin: 20,
                        zIndex: 1000,
                    }}>
                        <FormGroup>
                            <FormControlLabel control={<Switch checked={config.autoRun} onChange={() => {
                                setConfig({ ...config, autoRun: !config.autoRun });
                            }} />} label="Auto Run" />
                        </FormGroup>
                        <FormGroup>
                            <FormControlLabel control={<Switch checked={config.enableKeyboard} onChange={() => {
                                setConfig({ ...config, enableKeyboard: !config.enableKeyboard });
                            }} />} label="Keyboard" />
                        </FormGroup>
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
                                        console.log({ res });
                                        if (res.status >= 200 && res.status < 300) {
                                            res.json().then((data) => {
                                                const key = data.key;
                                                if (key) {
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
                                endIcon={<IosShareIcon />}
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
                                    sx={{ p: 2 }}>{shareError ? "Error!" : shareProcessing ? "Processing..." : "Link copied to clipboard"}</Typography>
                            </Popover>
                        </div>
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
                            color="success"
                            onClick={async () => {
                                await exec(input)
                            }}
                            endIcon={<PlayArrowIcon />}
                        >
                            Run
                        </Button>
                    </Stack>
                </div>
                {/* Float on the top right */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    padding: 10,
                }}>
                    <IconButton sx={{ ml: 1 }} href={"https://github.com/Badbird5907/pyeval-web"} color="inherit">
                        <GitHubIcon />
                    </IconButton>
                    <ThemeToggler onChange={(newTheme) => {
                        console.log({ newTheme });
                        // setCustomTheme(newTheme as 'light' | 'dark');
                        setConfig({ ...config, customTheme: newTheme as 'light' | 'dark' });
                    }} />
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100vh",
                    width: "100vw",
                }}>
                    <div data-color-mode={mode || "dark"}>
                        {
                            config.useFallbackEditor ? (
                                <CodeEditor
                                    value={input}
                                    language="python"
                                    placeholder="Please enter code."
                                    onChange={(evn) => onChangeInput(evn)}
                                    minHeight={20}
                                    ref={textArea}
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
                                    height="40vh"
                                    width="90vw"
                                    defaultLanguage="python"
                                    defaultValue={input}
                                    onChange={(value: string | undefined, _) => onChangeInput({ target: { value: value ?? "" } })}
                                    theme={mode === "dark" ? "vs-dark" : "vs"}
                                    onMount={() => {
                                        console.log("editor mounted");
                                    }}
                                />
                            )
                        }
                    </div>
                    {config.enableKeyboard &&
                        <div style={{
                            width: "100%",
                            color: "black",
                        }}>
                            <Keyboard
                                keyboardRef={r => (keyboard.current = r)}
                                layoutName={layoutName}
                                onKeyPress={onKeyPress}
                            />
                        </div>
                    }
                    <div>
                        <h3>Output</h3>
                        <Output errorHighlighting={config.errorHighlighting}
                            aggressiveErrorHighlighting={config.aggressiveErrorHighlighting} output={output} />
                    </div>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App
