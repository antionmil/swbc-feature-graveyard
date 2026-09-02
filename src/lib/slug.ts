/** Short, url-safe, unguessable. No vowels, so it cannot accidentally spell
 *  something. Shared by the server and any client that needs to build a link. */
const ALPHABET = "bcdfghjkmnpqrstvwxyz23456789";

export function newSlug(len = 7) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return Array.from(b, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

export const isSlug = (s: unknown): s is string =>
  typeof s === "string" && /^[bcdfghjkmnpqrstvwxyz2-9]{5,12}$/.test(s);
