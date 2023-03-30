import React, {useEffect, useRef, useState} from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';
import {Button, FormControlLabel, FormGroup, Stack, Switch} from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import './App.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() { // god awful code, but it works lmao
    const [layoutName, setLayoutName] = useState("default");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const keyboard = useRef<any>(null);
    const textArea = useRef<HTMLTextAreaElement>(null);

    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);

    const [autoRun, setAutoRun] = useState(false);
    const [enableKeyboard, setEnableKeyboard] = useState(true);

    useEffect(() => { // We need this code because clicking on the keyboard (outside of the textarea) makes us lose the current selection, so we need to store that
        // listen for changes to textarea.selectionStart and textarea.selectionEnd, kinda hacky
        if (!textArea) return;
        function checkSelection() {
            if (textArea.current?.selectionStart && textArea.current?.selectionEnd) {
                setSelectionStart(textArea.current.selectionStart);
                setSelectionEnd(textArea.current.selectionEnd);
            }
        }
        textArea.current?.addEventListener("click", () => { // whenever we click inside the textarea
            console.log("Clicked inside textarea");
            checkSelection();
        });
        textArea.current?.addEventListener("keyup", () => { // whenever we press a key inside the textarea
            console.log("Keyup inside textarea");
            checkSelection();
        });
    }, [textArea]);

    useEffect(() => {
        console.log("Selection changed", selectionStart, selectionEnd);
    }, [selectionStart, selectionEnd])

    const runScript = async (code: string) => {
        console.log("Running python code", code);
        // @ts-ignore
        return await runPython(code);
    }
    const addInput = async (inputStr: string) => {
        async function resetSelections() {
            console.log("Resetting selections");
            // WE ARE AWAITING THIS BECAUSE WE NEED TO WAIT FOR THE STATE TO UPDATE BEFORE WE CAN USE IT IDK IF IT ACTUALLY WORKS BUT I'VE GOTTEN RACE CONDITIONS BEFORE AND I REALLY DONT WANT TO WORK THAT OUT AAAAAAAAAAAAAAAAAAAA
            await setSelectionStart(input.length + 1); // update the selection
            await setSelectionEnd(input.length + 1);
        }
        if (inputStr === "{tab}") {
            inputStr = "  ";
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
                console.log("Selection start is out of bounds, resetting to end");
                await resetSelections();
            }
            if (selectionEnd < 0 || selectionEnd > input.length) {
                console.log("Selection end is out of bounds, resetting to end");
                await resetSelections();
            }
            const hasSelection = selectionStart !== selectionEnd; // are we selecting text? or just typing?
            if (hasSelection) {
                console.log("We are selecting text");
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
                console.log("We are not selecting text");
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

    const exec = async () => {
        const out = await runScript(input);
        setOutput(out);
    }

    const onKeyPress = async (button: string) => {
        console.log("Button pressed", button);
        if (button === "{shift}" || button === "{lock}") {
            handleShift();
            return;
        }
        await addInput(button);
        if (autoRun) {
            await exec();
        }
    };

    const handleShift = () => {
        setLayoutName(layoutName === "default" ? "shift" : "default");
    };

    const onChangeInput = async (event: any) => {
        const input = event.target.value;
        setInput(input);
        keyboard.current?.setInput(input);
        if (autoRun) {
            await exec();
        }
    };

    return (
       <>
           <div>
               <p>Note: Tab = 2 spaces</p>
               <Stack direction={"row"} spacing={2}>
                   <FormGroup>
                       <FormControlLabel control={<Switch checked={autoRun} onChange={() => {
                            setAutoRun(!autoRun);
                       }} />} label="Auto Run" />
                   </FormGroup>
                   <FormGroup>
                       <FormControlLabel control={<Switch checked={enableKeyboard} onChange={() => {
                            setEnableKeyboard(!enableKeyboard);
                       }} />} label="Keyboard" />
                   </FormGroup>
                   <Button
                          variant="contained"
                            color="success"
                            onClick={exec}
                          endIcon={<PlayArrowIcon />}
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
                   <p id={"output"}>
                       {/* Replace newlines with <br/> */}
                       {output.split("\n").map((item, key) => {
                           return <span key={key}>{item}<br/></span>
                       })}
                   </p>
               </div>
           </div>
       </>
    );
}

export default App
