export type LocalRetrieval = {
  model: string;
  engine: string;
  ranked: Array<{ index: number; score: number }>;
};

type WorkerMessage =
  | { type: "status"; id: string; message: string }
  | { type: "progress"; event: unknown }
  | { type: "result"; id: string; model: string; engine: string; ranked: Array<{ index: number; score: number }> }
  | { type: "error"; id: string; error: string };

let worker: Worker | null = null;

function getWorker() {
  if (typeof window === "undefined") throw new Error("Local embeddings require a browser.");
  if (!worker) worker = new Worker("/hf-embedding-worker.js", { type: "module" });
  return worker;
}

export async function retrieveWithLocalHuggingFace(
  brief: string,
  samples: string[],
  onStatus?: (message: string) => void,
): Promise<LocalRetrieval> {
  const currentWorker = getWorker();
  const id = crypto.randomUUID();

  return new Promise<LocalRetrieval>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      currentWorker.removeEventListener("message", handleMessage);
      reject(new Error("Local embedding model did not finish in time."));
    }, 90_000);

    function cleanup() {
      window.clearTimeout(timeout);
      currentWorker.removeEventListener("message", handleMessage);
    }

    function handleMessage(event: MessageEvent<WorkerMessage>) {
      const message = event.data;
      if (message.type === "progress") return;
      if (!("id" in message) || message.id !== id) return;
      if (message.type === "status") {
        onStatus?.(message.message);
        return;
      }
      cleanup();
      if (message.type === "error") {
        reject(new Error(message.error));
        return;
      }
      resolve({ model: message.model, engine: message.engine, ranked: message.ranked });
    }

    currentWorker.addEventListener("message", handleMessage);
    currentWorker.postMessage({ id, brief, samples, topK: 4 });
  });
}
