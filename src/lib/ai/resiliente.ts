import "server-only";
import { ApiError } from "@google/genai";

// O Gemini às vezes responde 503 ("high demand") ou 429 em picos. Em vez de
// devolver erro na hora, tenta o mesmo modelo de novo após uma pausa curta e,
// se continuar fora, usa um modelo reserva mais leve. A resposta sai um pouco
// mais simples, mas a pessoa não fica travada.

const RESERVA: Record<string, string> = {
  "gemini-3.8-flash": "gemini-3.5-flash-lite",
  "gemini-3.5-flash-lite": "gemini-3.1-flash-lite",
};

const PAUSA_MS = 1500;

export function sobrecarregado(erro: unknown) {
  return erro instanceof ApiError && [429, 500, 503, 504].includes(erro.status);
}

// Roda a chamada no modelo pedido; em sobrecarga, repete uma vez e depois cai
// para a reserva. Devolve também o modelo que respondeu (para o custo).
export async function comReserva<T>(
  modelo: string,
  chamada: (modelo: string) => Promise<T>,
): Promise<{ resultado: T; modelo: string }> {
  const tentativas = [modelo, modelo, RESERVA[modelo]].filter(Boolean) as string[];
  let ultimoErro: unknown;
  for (let i = 0; i < tentativas.length; i++) {
    try {
      return { resultado: await chamada(tentativas[i]), modelo: tentativas[i] };
    } catch (erro) {
      if (!sobrecarregado(erro)) throw erro;
      ultimoErro = erro;
      const atual = tentativas[i];
      console.warn(
        `[ia] ${atual} sobrecarregado (${(erro as ApiError).status}); ${i + 1 < tentativas.length ? `tentando ${tentativas[i + 1]}` : "sem reserva"}`,
      );
      // Pausa só antes de repetir o mesmo modelo; a reserva vai direto.
      if (tentativas[i + 1] === atual) await new Promise((ok) => setTimeout(ok, PAUSA_MS));
    }
  }
  throw ultimoErro;
}
