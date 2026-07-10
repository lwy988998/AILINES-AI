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

function repairCommonJsonIssues(content: string) {
  return content
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

export function parseAIJson<T>(content: string): T {
  const candidates = [stripBom(content), stripMarkdownCodeBlock(content), extractJsonObject(content)];
  const uniqueCandidates = Array.from(new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean)));

  for (const candidate of uniqueCandidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      const repaired = repairCommonJsonIssues(candidate);

      if (repaired !== candidate) {
        try {
          return JSON.parse(repaired) as T;
        } catch {
          // Try the next candidate.
        }
      }
    }
  }

  throw new AIClientError('json_parse_error', 'AI provider returned invalid JSON');
}
