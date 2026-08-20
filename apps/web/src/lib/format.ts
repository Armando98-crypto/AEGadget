/**
 * Utilitários de formatação — AE Gadget Frontend
 *
 * Formatação de preços, datas e texto em português (Angola/Portugal).
 */

/**
 * Formata um valor numérico em Kwanza angolano.
 *
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
 * Formata uma data para o formato português.
 *
 * Exemplo: "19 de outubro de 2024"
 */
export function formatarData(data: string | Date): string {
  const date = typeof data === "string" ? new Date(data) : data;

  return date.toLocaleDateString("pt-AO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formata data e hora.
 *
 * Exemplo: "19/10/2024 às 14:30"
 */
export function formatarDataHora(data: string | Date): string {
  const date = typeof data === "string" ? new Date(data) : data;

  return date.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Trunca texto e adiciona "..." se for demasiado longo.
 */
export function truncarTexto(texto: string, maximoCaracteres: number): string {
  if (texto.length <= maximoCaracteres) return texto;
  return texto.substring(0, maximoCaracteres).trim() + "...";
}

/**
 * Gera o nome da estado da encomenda em português.
 */
export function nomearEstadoEncomenda(estado: string): string {
  const nomes: Record<string, string> = {
    PENDENTE: "Pendente",
    CONFIRMADO: "Confirmado",
    EM_SEPARACAO: "Em separação",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };

  return nomes[estado] || estado;
}
