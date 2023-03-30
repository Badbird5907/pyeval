import React, {useEffect, useRef, useState} from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';
import {
    Box,
    Button,
    FormControlLabel,
    FormGroup,
    Modal,
    Popover,
    Stack,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IosShareIcon from '@mui/icons-material/IosShare';

import './App.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Output from "./components/Output";

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

    // settings
    const [autoRun, setAutoRun] = useState(true);
    const [enableKeyboard, setEnableKeyboard] = useState(false);
    const [errorHighlighting, setErrorHighlighting] = useState(true);
    const [aggressiveErrorHighlighting, setAggressiveErrorHighlighting] = useState(true);
    const [autoRunInShare, setAutoRunInShare] = useState(true);
    const [tabSpaces, setTabSpaces] = useState(tabSpacesDefault);

    function saveSettings() { // make sure to modify the useEffect below when adding new settings
        localStorage.setItem("autoRun", autoRun.toString());
        localStorage.setItem("enableKeyboard", enableKeyboard.toString());
        localStorage.setItem("errorHighlighting", errorHighlighting.toString());
        localStorage.setItem("aggressiveErrorHighlighting", aggressiveErrorHighlighting.toString());
        localStorage.setItem("autoRunInShare", autoRunInShare.toString());
        if (tabSpaces !== tabSpacesDefault) {
            localStorage.setItem("tabSpaces", tabSpaces.toString());
        }
    }

    function loadSettings() {
        if ("autoRun" in localStorage) setAutoRun(localStorage.getItem("autoRun") === "true");
        if ("enableKeyboard" in localStorage) setEnableKeyboard(localStorage.getItem("enableKeyboard") === "true");
        if ("errorHighlighting" in localStorage) setErrorHighlighting(localStorage.getItem("errorHighlighting") === "true");
        if ("aggressiveErrorHighlighting" in localStorage) setAggressiveErrorHighlighting(localStorage.getItem("aggressiveErrorHighlighting") === "true");
        if ("autoRunInShare" in localStorage) setAutoRunInShare(localStorage.getItem("autoRunInShare") === "true");
        if ("tabSpaces" in localStorage) setTabSpaces(parseInt(localStorage.getItem("tabSpaces") || tabSpacesDefault.toString()));

        setSettingsLoaded(true);
    }

    useEffect(() => {
        if (!settingsLoaded) {
            return;
        }
        saveSettings();
    }, [autoRun, enableKeyboard, errorHighlighting, aggressiveErrorHighlighting, autoRunInShare, tabSpaces]);
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
    const addInput = async (inputStr: string) => {
        async function resetSelections() {
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
        if (autoRun) {
            await exec(input);
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
        <>
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
                                <TextField type={"number"} label={"Tab Spaces"} value={tabSpaces} onChange={(e) => {
                                    setTabSpaces(parseInt(e.target.value));
                                }}/>
                            </FormGroup>
                        </Box>
                    </Modal>
                )}
                <Stack direction={"row"} spacing={2}>
                    <FormGroup>
                        <FormControlLabel control={<Switch checked={autoRun} onChange={() => {
                            setAutoRun(!autoRun);
                        }}/>} label="Auto Run"/>
                    </FormGroup>
                    <FormGroup>
                        <FormControlLabel control={<Switch checked={enableKeyboard} onChange={() => {
                            setEnableKeyboard(!enableKeyboard);
                        }}/>} label="Keyboard"/>
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
                </Stack>
            </div>
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
            }}>
                <CodeEditor
                    value={input}
                    language="python"
                    placeholder="Please enter code."
                    onChange={(evn) => onChangeInput(evn)}
                    minHeight={20}
                    ref={textArea}
                    style={{
                        fontSize: 12,
                        width: "90vw",
                        height: "40vh",
                        backgroundColor: "#f5f5f5",
                        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                    }}
                />
                {enableKeyboard &&
                    <Keyboard
                        keyboardRef={r => (keyboard.current = r)}
                        layoutName={layoutName}
                        onKeyPress={onKeyPress}
                    />}
                <div>
                    <h3>Output</h3>
                    <Output errorHighlighting={errorHighlighting}
                            aggressiveErrorHighlighting={aggressiveErrorHighlighting} output={output}/>
                </div>
            </div>
        </>
    );
}

export default App
