import { AIClientError } from '@/lib/ai/aiClient';

function stripBom(content: string) {
  return content.replace(/^\uFEFF/, '').trim();
}

function stripMarkdownCodeBlock(content: string) {
  const trimmed = stripBom(content);

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return stripBom(fencedMatch[1]);
  }

  return trimmed;
}

function extractJsonObject(content: string) {
  const stripped = stripMarkdownCodeBlock(content);

  if (stripped.startsWith('{') && stripped.endsWith('}')) {
    return stripped;
  }

  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return stripped.slice(firstBrace, lastBrace + 1).trim();
  }

  return stripped;
}

/**
 * Best-effort repairs for common LLM JSON deviations.
 * Each repair is only accepted when JSON.parse succeeds afterwards.
 */
function repairCommonJsonIssues(content: string) {
  return content
    // trailing commas: { "a": 1, } / [1, 2,]
    .replace(/,\s*([}\]])/g, '$1')
    // full-width quotes typed by CJK models
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // line comments some models insist on adding
    .replace(/^\s*\/\/.*$/gm, '')
    // literal control characters (e.g. raw newlines inside strings)
    .replace(/[\u0000-\u001F]+/g, ' ');
}

/**
 * Truncation repair: if the payload was cut off mid-JSON, walk backwards
 * over closing braces and return the longest prefix that parses as a
 * complete JSON value. Returns null when no prefix parses.
 */
function repairTruncatedJson(content: string) {
  const firstBrace = content.indexOf('{');

  if (firstBrace < 0) return null;

  let cursor = content.lastIndexOf('}');
  let attempts = 0;

  while (cursor > firstBrace && attempts < 60) {
    const candidate = content.slice(firstBrace, cursor + 1);

    try {
      return JSON.parse(candidate);
    } catch {
      const next = content.lastIndexOf('}', cursor - 1);

      if (next < 0 || next >= cursor) break;

      cursor = next;
      attempts += 1;
    }
  }

  return null;
}

function tryParse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

export function parseAIJson<T>(content: string): T {
  const candidates = [stripBom(content), stripMarkdownCodeBlock(content), extractJsonObject(content)];
  const uniqueCandidates = Array.from(new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean)));

  for (const candidate of uniqueCandidates) {
    const direct = tryParse(candidate);

    if (direct !== undefined) return direct as T;

    const repaired = repairCommonJsonIssues(candidate);

    if (repaired !== candidate) {
      const repairedValue = tryParse(repaired);

      if (repairedValue !== undefined) return repairedValue as T;
    }
  }

  // Last resort for truncated payloads: longest parseable prefix.
  for (const candidate of uniqueCandidates) {
    const truncated = repairTruncatedJson(candidate);

    if (truncated !== null) return truncated as T;
  }

  throw new AIClientError('json_parse_error', 'AI provider returned invalid JSON');
}
