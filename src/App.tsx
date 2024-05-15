import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { io } from "socket.io-client";
import twaddle from "./assets/twaddle.svg";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { VscDebugContinueSmall } from "react-icons/vsc";
import { TbPrompt } from "react-icons/tb";
import { AiOutlineClear, AiOutlineCopy, AiOutlineSend } from "react-icons/ai";
import {
  Button,
  Col,
  Collapse,
  Container,
  Form,
  InputGroup,
  Navbar,
  ProgressBar,
  Row,
  Spinner,
  Stack,
  ThemeProvider,
} from "react-bootstrap";

type Status =
  | "error"
  | "expired"
  | "solved"
  | "generating"
  | "Generation complete.";

function App() {
  const [waiting, setWaiting] = useState<boolean>(false);
  const [jibberish, setJibberish] = useState<{
    output: string;
  }>({ output: "" });
  const [prompt, setPrompt] = useState<string>("");
  const [currTfTokens, setCurrTfTokens] = useState<number>(0);
  const tfTokens = import.meta.env.VITE_APP_TF_TOKENS;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const placeholders = [
    "The road ahead is long",
    "I took the Red Pill, but now I have to live the Blue Pill life",
    "I am a robot",
    "What if I told you",
    "The Matrix is a system, Neo",
    "I know Kung Fu",
  ];

  const randomPlaceholder = () => {
    if (waiting) return;
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  };

  const clearOutput = () => {
    setPrompt("");
    setJibberish({ output: "" });
    setCurrTfTokens(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jibberish.output).then(
      function () {
        console.log("Copying to clipboard was successful!");
      },
      function (err) {
        console.error("Could not copy text: ", err);
      }
    );
  };

  const SpinnerStack = () => {
    return (
      <Stack direction="horizontal" gap={5}>
        <div className="mx-auto">
          <Spinner className="m-1" animation="border" variant="primary" />
          <Spinner className="m-1" animation="border" variant="primary" />
          <Spinner className="m-1" animation="border" variant="primary" />
        </div>
      </Stack>
    );
  };

  const postJibberish = async (inputText: string) => {
    const socket = io(import.meta.env.VITE_APP_BACKEND, {
      query: {
        auth: import.meta.env.VITE_APP_BACKEND_AUTH,
      },
      timeout: 30000,
    });

    setJibberish({
      output: inputText,
    });

    socket.on("connect", () => {
      console.log("Connected to twaddle-backend.");
      setJibberish({ output: ` ${inputText}` });
      socket.emit("generate", { input: inputText, max_length: 100 });
    });

    socket.on("generated", (data: { output: string; generated: string }) => {
      if (
        data.output === "Generation complete." ||
        data.output === "<|endoftext|>"
      ) {
        setCurrTfTokens(tfTokens);
        setStatus("Generation complete.");
        return;
      }

      setJibberish((currentJibberish) => ({
        ...currentJibberish,
        output: currentJibberish.output + data.output,
      }));

      setCurrTfTokens((currTfTokens) => currTfTokens + 1);
      setStatus("generating");
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [jibberish.output]);

  useEffect(() => {
    if (status === "solved" && promptRef.current) {
      promptRef.current.focus();
    }
  }, [status]);

  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });

    workerRef.current.onmessage = (event: any) => {
      const message = event.data;
      switch (message.type) {
        case "update":
          console.log(message.data);
          break;
        case "download":
          if (message.data.status === "initiate") {
            console.log("Download initiated");
            console.log(message.data.name);
            console.log(message.data.file);
            addProgressBar(message.data.file);
          } else {
            switch (message.data.status) {
              case "progress":
                console.log(message.data.progress.toFixed(2) + "%");
                updateProgress(
                  message.data.file,
                  message.data.progress.toFixed(2)
                );
                break;

              case "done":
                console.log("Download complete");
                removeProgressBar(message.data.file);
                break;

              case "ready":
                console.log("Worker ready");
                break;
            }
          }
          break;
      }
    };
  }, []);

  const handleGenerate = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        task: "text-generation",
        text: "The road ahead is long",
        generation: {
          max_length: 100,
          do_sample: true,
          top_k: 50,
          top_p: 0.95,
          temperature: 1,
          num_return_sequences: 1,
        },
      });
    }
  };

  function XenovaProgressBar({ id, value, onCompletion }) {
    useEffect(() => {
      if (value >= 100) {
        onCompletion(id);
      }
    }, [value, onCompletion, id]);
  
    return (
      <div style={{
          borderRadius: "10px",
          width: "100%",
          backgroundColor: "#ddd",
          position: "relative",
          marginBottom: "10px"
        }}>
        <div style={{
            borderRadius: "10px",
            height: "30px",
            width: `${value}%`,
            backgroundColor: "blue",
          }} />
        <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            color: "#fff",
          }}>
          <span>{id}</span>
          <span>{value}%</span>
        </div>
      </div>
    );
  }
  

  const [progressBars, setProgressBars] = useState([]);

  const addProgressBar = (id: string) => {
    const newBar = {
      id: id,
      progress: 0,
    };
    setProgressBars((prevBars) => [...prevBars, newBar]);
  };

  const updateProgress = (id: string, progress: string) => {
    setProgressBars((prevBars) =>
      prevBars.map((bar) =>
        bar.id === id ? { ...bar, progress: Math.floor(parseFloat(progress)) } : bar
      )
    );
  };

  const removeProgressBar = (id: string) => {
    setProgressBars((prevBars) => prevBars.filter((bar) => bar.id !== id));
  };

  return (
    <ThemeProvider
      breakpoints={["xxxl", "xxl", "xl", "lg", "md", "sm", "xs", "xxs"]}
      minBreakpoint="xxs"
    >
      <Navbar bg="dark" data-bs-theme="dark" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">
            <img
              alt=""
              src={twaddle}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{" "}
            Twaddle
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <Row className="text-center">
          <h1 style={{ color: "#fff" }}>Twaddle</h1>
          <Collapse in={jibberish.output.length == 0}>
            <p style={{ color: "#fff" }}>
              Generate gibberish using the distilGP2 model
              <br />
              Enter a prompt and press enter to generate gibberish
            </p>
          </Collapse>
        </Row>
        <Row>
          <Col xs={8} md={8} className="mx-auto mb-3 mt-2">
            <SwitchTransition>
              <CSSTransition
                key={jibberish.output.length >= 1 ? "Form" : "Img"}
                timeout={250}
                classNames="fade"
              >
                {jibberish.output.length >= 1 ? (
                  <Form.Control
                    className="mb-2"
                    as="textarea"
                    style={{
                      height: "450px",
                      resize: "none",
                      color: "#fff",
                      backgroundColor: "#6c757d",
                    }}
                    value={jibberish.output}
                    ref={textareaRef}
                    readOnly
                  />
                ) : (
                  <>
                    {waiting && <SpinnerStack />}
                    <img src={twaddle} alt="200" width="100%" />
                  </>
                )}
              </CSSTransition>
            </SwitchTransition>

            <Collapse in={jibberish.output.length >= 1}>
              <ProgressBar
                variant={
                  (currTfTokens / tfTokens) * 100 === 100 ? "success" : "info"
                }
                now={(currTfTokens / tfTokens) * 100}
              />
            </Collapse>

            {(currTfTokens / tfTokens) * 100 === 100 && (
              <Stack direction="horizontal" gap={3}>
                <div className="p-2 mx-auto">
                  <Button
                    onClick={() => {
                      setCurrTfTokens(0);
                      postJibberish(jibberish.output);
                    }}
                  >
                    Continue <VscDebugContinueSmall size={20} />
                  </Button>
                </div>
                <div className="p-2 mx-auto">
                  <Button onClick={copyToClipboard}>
                    Copy <AiOutlineCopy size={20} />
                  </Button>
                </div>
                <div className="p-2 mx-auto">
                  <Button
                    onClick={() => {
                      setWaiting(false);
                      clearOutput();
                    }}
                  >
                    Clear <AiOutlineClear size={20} />
                  </Button>
                </div>
              </Stack>
            )}
          </Col>
        </Row>
        <Row>
          <Col xs={8} md={8} className="mx-auto">
            <InputGroup className="mb-2 mx-auto">
              <InputGroup.Text>
                <TbPrompt size={30} />
              </InputGroup.Text>
              <Form.Control
                ref={promptRef}
                disabled={status === "generating"}
                as="textarea"
                aria-label="With textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setWaiting(true);
                    postJibberish(prompt);
                    clearOutput();
                  }
                }}
                placeholder={randomPlaceholder()}
                style={{
                  resize: "none",
                  color: "#fff",
                  backgroundColor: "#40414f",
                }}
              />
              <Button
                disabled={status === "generating"}
                onClick={() => {
                  setWaiting(true);
                  postJibberish(prompt);
                  clearOutput();
                }}
                variant="secondary"
                id="button-addon2"
              >
                <AiOutlineSend size={20} />
              </Button>
              <Button onClick={handleGenerate}>Generate</Button>
            </InputGroup>
            {progressBars.map((bar) => (
              <XenovaProgressBar
                key={bar.id}
                id={bar.id}
                value={bar.progress}
                onCompletion={removeProgressBar}
              />
            ))}
          </Col>
        </Row>
      </Container>
    </ThemeProvider>
  );
}

export default App;
