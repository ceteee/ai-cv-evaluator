const cleanserPhaseOne = (text) => {
  return text
    .replace(/[•◦▪]/g, "")
    .replace(/s*--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/^\s*\d+\.\s*$/gm, "")
    .replace(/\b\d+\.\s*(?=\d+\.)/g, "")
    .replace(/\r?\n+/g, "\n")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .trim();
};

const cleanserPhaseTwo = (text) => {
  return text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const escapeRegex = (arrayExpression) => {
  return arrayExpression
    .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
};

export { cleanserPhaseOne, cleanserPhaseTwo, escapeRegex };
