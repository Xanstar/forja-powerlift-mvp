export type FetchLike = typeof fetch;

type EvolutionConfig = {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
};

export class EvolutionConfigurationError extends Error {}
export class EvolutionDeliveryError extends Error {}

export function evolutionConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): EvolutionConfig {
  const apiUrl = env.EVOLUTION_API_URL?.trim();
  const apiKey = env.EVOLUTION_API_KEY?.trim();
  const instanceName = env.EVOLUTION_INSTANCE_NAME?.trim();
  if (!apiUrl || !apiKey || !instanceName) {
    throw new EvolutionConfigurationError(
      "Evolution API no está configurada. Definí URL, API key e instancia."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new EvolutionConfigurationError("EVOLUTION_API_URL no es una URL válida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new EvolutionConfigurationError("EVOLUTION_API_URL debe usar HTTP o HTTPS.");
  }

  return { apiUrl: parsed.toString().replace(/\/$/, ""), apiKey, instanceName };
}

export function activationUrlFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.APP_URL?.trim();
  if (!configured) {
    throw new EvolutionConfigurationError(
      "APP_URL no está configurada para incluir el enlace de activación."
    );
  }
  try {
    const url = new URL("/activar", configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new EvolutionConfigurationError("APP_URL no es una URL HTTP(S) válida.");
  }
}

export function createEvolutionClient(
  config: EvolutionConfig,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 8_000
) {
  return {
    async sendText(phoneE164: string, text: string) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(
          `${config.apiUrl}/message/sendText/${encodeURIComponent(config.instanceName)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ApiKey: config.apiKey,
            },
            body: JSON.stringify({ number: phoneE164.slice(1), text }),
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          throw new EvolutionDeliveryError(
            `Evolution API rechazó el envío (${response.status}).`
          );
        }
      } catch (error) {
        if (error instanceof EvolutionDeliveryError) throw error;
        throw new EvolutionDeliveryError(
          error instanceof Error && error.name === "AbortError"
            ? "Evolution API agotó el tiempo de espera."
            : "No se pudo conectar con Evolution API."
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
