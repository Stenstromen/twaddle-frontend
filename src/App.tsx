import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs";
//import '@tensorflow/tfjs-converter';
import { Tokenizer } from "tokenizers";
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
  Stack,
  ThemeProvider,
} from "react-bootstrap";
//import { encode, decode } from "gpt-tokenizer";

function App() {


  useEffect(() => {
    async function loadTokenizerAndModel() {
      try {
        // Load the tokenizer (vocab.json)
        const vocabResponse = await fetch("/model/vocab.json");
        if (!vocabResponse.ok) {
          throw new Error("HTTP error " + vocabResponse.status);
        }
        const vocab = await vocabResponse.json();
  
        // Create reverse vocab for decoding
        let reverseVocab = {};
        for (let char in vocab) {
          reverseVocab[vocab[char]] = char;
        }
  
        // Encoding function
        function encode(text) {
          let encoded = [];
          for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (vocab[char] !== undefined) {
              encoded.push(vocab[char]);
            } else {
              encoded.push(vocab["<UNK>"]); // replace <UNK> with your unknown character token
            }
          }
          return encoded;
        }
  
        // Decoding function
        function decode(ids) {
          let decoded = "";
          for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            if (reverseVocab[id] !== undefined) {
              decoded += reverseVocab[id];
            } else {
              decoded += "<UNK>"; // replace <UNK> with your unknown character token
            }
          }
          return decoded;
        }
  
        // Load the model (model.json)
        const model = await tf.loadGraphModel("/model/model.json");
  
        // Continue with the rest of your code...
        const text = "meow";
        const tokenLimit = 20;
  
        // Encode text into tokens
        const tokens = encode(text);
  
        // Truncate tokens to tokenLimit
        const truncatedTokens = tokens.slice(0, tokenLimit);
  
        // Decode tokens back to text
        const decodedText = decode(truncatedTokens);
  
        // Now that the tokenizer and model are loaded, you can use them for prediction.
  
        // More of your code...

        const output = model.predict({
          input_ids: tf.tensor2d([tokens], [1, tokens.length], "int32"),
          attention_mask: tf.tensor2d(
            [Array(tokens.length).fill(1)],
            [1, tokens.length],
            "int32"
          ),
          token_type_ids: tf.tensor2d(
            [Array(tokens.length).fill(1)],
            [1, tokens.length],
            "int32"
          ),
        });

        console.log(output);
        const outputArray = await output[0].array();
        console.log(outputArray);

        // For each token in the sequence, select the token ID with the highest probability
        const predictedTokenIds = outputArray[0].map(
          (tokenProbabilities: number[]) =>
            tokenProbabilities.indexOf(Math.max(...tokenProbabilities))
        );

        console.log(predictedTokenIds);

        // Decode token IDs back to text
        const decodedOutput = decode(predictedTokenIds);
        console.log(decodedOutput);
  
      } catch (error) {
        console.error("An error occurred while fetching the vocab.json file or loading the model:", error);
      }
    }
  
    loadTokenizerAndModel();
  }, []);
  

  useEffect(() => {
    async function loadModel() {
      fetch("/model/vocab.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error("HTTP error " + response.status);
          }
          return response.json();
        })
        .then((json) => {
          // Now you have your vocabulary
          const vocab = json;

          // Create reverse vocab for decoding
          let reverseVocab = {};
          for (let char in vocab) {
            reverseVocab[vocab[char]] = char;
          }

          // Encoding function
          function encode(text) {
            let encoded = [];
            for (let i = 0; i < text.length; i++) {
              let char = text[i];
              if (vocab[char] !== undefined) {
                encoded.push(vocab[char]);
              } else {
                encoded.push(vocab["<UNK>"]); // replace <UNK> with your unknown character token
              }
            }
            return encoded;
          }

          // Decoding function
          function decode(ids) {
            let decoded = "";
            for (let i = 0; i < ids.length; i++) {
              let id = ids[i];
              if (reverseVocab[id] !== undefined) {
                decoded += reverseVocab[id];
              } else {
                decoded += "<UNK>"; // replace <UNK> with your unknown character token
              }
            }
            return decoded;
          }
          const model = tf.loadGraphModel("/model/model.json");

          const text = "Generate gibberish using the";
          const tokenLimit = 20;

          // Encode text into tokens
          const tokens = encode(text);

          // Truncate tokens to tokenLimit
          const truncatedTokens = tokens.slice(0, tokenLimit);

          // Decode tokens back to text
          const decodedText = decode(truncatedTokens);

          console.log(tokens);

          const output = model.predict({
            input_ids: tf.tensor2d([tokens], [1, tokens.length], "int32"),
            attention_mask: tf.tensor2d(
              [Array(tokens.length).fill(1)],
              [1, tokens.length],
              "int32"
            ),
            token_type_ids: tf.tensor2d(
              [Array(tokens.length).fill(1)],
              [1, tokens.length],
              "int32"
            ),
          });

          const outputArray = output[0].array();
          console.log(outputArray);

          // For each token in the sequence, select the token ID with the highest probability
          const predictedTokenIds = outputArray[0].map(
            (tokenProbabilities: number[]) =>
              tokenProbabilities.indexOf(Math.max(...tokenProbabilities))
          );

          console.log(predictedTokenIds);

          // Decode token IDs back to text
          const decodedOutput = decode(predictedTokenIds);
          console.log(decodedOutput);

          //console.log(output[0].shape);
          console.log(tokens);
          console.log(decodedText);
          /*       const decodedOutput = decode(output[0].shape);
          console.log(decodedOutput); */

          console.log(outputArray);
        })
        .catch(function () {
          console.log("Error while fetching the vocab.json file.");
        });
    }

    loadModel();
  }, []);

  /*   const loadModel = async () => {
    const model = await tf.loadGraphModel('/model/model.json');
    return model;
  };

  const [modelLoaded, setModelLoaded] = useState(false);



  const [generatedText, setGeneratedText] = useState('');

  useEffect(() => {
    const fetchModelAndTokenizer = async () => {
      const model = await tf.loadLayersModel('/model/model.json');
      const tokenizer = await fetchTokenizer('/model/tokenizer.json');
      return { model, tokenizer };
    };

    const fetchTokenizer = async (tokenizerPath: RequestInfo | URL) => {
      const [tokenizerJson, vocabJson] = await Promise.all([
        fetch(tokenizerPath).then(response => response.json()),
        fetch('/model/vocab.json').then(response => response.json())
      ]);

      const tokenizer = new Tokenizer(vocabJson);
      await tokenizer.fromJSON(JSON.stringify(tokenizerJson));
      return tokenizer;
    };

    const generateText = async (model, tokenizer) => {
      const seedText = 'Input your seed text here';
    
      const MAX_LENGTH = 100;
      const temperature = 0.6;
    
      const tokenizedSeed = tokenizer.encode(seedText);
      let input = tf.tensor2d([tokenizedSeed], [1, tokenizedSeed.length]); // Adjust the shape based on the model's input requirements
    
      const generatedTokens = [];
    
      for (let i = 0; i < MAX_LENGTH; i++) {
        const logits = model.predict(input);
        const sampledTokenIndex = tf.multinomial(logits.div(temperature), 1).dataSync()[0];
        generatedTokens.push(sampledTokenIndex);
        input.dispose(); // Dispose the input tensor to avoid memory leaks
        input = tf.tensor2d([generatedTokens], [1, generatedTokens.length]); // Update the input tensor for the next iteration
      }
    
      const generatedText = tokenizer.decode(generatedTokens);
      return generatedText;
    };

    const generate = async () => {
      const { model, tokenizer } = await fetchModelAndTokenizer();
      const generatedText = await generateText(model, tokenizer);
      setGeneratedText(generatedText);
    };

    generate();
  }, []);

  console.log(modelLoaded);
  console.log(generatedText); */

  /*   async function poop() {
    async function loadModel() {
      const model = await tf.loadGraphModel("/model/model.json");
      return model;
    }
  
    async function loadVocab() {
      const response = await fetch(
        "/model/vocab.json"
      );
      const vocab = await response.json();
      return vocab;
    }
  
    async function loadTokenizer() {
      const response = await fetch('/model/tokenizer.json');
      const tokenizerData = await response.json();
      const vocabResponse = await fetch('/model/vocab.json');
      const vocab = await vocabResponse.json();
      return new Tokenizer(tokenizerData, vocab);
    }
  
    class Tokenizer {
      constructor(tokenizerData, vocab) {
        this.tokenizerData = tokenizerData;
        this.vocab = vocab;
      }
    
      encode(text) {
        // Perform your text encoding here based on the loaded tokenizer data.
        // This will be specific to the tokenizer you're using.
        let ids = [];
        for (let i = 0; i < text.length; i++) {
          const token = this.vocab[text[i]];
          if (token !== undefined) {
            ids.push(token);
          }
        }
        return ids;
      }
  
      decode(tokens) {
        let text = "";
        for (let token of tokens) {
          if (token in this.reverseVocab) {
            text += this.reverseVocab[token];
          }
        }
        return text;
      }
    }

    const [model, vocab, tokenizer] = await Promise.all([
      loadModel(),
      loadVocab(),
      loadTokenizer(),
    ]);

    const inputText = "Hello, world!";
    const inputIds = tokenizer.encode(inputText);
    console.log(inputIds);
    const inputTensor = tf.tensor2d([inputIds], undefined, 'int32');
    console.log(inputTensor);
    const attentionMask = tf.tensor2d([Array(inputIds.length).fill(1)], undefined, 'int32');
    console.log(attentionMask);
    const attentionMask2D = attentionMask.reshape([1, -1]);  // Reshape it into a 2D tensor, ensuring the new shape is an array
    
    const tokenTypeIds = tf.tensor2d([Array(inputIds.length).fill(1)], undefined, 'int32');
    const tokenTypeIds2D = tokenTypeIds.reshape([-1, inputIds.length]);
    
    const outputTensor = model.execute({ input_ids: inputTensor, attention_mask: attentionMask2D, token_type_ids: tokenTypeIds2D }, ['Identity:0']);
    
    
    // Decode the output tensor
    const outputIds = Array.from(outputTensor.argMax(-1).dataSync());
    console.log(outputIds);

    const outputIdsArray = Array.from(outputIds);
    const outputText = tokenizer.decode(outputIdsArray);
    
    console.log(outputText);
  }

  useEffect(() => {
    poop();
  }, []); */

  const [jibberish, setJibberish] = useState<{
    output: string;
  }>({ output: "" });
  const [prompt, setPrompt] = useState<string>("");
  const [currTfTokens, setCurrTfTokens] = useState<number>(0);
  const tfTokens = import.meta.env.VITE_APP_TF_TOKENS;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const postJibberish = async (inputText: string, count = 0) => {
    // Base case for the recursion. If count is 100, stop the recursion.
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

      // Recursive call with the updated output and incremented count
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
                  <img src={twaddle} alt="200" width="100%" />
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
                  <Button onClick={clearOutput}>
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
                    postJibberish(prompt);
                    clearOutput();
                  }
                }}
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
