// Numero de processo padrao SEI: 17 digitos no formato XXXXX.XXXXXX/XXXX-XX
// (5 digitos . 6 digitos / 4 digitos - 2 digitos)

import { onlyDigits } from "./cpf";

export function formatSei(s: string): string {
  const d = onlyDigits(s).slice(0, 17);
  if (d.length <= 5) return d;
  if (d.length <= 11) return `${d.slice(0, 5)}.${d.slice(5)}`;
  if (d.length <= 15)
    return `${d.slice(0, 5)}.${d.slice(5, 11)}/${d.slice(11)}`;
  return `${d.slice(0, 5)}.${d.slice(5, 11)}/${d.slice(11, 15)}-${d.slice(15)}`;
}

export function isValidSei(input: string): boolean {
  return onlyDigits(input).length === 17;
}
