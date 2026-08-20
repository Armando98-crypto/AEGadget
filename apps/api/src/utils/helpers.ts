/**
 * Utilitários gerais — AE Gadget API
 */

/**
 * Formata um valor numérico em Kwanza angolano.
 * Exemplo: 1250000 -> "1.250.000,00 Kz"
 *
 * Nota: Usamos o formato europeu/angolano:
 * - Separador de milhares: ponto
 * - Separador decimal: vírgula
 */
export function formatarKwanza(valor: number): string {
  return valor.toLocaleString("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Valida formato de telefone angolano.
 * Aceita: +244XXXXXXXXX ou 9XXXXXXXXX
 */
export function validarTelefoneAngolano(telefone: string): boolean {
  const regex = /^(\+244|244)?9[1-9]\d{7}$/;
  return regex.test(telefone.replace(/\s/g, ""));
}

/**
 * Gera um slug URL-friendly a partir de um texto.
 * Exemplo: "Smartphones & Tablets" -> "smartphones-tablets"
 */
export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9]+/g, "-")     // Substituir caracteres especiais por hífen
    .replace(/(^-|-$)/g, "");         // Remover hífens no início e fim
}

/**
 * Converte string de preço para centavos (evitar problemas de ponto flutuante).
 * Exemplo: "1250.50" -> 125050
 */
export function parsePrecoCentavos(preco: string): number {
  return Math.round(parseFloat(preco) * 100);
}
