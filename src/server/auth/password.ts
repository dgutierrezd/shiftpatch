import bcrypt from "bcryptjs";

const COST = 10;
let dummyHash: Promise<string> | null = null;

/**
 * Always runs one bcrypt comparison — against a throwaway hash when the email is unknown —
 * so response time doesn't reveal which emails exist.
 */
export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  const target = hash ?? (await (dummyHash ??= bcrypt.hash("not-a-real-password", COST)));
  const ok = await bcrypt.compare(password, target);
  return hash !== null && ok;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}
