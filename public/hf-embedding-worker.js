import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";

const MODEL = "Xenova/bge-small-en-v1.5";
let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL, {
      progress_callback: (event) => {
        self.postMessage({ type: "progress", event });
      },
    });
  }
  return extractorPromise;
}

function vectorsFromTensor(tensor) {
  const dims = tensor?.dims ?? [];
  const data = tensor?.data ? Array.from(tensor.data) : [];
  if (dims.length !== 2 || dims[0] < 1 || dims[1] < 1) {
    throw new Error("Unexpected embedding tensor shape.");
  }
  const [rows, width] = dims;
  const vectors = [];
  for (let row = 0; row < rows; row += 1) {
    vectors.push(data.slice(row * width, (row + 1) * width));
  }
  return vectors;
}

function dot(a, b) {
  let total = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) total += a[i] * b[i];
  return total;
}

self.onmessage = async (event) => {
  const { id, brief, samples, topK = 4 } = event.data ?? {};
  try {
    if (!id || typeof brief !== "string" || !Array.isArray(samples)) {
      throw new Error("Invalid embedding request.");
    }

    self.postMessage({ type: "status", id, message: "Loading local Hugging Face embedding model…" });
    const extractor = await getExtractor();
    self.postMessage({ type: "status", id, message: "Computing embeddings locally in your browser…" });

    const output = await extractor([brief, ...samples], { pooling: "mean", normalize: true });
    const vectors = vectorsFromTensor(output);
    if (vectors.length !== samples.length + 1) throw new Error("Embedding batch was incomplete.");

    const [query, ...sampleVectors] = vectors;
    const ranked = sampleVectors
      .map((vector, index) => ({ index, score: dot(query, vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(topK, samples.length));

    self.postMessage({
      type: "result",
      id,
      model: MODEL,
      engine: "Hugging Face Transformers.js · browser-local embeddings",
      ranked,
    });
  } catch (error) {
    self.postMessage({ type: "error", id, error: error instanceof Error ? error.message : "Local embedding failed." });
  }
};
