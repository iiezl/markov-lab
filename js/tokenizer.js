/**
 * Normalize whitespace.
 */
function normalize(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const punctuation = new Set([".", ",", "!", "?", ";", ":", ")", "]", "}", "…"]);
const opening = new Set(["(", "[", "{"]);

/**
 * Split text into word tokens while preserving punctuation.
 *
 * Example:
 * Hello, world!
 *
 * =>
 * ["Hello", ",", "world", "!"]
 */
function tokenize(text) {
  const normalized = normalize(text);

  if (!normalized.length) return [];

  return normalized.match(/[\p{L}\p{N}'’-]+|[.,!?;:()[\]{}"…-]/gu) ?? [];
}

/**
 * Convert tokens back into readable text.
 */
function untokenize(tokens) {
  if (!tokens.length) return "";

  let result = "";

  for (const token of tokens) {
    if (!result.length) {
      result += token;
      continue;
    }

    if (punctuation.has(token)) {
      result += token;
      continue;
    }

    if (opening.has(token)) {
      result += ` ${token}`;
      continue;
    }

    result += ` ${token}`;
  }

  return result;
}

/**
 * Random item.
 */
function random(array) {
  return array[Math.floor(Math.random() * array.length)];
}
