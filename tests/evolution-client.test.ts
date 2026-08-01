import assert from "node:assert/strict";
import test from "node:test";
import {
  createEvolutionClient,
  EvolutionConfigurationError,
  EvolutionDeliveryError,
  evolutionConfigFromEnv,
} from "../src/lib/evolution-client";

test("requires complete Evolution API configuration", () => {
  assert.throws(() => evolutionConfigFromEnv({}), EvolutionConfigurationError);
});

test("sends the expected request without exposing the key in the URL or body", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const fetchMock = async (url: URL | RequestInfo, init?: RequestInit) => {
    request = { url: String(url), init };
    return new Response(null, { status: 201 });
  };
  const client = createEvolutionClient(
    {
      apiUrl: "https://evolution.example",
      apiKey: "secret-key",
      instanceName: "forja",
    },
    fetchMock as typeof fetch
  );
  await client.sendText("+5491112345678", "Código de prueba");
  assert.equal(
    request?.url,
    "https://evolution.example/message/sendText/forja"
  );
  assert.equal(new Headers(request?.init?.headers).get("ApiKey"), "secret-key");
  assert.deepEqual(JSON.parse(String(request?.init?.body)), {
    number: "5491112345678",
    text: "Código de prueba",
  });
  assert.doesNotMatch(`${request?.url}${request?.init?.body}`, /secret-key/);
});

test("turns provider and timeout failures into operational errors", async () => {
  const rejected = createEvolutionClient(
    {
      apiUrl: "https://evolution.example",
      apiKey: "key",
      instanceName: "forja",
    },
    (async () => new Response(null, { status: 503 })) as typeof fetch
  );
  await assert.rejects(
    rejected.sendText("+5491112345678", "text"),
    EvolutionDeliveryError
  );

  const hanging = createEvolutionClient(
    {
      apiUrl: "https://evolution.example",
      apiKey: "key",
      instanceName: "forja",
    },
    ((_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        );
      })) as typeof fetch,
    5
  );
  await assert.rejects(
    hanging.sendText("+5491112345678", "text"),
    /tiempo de espera/
  );
});
