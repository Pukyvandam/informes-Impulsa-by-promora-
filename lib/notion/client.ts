import { Client } from "@notionhq/client";

let _client: Client | null = null;

export function getNotionClient(): Client {
  if (!_client) {
    if (!process.env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not set");
    _client = new Client({ auth: process.env.NOTION_API_KEY });
  }
  return _client;
}

// ── Property extractors ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionProp = any;

export function extractTitle(prop: NotionProp): string {
  return prop?.title?.map((t: NotionProp) => t.plain_text).join("") ?? "";
}

export function extractRichText(prop: NotionProp): string | null {
  const text = prop?.rich_text?.map((t: NotionProp) => t.plain_text).join("") ?? "";
  return text || null;
}

export function extractSelect(prop: NotionProp): string | null {
  return prop?.select?.name ?? prop?.status?.name ?? null;
}

export function extractMultiSelect(prop: NotionProp): string[] {
  return prop?.multi_select?.map((s: NotionProp) => s.name) ?? [];
}

export function extractDate(prop: NotionProp): string | null {
  return prop?.date?.start ?? null;
}

export function extractUrl(prop: NotionProp): string | null {
  return prop?.url ?? null;
}

export function extractNumber(prop: NotionProp): number | null {
  return prop?.number ?? null;
}
