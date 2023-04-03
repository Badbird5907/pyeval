import React, {useEffect, useRef, useState} from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';
import {
    Box,
    Button,
    createTheme,
    CssBaseline,
    FormControlLabel,
    FormGroup,
    IconButton,
    Modal,
    Popover,
    Stack,
    Switch,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IosShareIcon from '@mui/icons-material/IosShare';
import GitHubIcon from "@mui/icons-material/GitHub";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import './App.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Output from "./components/Output";
import ThemeToggler from "./components/ThemeToggler";
import Editor from "@monaco-editor/react";
import {MonacoDummySelectionType} from "./types/MonacoDummySelectionType";

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
    const [autoRun, setAutoRun] = useState(true);
    const [enableKeyboard, setEnableKeyboard] = useState(false);
    const [errorHighlighting, setErrorHighlighting] = useState(true);
    const [aggressiveErrorHighlighting, setAggressiveErrorHighlighting] = useState(true);
    const [autoRunInShare, setAutoRunInShare] = useState(true);
    const [tabSpaces, setTabSpaces] = useState(tabSpacesDefault);
    const [customTheme, setCustomTheme] = useState<'light' | 'dark'>('dark');
    const [useNewEditor, setUseNewEditor] = useState(true);

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
        localStorage.setItem("autoRun", autoRun.toString());
        localStorage.setItem("enableKeyboard", enableKeyboard.toString());
        localStorage.setItem("errorHighlighting", errorHighlighting.toString());
        localStorage.setItem("aggressiveErrorHighlighting", aggressiveErrorHighlighting.toString());
        localStorage.setItem("autoRunInShare", autoRunInShare.toString());
        if (tabSpaces !== tabSpacesDefault) {
            localStorage.setItem("tabSpaces", tabSpaces.toString());
        }
        if (customTheme !== 'dark') { // jank
            localStorage.setItem("customTheme", customTheme.toString());
        } else {
            localStorage.removeItem("customTheme");
        }
        if (!useNewEditor) { // we want to change or delete this setting in the future
            localStorage.setItem("useNewEditor", useNewEditor.toString());
        } else {
            localStorage.removeItem("useNewEditor");
        }
    }

    function loadSettings() {
        if ("autoRun" in localStorage) setAutoRun(localStorage.getItem("autoRun") === "true");
        if ("enableKeyboard" in localStorage) setEnableKeyboard(localStorage.getItem("enableKeyboard") === "true");
        if ("errorHighlighting" in localStorage) setErrorHighlighting(localStorage.getItem("errorHighlighting") === "true");
        if ("aggressiveErrorHighlighting" in localStorage) setAggressiveErrorHighlighting(localStorage.getItem("aggressiveErrorHighlighting") === "true");
        if ("autoRunInShare" in localStorage) setAutoRunInShare(localStorage.getItem("autoRunInShare") === "true");
        if ("tabSpaces" in localStorage) setTabSpaces(parseInt(localStorage.getItem("tabSpaces") || tabSpacesDefault.toString()));
        if ("useNewEditor" in localStorage) setUseNewEditor(localStorage.getItem("useNewEditor") === "true");
        if ("customTheme" in localStorage) {
            const t = localStorage.getItem("customTheme") as 'light' | 'dark';
            setCustomTheme(t);
            setMode(t);
        }

        setSettingsLoaded(true);
    }

    useEffect(() => {
        if (!settingsLoaded) {
            return;
        }
        saveSettings();
    }, [autoRun, enableKeyboard, errorHighlighting, aggressiveErrorHighlighting, autoRunInShare, tabSpaces, customTheme, useNewEditor]);

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
                    if (autoRunInShare) {
                        exec(data);
                    }
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

    function updateSelection(e: any) {
        const target = e.currentTarget;
        const selectionStart = target?.selectionStart;
        const selectionEnd = target?.selectionEnd;
        console.log({e, selectionStart, selectionEnd});
        if (selectionStart !== null && selectionStart !== undefined && selectionEnd !== null && selectionEnd !== undefined) {
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

        if (inputStr === "{tab}") {
            inputStr = " ".repeat(tabSpaces);
        }
        if (inputStr === "{space}") {
            inputStr = " ";
        }
        if (inputStr === "{enter}") {
            inputStr = "\n";
        }
        if (selectionStart !== null && selectionStart !== undefined && selectionEnd !== null && selectionEnd !== undefined) {
            // check out of bounds (input)
            if (selectionStart < 0 || selectionStart > input.length) {
                console.log("Selection start is out of bounds, resetting to end");
                await resetSelections(input);
            }
            if (selectionEnd < 0 || selectionEnd > input.length) {
                console.log("Selection end is out of bounds, resetting to end");
                await resetSelections(input);
            }
            const hasSelection = selectionStart !== selectionEnd; // are we selecting text? or just typing?
            if (hasSelection) {
                //(A)console.log("We are selecting text");
                const before = input.substring(0, selectionStart); // get the text before the selection
                const after = input.substring(selectionEnd); // get the text after the selection
                const middle = input.substring(selectionStart, selectionEnd); // get the text we are selecting
                const allTextSelected = selectionStart === 0 && selectionEnd === input.length; // are we selecting all the text?
                console.log("before", before, "middle", middle, "after", after, "allTextSelected", allTextSelected);
                // handle backspace
                if (inputStr === "{bksp}") {
                    if (allTextSelected) {
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
                if (allTextSelected) {
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
                if (inputStr === "{bksp}") {
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
                if (after.length > 0) {
                    await setSelectionStart(selectionStart + inputStr.length); // update the selection
                    await setSelectionEnd(selectionStart + inputStr.length);
                }
                return res; // we don't need to reset the selections because we are not selecting text
            }
        } else {
            if (inputStr === "{bksp}") {
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
        if (button === "{shift}" || button === "{lock}") {
            handleShift();
            return;
        }
        const res = await addInput(button);
        console.log({res});
        if (autoRun) {
            await exec(res as string);
        }
    };

    const handleShift = () => {
        setLayoutName(layoutName === "default" ? "shift" : "default");
    };

    const onChangeInput = async (event: any) => {
        const input = event.target.value;
        await setInput(input);
        keyboard.current?.setInput(input);
        if (autoRun) {
            console.log("Auto running", input);
            await exec(input);
        }
    };

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <div>
                    {settingsModalOpen && (
                        <Modal
                            open={settingsModalOpen}
                            onClose={() => {
                                setSettingsModalOpen(false);
                            }}
                        >
                            <Box sx={{
                                position: 'absolute' as 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 400,
                                bgcolor: 'background.paper',
                                border: '2px solid #000',
                                boxShadow: 24,
                                p: 4,
                            }}>
                                <FormGroup>
                                    <FormControlLabel control={<Switch checked={errorHighlighting} onChange={() => {
                                        setErrorHighlighting(!errorHighlighting);
                                    }}/>} label="Error Highlighting"/>
                                </FormGroup>
                                {errorHighlighting && (
                                    <div style={{marginLeft: 20}}>
                                        <FormGroup>
                                            <FormControlLabel
                                                control={<Switch checked={aggressiveErrorHighlighting} onChange={() => {
                                                    setAggressiveErrorHighlighting(!aggressiveErrorHighlighting);
                                                }}/>}
                                                label="Aggressive Error Highlighting (may cause performance issues? & buggy)"/>
                                        </FormGroup>
                                    </div>
                                )}
                                <FormGroup>
                                    <FormControlLabel control={<Switch checked={autoRunInShare} onChange={() => {
                                        setAutoRunInShare(!autoRunInShare);
                                    }}/>} label="Auto run in shares"/>
                                </FormGroup>
                                <FormGroup>
                                    <FormControlLabel control={<Switch checked={useNewEditor} onChange={() => {
                                        setUseNewEditor(!useNewEditor);
                                    }}/>} label="Use new editor"/>
                                </FormGroup>
                                <FormGroup>
                                    <FormControlLabel control={<Switch checked={enableKeyboard} onChange={() => {
                                        setEnableKeyboard(!enableKeyboard);
                                    }}/>} label="Keyboard"/>
                                </FormGroup>
                                <FormGroup>
                                    <TextField type={"number"} label={"Tab Spaces"} value={tabSpaces} onChange={(e) => {
                                        setTabSpaces(parseInt(e.target.value));
                                    }}/>
                                </FormGroup>
                            </Box>
                        </Modal>
                    )}
                    <Stack direction={"row"} spacing={2} style={{
                        margin: 20,
                        zIndex: 1000,
                    }}>
                        <FormGroup>
                            <FormControlLabel control={<Switch checked={autoRun} onChange={() => {
                                setAutoRun(!autoRun);
                            }}/>} label="Auto Run"/>
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
                                        console.log({res});
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
                            sx={{
                                position: "absolute",
                                float: "right",
                                right: 80,
                                flexDirection: "column",
                            }}
                            onClick={() => {
                                setInput("");
                            }}
                        >
                            <DeleteForeverIcon/>
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
                    <IconButton sx={{ml: 1}} href={"https://github.com/Badbird5907/pyeval-web"} color="inherit">
                        <GitHubIcon/>
                    </IconButton>
                    <ThemeToggler onChange={(newTheme) => {
                        console.log({newTheme});
                        setCustomTheme(newTheme as 'light' | 'dark');
                    }}/>
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
                            useNewEditor ? (
                                <>
                                    <Editor
                                        height="40vh"
                                        width="90vw"
                                        defaultLanguage="python"
                                        value={input}
                                        onChange={(evn) => onChangeInput({target: {value: evn}})}
                                        theme={mode === "dark" ? "vs-dark" : "vs"}
                                        onMount={(editor, monaco) => {
                                            console.log("editor mounted, ", {editor, monaco});
                                            /*
                                              onClick={updateSelection}
                                    onMouseUp={updateSelection}
                                    onKeyDown={updateSelection}
                                    onKeyUp={updateSelection}
                                             */
                                            editor.onDidChangeCursorSelection((e) => {
                                                console.log("cursor selection changed, ", {e});
                                                setSelectionEnd(e.selection.endColumn);
                                                setSelectionStart(e.selection.startColumn);
                                            });
                                        }}
                                    />
                                </>
                            ) : (
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
                            )
                        }
                    </div>
                    {enableKeyboard &&
                        <div style={{
                            width: "100vw",
                        }}>
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
                        </div>}
                    <div>
                        <h3>Output</h3>
                        <Output errorHighlighting={errorHighlighting}
                                aggressiveErrorHighlighting={aggressiveErrorHighlighting} output={output}/>
                    </div>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App
