import { fal } from "@fal-ai/client";
import {
  buildProviderUrl,
  blobFromBytes,
  downloadBlob,
  extractUrl,
} from "./providers/shared";
import type { ProviderCallOptions, ProviderCallResult } from "./providers/types";

const FAL_BASE_URL = "https://fal.run";

function resolveEnvKey() {
  return (import.meta.env.VITE_FAL_KEY ?? "").trim();
}

export function getFalKey() {
  return resolveEnvKey();
}

function ensureFalClient() {
  const key = getFalKey();
  if (!key) {
    throw new Error("Missing FAL key.");
  }
  fal.config({ credentials: key });
  return fal;
}

export async function callFal(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<ProviderCallResult> {
  const key = getFalKey();
  if (!key) {
    throw new Error("Missing FAL key.");
  }

  const target = buildProviderUrl(FAL_BASE_URL, endpoint);
  const response = await fetch(target, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`FAL request failed (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const arrayBuffer = await response.arrayBuffer();
    return {
      blob: new Blob([arrayBuffer], {
        type: contentType || "application/octet-stream",
      }),
    };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const url =
    extractUrl(data) ??
    extractUrl(data?.data) ??
    extractUrl((data?.result as Record<string, unknown>) ?? {});

  if (url) {
    return {
      url,
      blob: await downloadBlob(url),
    };
  }

  const maybeBytes = blobFromBytes(
    data?.bytes ??
    (data?.data as { bytes?: unknown })?.bytes ??
    (data?.result as { bytes?: unknown })?.bytes,
    (data?.mime as string | undefined) ??
    ((data?.data as { mime?: string })?.mime ?? undefined) ??
    "application/octet-stream"
  );

  if (maybeBytes) {
    return { blob: maybeBytes };
  }

  throw new Error("Unable to locate asset payload in FAL response.");
}

export async function callFalSubscribe(
  endpoint: string,
  input: Record<string, unknown>,
  options?: ProviderCallOptions
): Promise<ProviderCallResult> {
  const client = ensureFalClient();
  const { log } = options ?? {};

  try {
    const result = await client.subscribe(endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && log) {
          update.logs.map((l) => l.message).forEach(log);
        }
      },
    });

    // Qwen returns { images: [{ url: "..." }] }
    const images = (result.data as { images?: Array<{ url: string }> })?.images;
    if (images && images.length > 0 && images[0].url) {
      const url = images[0].url;
      return {
        url,
        blob: await downloadBlob(url),
      };
    }

    throw new Error("No image URL found in response");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "FAL subscribe request failed"
    );
  }
}

function extractUploadUrl(result: unknown): string | undefined {
  if (!result) return undefined;
  if (typeof result === "string") {
    return result.startsWith("http") ? result : undefined;
  }
  if (typeof result === "object") {
    const record = result as Record<string, unknown>;
    const direct = record.url ?? record.signedUrl ?? record.signed_url;
    if (typeof direct === "string" && direct.startsWith("http")) {
      return direct;
    }
    const dataEntry = record.data as Record<string, unknown> | undefined;
    if (dataEntry) {
      const nested = extractUploadUrl(dataEntry);
      if (nested) return nested;
    }
  }
  return undefined;
}

export async function uploadToFal(file: File): Promise<string> {
  const client = ensureFalClient();
  const result = await client.storage.upload(file);
  const url = extractUploadUrl(result);
  if (!url) {
    throw new Error("Upload response did not include a file URL.");
  }
  return url;
}
