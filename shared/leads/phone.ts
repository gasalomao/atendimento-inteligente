export function onlyDigits(v: string): string {
  return (v || "").replace(/\D+/g, "");
}

/** Normaliza para E.164 sem "+": ex. "5511999998888". Adiciona 55 se ausente. */
export function normalizeBRPhone(input: string): string {
  const d = onlyDigits(input);
  if (!d) return "";
  if (d.startsWith("55")) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export function maskPhoneForLog(phone: string): string {
  const d = onlyDigits(phone);
  if (d.length < 4) return "***";
  return `${d.slice(0, 4)}****${d.slice(-2)}`;
}

export function maskEmailForLog(email: string | null | undefined): string {
  if (!email) return "";
  const [u, dom] = email.split("@");
  if (!dom) return "***";
  return `${u.slice(0, 2)}***@${dom}`;
}
