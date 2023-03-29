import React, {useRef, useState} from 'react'
import Keyboard from 'react-simple-keyboard'
import "react-simple-keyboard/build/css/index.css";
import CodeEditor from '@uiw/react-textarea-code-editor';

function App() { // god awful code, but it works lmao
    const [layoutName, setLayoutName] = useState("default");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const keyboard = useRef<any>(null);
    const runScript = async (code: string) => {
        /*
        const pyodide = await window.loadPyodide({
            indexURL : "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/"
        });
        console.log({pyodide})
        return pyodide.runPython(code);
         */
        console.log("Running python code", code);
        // @ts-ignore
        return await runPython(code);
    }
    const onChange = (input: string) => {
        /*
        setInput(input);
        onChangeInput({target: {value: input}})
        // call the keyup event
        // @ts-ignore
        // document.getElementById("output").dispatchEvent(new KeyboardEvent("keyup", {key: input}));
        console.log("Input changed", input);
         */
    };

    const onKeyPress = (button: string) => {
        console.log("Button pressed", button);

        /**
         * If you want to handle the shift and caps lock buttons
         */
        if (button === "{shift}" || button === "{lock}") {
            handleShift();
            return;
        }
        if (button === "{enter}") {
            setInput(input + "\n");
            return;
        }
        if (button === "{tab}") {
            setInput(input + "  ");
            return;
        }
        if (button === "{bksp}") {
            setInput(input.slice(0, -1));
            return;
        }

        setInput(input + button);
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
                <p id={"output"}>{output}</p>
            </div>
        </div>
    );
}

export default App
