export interface Turn {
  speaker: string;
  text: string;
  timestamp?: string;
}

// Patterns for transcript timestamps like [00:01:23] or (00:01:23)
const TIMESTAMP_RE = /[\[(]\d{1,2}:\d{2}(?::\d{2})?[\])]\s*/g;

// Known filler patterns in Spanish transcripts
const FILLER_RE = /\b(eh+|ah+|um+|mm+|hmm+|bueno+|entonces+|o sea|¿no\?)\b/gi;

export function normalizeTranscript(raw: string): Turn[] {
  const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const turns: Turn[] = [];
  let currentSpeaker = "Desconocido";
  let currentText: string[] = [];
  let currentTimestamp: string | undefined;

  const flush = () => {
    if (currentText.length) {
      turns.push({
        speaker: currentSpeaker,
        text: currentText.join(" ").trim(),
        timestamp: currentTimestamp,
      });
      currentText = [];
      currentTimestamp = undefined;
    }
  };

  for (const line of lines) {
    // Extract timestamp if present
    const tsMatch = line.match(/[\[(](\d{1,2}:\d{2}(?::\d{2})?)[\])]/);
    const cleanLine = line.replace(TIMESTAMP_RE, "").trim();

    // Speaker line: "Nombre:" or "NOMBRE:" at the start
    const speakerMatch = cleanLine.match(/^([A-ZÁÉÍÓÚÜÑa-záéíóúüñ][^:]{0,40}):\s*(.*)$/);
    if (speakerMatch) {
      flush();
      currentSpeaker = speakerMatch[1].trim();
      currentTimestamp = tsMatch?.[1];
      const rest = speakerMatch[2].trim();
      if (rest) currentText.push(cleanWord(rest));
    } else if (cleanLine) {
      if (tsMatch) currentTimestamp = tsMatch[1];
      currentText.push(cleanWord(cleanLine));
    }
  }
  flush();
  return turns;
}

function cleanWord(text: string): string {
  return text
    .replace(FILLER_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function turnsToText(turns: Turn[]): string {
  return turns
    .map(t => `${t.speaker}: ${t.text}`)
    .join("\n");
}
