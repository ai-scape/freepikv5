import { callFal, callFalSubscribe, getFalKey } from "../fal";
import { callKie, getKieKey } from "../kie";
import type {
  ModelProvider,
  ProviderCallOptions,
  ProviderCallResult,
  TaskPollingConfig,
} from "./types";

const ENV_MAP: Record<ModelProvider, string> = {
  fal: "VITE_FAL_KEY",
  "fal-client": "VITE_FAL_KEY",
  kie: "VITE_KIE_KEY",
};

export async function callModelEndpoint(
  provider: ModelProvider,
  endpoint: string,
  payload: Record<string, unknown>,
  options?: ProviderCallOptions
): Promise<ProviderCallResult> {
  if (provider === "kie") {
    return callKie(endpoint, payload, options);
  }
  if (provider === "fal-client") {
    return callFalSubscribe(endpoint, payload, options);
  }
  return callFal(endpoint, payload);
}

export function getProviderEnvVar(provider: ModelProvider): string {
  return ENV_MAP[provider];
}

export function getProviderKey(provider: ModelProvider): string {
  return provider === "kie" ? getKieKey() : getFalKey();
}

export type {
  ModelProvider,
  ProviderCallOptions,
  ProviderCallResult,
  TaskPollingConfig,
};
