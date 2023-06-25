import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import axios from "axios";

function App() {
  const [jibberish, setJibberish] = useState<{
    output: string;
  }>({ output: "" });
  const [prompt, setPrompt] = useState<string>("asd");

  const postJibberish = async (inputText: string, count = 0) => {
    
    // Base case for the recursion. If count is 100, stop the recursion.
    if (count >= 100) {
      return;
    }
  
    try {
      console.log(inputText)
      const res = await axios.post(import.meta.env.VITE_APP_BACKEND, {
        input: inputText,
      });
      
      const newOutput = inputText + res.data.output;
      setJibberish((jibberish) => ({
        ...jibberish,
        output: newOutput,
      }));
  
      // Recursive call with the updated output and incremented count
      postJibberish(newOutput, count + 1);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  };

  // When the component is mounted, start the recursive calls
  /*   useEffect(() => {
    postJibberish(prompt);
  }, []);  */

  /*   useEffect(() => {
    axios
      .post(import.meta.env.VITE_APP_BACKEND, { input: jibberish.output })
      .then((res) => {
        setJibberish((jibberish) => ({
          ...jibberish,
          output: res.data.output,
        }));
      });
  }, [postJibberish]); */

  return (
    <>
      <div>
        <h1>Jibberish</h1>
        <p
          dangerouslySetInnerHTML={{
            __html: jibberish.output.replace(/\n/g, "<br />"),
          }}
        />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={() => {
            postJibberish(prompt);
          }}
        >
          Jibberish
        </button>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
