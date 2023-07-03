import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
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

function App() {
  const [waiting, setWaiting] = useState<boolean>(false);
  const [jibberish, setJibberish] = useState<{
    output: string;
  }>({ output: "" });
  const [prompt, setPrompt] = useState<string>("");
  const [currTfTokens, setCurrTfTokens] = useState<number>(0);
  const tfTokens = import.meta.env.VITE_APP_TF_TOKENS;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const postJibberish = async (inputText: string, count = 0) => {
    if (count !== tfTokens) {
      setCurrTfTokens(tfTokens);
    }

    if (count >= tfTokens) {
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_BACKEND}/generate`,
        {
          input: inputText,
        },
        {
          headers: {
            Authorization: import.meta.env.VITE_APP_BACKEND_AUTH,
          },
        }
      );

      if (res.data.output.includes("<|endoftext|>")) {
        return setCurrTfTokens(tfTokens);
      }

      const newOutput = inputText + res.data.output;
      setJibberish((jibberish) => ({
        ...jibberish,
        output: newOutput,
      }));

      postJibberish(newOutput, count + 1);
      setCurrTfTokens(count + 1);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [jibberish.output]);

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
                autoFocus
                disabled={
                  jibberish.output.length >= 1 && currTfTokens !== tfTokens
                }
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
                disabled={
                  jibberish.output.length >= 1 && currTfTokens !== tfTokens
                }
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
          </Col>
        </Row>
      </Container>
    </ThemeProvider>
  );
}

export default App;
