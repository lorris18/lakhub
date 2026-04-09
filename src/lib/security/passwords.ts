import { randomInt } from "crypto";

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_";
const ALL = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

function pick(characters: string) {
  return characters.charAt(randomInt(0, characters.length));
}

function shuffle(items: string[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    const current = result[index]!;
    result[index] = result[swapIndex]!;
    result[swapIndex] = current;
  }

  return result;
}

export function generateTemporaryPassword(length = 14) {
  if (length < 8) {
    throw new Error("Le mot de passe temporaire doit contenir au moins 8 caractères.");
  }

  const required = [pick(UPPERCASE), pick(LOWERCASE), pick(DIGITS), pick(SYMBOLS)];
  const remaining = Array.from({ length: length - required.length }, () => pick(ALL));

  return shuffle([...required, ...remaining]).join("");
}
