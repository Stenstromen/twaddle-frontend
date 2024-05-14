import { pipeline, env } from "@xenova/transformers";
env.allowLocalModels = false;

self.addEventListener("message", async (event) => {
  const data = event.data;

  if (!text_generation) return;

  let result = await text_generation(data);
  self.postMessage({
    task: data.task,
    type: "result",
    data: result,
  });
});
class PipelineFactory {
  static task = null;
  static model = null;

  static instance = null;

  constructor(tokenizer, model) {
    this.tokenizer = tokenizer;
    this.model = model;
  }

  /**
   * @param {*} progressCallback
   * @returns {Promise}
   */
  static getInstance(progressCallback = null) {
    if (this.task === null || this.model === null) {
      throw Error("Must set task and model");
    }
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback: progressCallback,
      });
    }

    return this.instance;
  }
}

class TextGenerationPipelineFactory extends PipelineFactory {
  static task = "text-generation";
  static model = "Xenova/distilgpt2";
}

async function text_generation(data) {
  let pipeline = await TextGenerationPipelineFactory.getInstance((data) => {
    self.postMessage({
      type: "download",
      task: "text-generation",
      data: data,
    });
  });

  let text = data.text.trim();

  return await pipeline(text, {
    ...data.generation,
    callback_function: function (beams) {
      const decodedText = pipeline.tokenizer.decode(beams[0].output_token_ids, {
        skip_special_tokens: true,
      });

      self.postMessage({
        type: "update",
        target: data.elementIdToUpdate,
        data: decodedText,
      });
    },
  });
}
