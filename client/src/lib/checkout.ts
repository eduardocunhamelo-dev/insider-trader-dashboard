/**
 * URLs de checkout do Guru e utilitários de rastreamento de afiliados.
 *
 * Como funciona o rastreamento:
 * 1. Visitante clica no link do afiliado: /ref/CODIGO
 * 2. O servidor registra o clique e salva o cookie `insider_ref=CODIGO`
 * 3. Ao abrir o checkout, esta função lê o cookie e emite UTMs na URL do Guru
 * 4. O Guru repassa os UTMs no webhook (source.utm_campaign = CODIGO)
 * 5. O webhook da Insider registra a conversão para o afiliado correto
 */

// Declaração global para o fbq do Meta Pixel
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const CHECKOUT_URLS = {
  trial: "https://checkout.insiderinveste.com.br/pay/trial-10k",
  fast: {
    "10k": "https://checkout.insiderinveste.com.br/pay/10k-fast-indices-derivativos",
    "25k": "https://checkout.insiderinveste.com.br/pay/25k-fast-indice-derivativos",
    "50k": "https://checkout.insiderinveste.com.br/pay/50k-fast-indices-derivativos",
    "100k": "https://checkout.insiderinveste.com.br/pay/100k-fast-indices-derivativos",
  },
  pro: {
    "25k": "https://checkout.insiderinveste.com.br/pay/25k-pro-indices-derivativos",
    "50k": "https://checkout.insiderinveste.com.br/pay/50k-pro-indices-derivativos",
    "100k": "https://checkout.insiderinveste.com.br/pay/100k-pro-indices-derivativos",
  },
} as const;

/**
 * Lê o código de afiliado do cookie `insider_ref` (setado pela rota /ref/:code).
 */
function getAffiliateCodeFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)insider_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Adiciona parâmetros UTM de rastreamento de afiliado à URL do checkout do Guru.
 * Se não houver cookie de afiliado, retorna a URL original sem alteração.
 *
 * Parâmetros adicionados:
 * - utm_source=afiliado
 * - utm_campaign=CODIGO_DO_AFILIADO
 * - sck=CODIGO_DO_AFILIADO  (checkout source — campo nativo do Guru)
 */
export function buildCheckoutUrl(baseUrl: string): string {
  const affiliateCode = getAffiliateCodeFromCookie();
  if (!affiliateCode) return baseUrl;

  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "afiliado");
  url.searchParams.set("utm_campaign", affiliateCode);
  url.searchParams.set("sck", affiliateCode);
  return url.toString();
}

/**
 * Abre o checkout do Guru em nova aba, com UTMs de afiliado se disponíveis.
 */
export function openCheckout(baseUrl: string): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout');
  }
  window.open(buildCheckoutUrl(baseUrl), "_blank");
}
