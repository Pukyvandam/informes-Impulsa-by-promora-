import { Turn } from "./normalize";

export interface Chunk {
  contenido: string;
  posicion: number;
  metadatos: {
    speaker?: string;
    speakers: string[];
    tipo: "turno" | "parrafo";
  };
}

const MAX_TOKENS_APPROX = 700;   // ~4 chars per token
const OVERLAP_TOKENS_APPROX = 100;
const MAX_CHARS = MAX_TOKENS_APPROX * 4;
const OVERLAP_CHARS = OVERLAP_TOKENS_APPROX * 4;

// For transcripts: chunk by speaker turn, merge short turns, split long ones
export function chunkTranscript(turns: Turn[]): Chunk[] {
  const chunks: Chunk[] = [];
  let buffer: Turn[] = [];
  let bufferChars = 0;

  const flush = (overlap: Turn[] = []) => {
    if (!buffer.length) return;
    const text = buffer.map(t => `${t.speaker}: ${t.text}`).join("\n");
    const speakers = [...new Set(buffer.map(t => t.speaker))];
    chunks.push({
      contenido: text,
      posicion: chunks.length,
      metadatos: { speakers, tipo: "turno" },
    });
    // Keep last overlap_chars worth of turns for context
    buffer = buildOverlapBuffer(buffer, overlap);
    bufferChars = buffer.reduce((s, t) => s + t.text.length, 0);
  };

  for (const turn of turns) {
    const turnLen = turn.text.length;

    if (turnLen > MAX_CHARS) {
      // Long turn: split at sentence boundaries
      flush();
      const sentences = splitLongTurn(turn, MAX_CHARS, OVERLAP_CHARS);
      for (const s of sentences) {
        chunks.push({ contenido: s, posicion: chunks.length, metadatos: { speaker: turn.speaker, speakers: [turn.speaker], tipo: "turno" } });
      }
      buffer = [];
      bufferChars = 0;
      continue;
    }

    if (bufferChars + turnLen > MAX_CHARS && buffer.length) {
      flush(buffer.slice(-2)); // last 2 turns as overlap seed
    }

    buffer.push(turn);
    bufferChars += turnLen;
  }
  flush();
  return chunks;
}

// For written text (summaries, notes): chunk by paragraph
export function chunkText(text: string): Chunk[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let current = "";
  let pos = 0;

  for (const para of paragraphs) {
    if ((current + para).length > MAX_CHARS && current) {
      chunks.push({ contenido: current.trim(), posicion: pos++, metadatos: { speakers: [], tipo: "parrafo" } });
      // overlap: last sentence of previous chunk
      const lastSentence = current.split(/[.!?]/).slice(-2).join(". ").trim();
      current = lastSentence ? lastSentence + "\n\n" + para : para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current.trim()) {
    chunks.push({ contenido: current.trim(), posicion: pos, metadatos: { speakers: [], tipo: "parrafo" } });
  }
  return chunks;
}

function splitLongTurn(turn: Turn, maxChars: number, overlapChars: number): string[] {
  const prefix = `${turn.speaker}: `;
  const sentences = turn.text.split(/(?<=[.!?])\s+/);
  const parts: string[] = [];
  let current = prefix;

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current !== prefix) {
      parts.push(current.trim());
      const overlapText = current.slice(-overlapChars);
      current = prefix + overlapText + " " + sentence;
    } else {
      current += (current === prefix ? "" : " ") + sentence;
    }
  }
  if (current.trim() !== prefix.trim()) parts.push(current.trim());
  return parts;
}

function buildOverlapBuffer(buffer: Turn[], overlapSeed: Turn[]): Turn[] {
  let chars = 0;
  const result: Turn[] = [];
  for (const t of [...overlapSeed].reverse()) {
    if (chars + t.text.length > OVERLAP_CHARS) break;
    result.unshift(t);
    chars += t.text.length;
  }
  return result;
}
