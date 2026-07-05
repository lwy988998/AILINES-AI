function stripMarkdownCodeBlock(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return trimmed;
}

export function parseAIJson<T>(content: string): T {
  const cleanedContent = stripMarkdownCodeBlock(content);
  return JSON.parse(cleanedContent) as T;
}
