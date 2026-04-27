// Embedding provider abstraction.
// Default: @xenova/transformers (free, runs in Node.js).
// Switch to Voyage AI by setting EMBEDDING_PROVIDER=voyage in .env.local.

let _pipeline: ((texts: string[], options: Record<string, unknown>) => Promise<{ data: Float32Array[] }>) | null = null;

async function getXenovaPipeline() {
  if (!_pipeline) {
    const { pipeline, env } = await import("@xenova/transformers");
    env.cacheDir = ".cache/transformers";
    const model = process.env.EMBEDDING_MODEL ?? "Xenova/multilingual-e5-large";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipe = await (pipeline as any)("feature-extraction", model, { quantized: true });
    _pipeline = async (texts: string[], opts: Record<string, unknown>) => pipe(texts, opts);
  }
  return _pipeline;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const provider = process.env.EMBEDDING_PROVIDER ?? "xenova";

  if (provider === "voyage") {
    return embedVoyage(texts);
  }
  return embedXenova(texts);
}

export async function embedText(text: string): Promise<number[]> {
  const results = await embedTexts([text]);
  return results[0];
}

async function embedXenova(texts: string[]): Promise<number[][]> {
  const pipe = await getXenovaPipeline();
  const BATCH = 8;
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const output = await pipe(batch, { pooling: "mean", normalize: true });
    for (const vec of output.data) {
      all.push(Array.from(vec));
    }
  }
  return all;
}

async function embedVoyage(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set");
  const model = process.env.EMBEDDING_MODEL ?? "voyage-3";

  const BATCH = 128;
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: batch }),
    });
    if (!res.ok) throw new Error(`Voyage API error: ${res.status}`);
    const json = await res.json() as { data: Array<{ embedding: number[] }> };
    all.push(...json.data.map(d => d.embedding));
  }
  return all;
}
