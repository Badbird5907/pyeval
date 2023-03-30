import React, {useEffect, useRef, useState} from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';

function App() { // god awful code, but it works lmao
    const [layoutName, setLayoutName] = useState("default");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const keyboard = useRef<any>(null);
    const textArea = useRef<HTMLTextAreaElement>(null);

    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);

    const [lastInput, setLastInput] = useState<number>(-1);

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
                    await setInput(input.substring(0, input.length - 1)); // remove the last character
                    await resetSelections();
                    return;
                }
                console.log("We are not selecting text");
                const before = input.substring(0, selectionStart); // get the text before the selection
                const after = input.substring(selectionEnd); // get the text after the selection
                await setInput(before + inputStr + after); // set the input to the text before the selection + the input + the text after the selection
                await resetSelections();
                return; // we don't need to reset the selections because we are not selecting text
            }
        } else {
            await setInput(input + inputStr);
        }
        await resetSelections();
    }

    const onKeyPress = async (button: string) => {
        console.log("Button pressed", button);

        /**
         * If you want to handle the shift and caps lock buttons
         */
        if (button === "{shift}" || button === "{lock}") {
            handleShift();
            return;
        }
        /*
        if (button === "{enter}") {
            setInput(input + "\n");
            return;
        }
        if (button === "{tab}") {
            setInput(input + "  ");
            return;
        }
        if (button === "{space}") {
            setInput(input + " ");
            return;
        }
        if (button === "{bksp}") {
            setInput(input.slice(0, -1));
            return;
        }

        setInput(input + button);
         */
        await addInput(button);
        setLastInput(Date.now());
    };

    const handleShift = () => {
        setLayoutName(layoutName === "default" ? "shift" : "default");
    };

    const onChangeInput = async (event: any) => {
        const input = event.target.value;
        setInput(input);
        keyboard.current?.setInput(input);
        const out = await runScript(input);
        setOutput(out);
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
        }}>
            {/*
            <textarea
                rows={20}
                style={{
                    width: "90vw",
                }}
                value={input}
                placeholder={"Enter python code here..."}
                onChange={onChangeInput}
            />
            */}
            <p>Note: Tab = 2 spaces</p>
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
            <Keyboard
                keyboardRef={r => (keyboard.current = r)}
                layoutName={layoutName}
                onKeyPress={onKeyPress}
            />
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
    );
}

export default App
