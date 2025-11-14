import {
  type ProviderCallResult,
  type TaskPollingConfig,
} from "./types";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

export function buildProviderUrl(base: string, endpoint: string): string {
  if (!endpoint) return base;
  if (ABSOLUTE_URL_REGEX.test(endpoint)) {
    return endpoint;
  }
  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedEndpoint = endpoint.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedEndpoint}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function extractUrl(
  input: unknown,
  depth = 0,
  maxDepth = 3
): string | undefined {
  if (!input || depth > maxDepth) return undefined;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("http")) {
      return trimmed;
    }
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractUrl(parsed, depth + 1, maxDepth);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
  if (!isRecord(input)) return undefined;

  const directKeys = ["url", "signedUrl", "signed_url", "videoUrl"];
  for (const key of directKeys) {
    const value = input[key];
    if (typeof value === "string" && value.startsWith("http")) {
      return value;
    }
  }

  const videoEntry = input.video as { url?: string } | undefined;
  if (videoEntry?.url?.startsWith("http")) {
    return videoEntry.url;
  }

  const videos = input.videos as Array<{ url?: string }> | undefined;
  const firstVideo = videos?.find(
    (entry) => typeof entry?.url === "string" && entry.url.startsWith("http")
  );
  if (firstVideo?.url) return firstVideo.url;

  const images = input.images as Array<{ url?: string }> | undefined;
  const firstImage = images?.find(
    (entry) => typeof entry?.url === "string" && entry.url.startsWith("http")
  );
  if (firstImage?.url) return firstImage.url;

  const dataEntry = input.data as Record<string, unknown> | undefined;
  if (dataEntry) {
    const nested = extractUrl(dataEntry, depth + 1, maxDepth);
    if (nested) return nested;
  }

  if (Array.isArray((input as Record<string, unknown>).output)) {
    for (const item of (input as Record<string, unknown>).output as unknown[]) {
      const outputUrl = extractUrl(item, depth + 1, maxDepth);
      if (outputUrl) return outputUrl;
    }
  }

  for (const value of Object.values(input)) {
    const nested = extractUrl(value, depth + 1, maxDepth);
    if (nested) return nested;
  }

  return undefined;
}

function isArrayBufferLike(value: unknown): value is ArrayBufferLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "byteLength" in value &&
    typeof (value as { byteLength: unknown }).byteLength === "number"
  );
}

export function blobFromBytes(
  bytes: unknown,
  mime = "application/octet-stream"
): Blob | null {
  if (!bytes) return null;
  if (ArrayBuffer.isView(bytes)) {
    const view = bytes as ArrayBufferView;
    const segment = new Uint8Array(
      view.buffer,
      view.byteOffset,
      view.byteLength
    );
    const copy = new Uint8Array(segment);
    return new Blob([copy.buffer], { type: mime });
  }
  if (isArrayBufferLike(bytes)) {
    const view = new Uint8Array(bytes);
    const copy = new Uint8Array(view);
    return new Blob([copy.buffer], { type: mime });
  }
  if (Array.isArray(bytes)) {
    return new Blob([new Uint8Array(bytes as number[])], { type: mime });
  }
  if (typeof bytes === "string") {
    try {
      const binary = atob(bytes);
      const buffer = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        buffer[index] = binary.charCodeAt(index) ?? 0;
      }
      return new Blob([buffer], { type: mime });
    } catch {
      return null;
    }
  }
  return null;
}

export async function downloadBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download generated asset (${response.status}).`);
  }
  return response.blob();
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getValueAtPath(input: unknown, path?: string): unknown {
  if (!path) return input;
  const segments = path.split(".").filter(Boolean);
  let current: unknown = input;

  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

export function resolveTaskConfig(
  config?: TaskPollingConfig
): Required<
  Pick<
    TaskPollingConfig,
    | "taskIdParam"
    | "taskIdLocation"
    | "pollIntervalMs"
    | "maxAttempts"
    | "successStates"
    | "failureStates"
    | "statePath"
    | "responseDataPath"
  >
> {
  return {
    taskIdParam: config?.taskIdParam ?? "taskId",
    taskIdLocation:
      config?.taskIdLocation ??
      (config?.method && config.method === "POST" ? "body" : "query"),
    pollIntervalMs: config?.pollIntervalMs ?? 5000,
    maxAttempts: config?.maxAttempts ?? 60,
    successStates: config?.successStates ?? ["success"],
    failureStates: config?.failureStates ?? ["fail"],
    statePath: config?.statePath ?? "data.state",
    responseDataPath: config?.responseDataPath ?? "data",
  };
}

export type { ProviderCallResult, TaskPollingConfig };
