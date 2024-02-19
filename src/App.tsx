import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { io } from "socket.io-client";
import twaddle from "./assets/twaddle.svg";
import { Turnstile } from "@marsidev/react-turnstile";
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
            </InputGroup>
            <Col className="d-flex justify-content-center mt-4 ml-4">
              <Turnstile
                siteKey="0x4AAAAAAAG6Mpom33s7omsj"
                onError={() => setStatus("error")}
                onExpire={() => setStatus("expired")}
                onSuccess={() => setStatus("solved")}
              />
            </Col>
          </Col>
        </Row>
      </Container>
    </ThemeProvider>
  );
}

export default App;
