// Máscara de telefone BR sem impedir colar. Aceita 10 ou 11 dígitos.
export function formatBRPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidBRPhone(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}
