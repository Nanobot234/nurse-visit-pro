export const DEFAULT_PHONE_PREFIX = "+1";

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `${DEFAULT_PHONE_PREFIX}${digits}`;
  return `+${digits}`;
}

export function phoneAuthOptions(mode: "signin" | "signup", fullName: string) {
  return mode === "signup"
    ? { shouldCreateUser: true, data: { full_name: fullName.trim().slice(0, 100) } }
    : { shouldCreateUser: false };
}