import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
// Dérive une clé de 32 octets depuis ENCRYPTION_KEY, quel que soit son format
// ou sa longueur (chaîne texte, hex, etc.). AES-256 exige exactement 32 octets.
const KEY = createHash("sha256")
  .update(process.env["ENCRYPTION_KEY"] ?? "")
  .digest();

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, encryptedHex] = payload.split(":") as [string, string, string];
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encryptedHex, "hex")).toString("utf8") + decipher.final("utf8");
}
