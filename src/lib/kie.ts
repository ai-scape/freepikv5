import {
  buildProviderUrl,
  blobFromBytes,
  buildQueryString,
  delay,
  downloadBlob,
  extractUrl,
  getValueAtPath,
  isRecord,
  resolveTaskConfig,
} from "./providers/shared";
import type {
  ProviderCallOptions,
  ProviderCallResult,
  TaskPollingConfig,
} from "./providers/types";

const KIE_BASE_URL = "https://api.kie.ai";

function resolveEnvKey() {
  return (import.meta.env.VITE_KIE_KEY ?? "").trim();
}

export function getKieKey() {
  return resolveEnvKey();
}

export async function callKie(
  endpoint: string,
  payload: Record<string, unknown>,
  options?: ProviderCallOptions
): Promise<ProviderCallResult> {
  const key = getKieKey();
  if (!key) {
    throw new Error("Missing KIE key.");
  }

  const target = buildProviderUrl(KIE_BASE_URL, endpoint);
  const response = await fetch(target, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`KIE request failed (${response.status})`);
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
  if (typeof data.code === "number" && data.code !== 200) {
    const message =
      (data.msg as string | undefined) ??
      (data.message as string | undefined) ??
      "KIE request failed.";
    throw new Error(`${message} (code ${data.code})`);
  }

  const directUrl =
    extractUrl(data) ?? extractUrl((data.data as Record<string, unknown>) ?? {});
  if (directUrl) {
    return {
      url: directUrl,
      blob: await downloadBlob(directUrl),
    };
  }

  const bytesBlob = blobFromBytes(
    data?.bytes ?? (data?.data as { bytes?: unknown })?.bytes,
    (data?.mime as string | undefined) ??
    ((data?.data as { mime?: string })?.mime ?? "application/octet-stream")
  );
  if (bytesBlob) {
    return { blob: bytesBlob };
  }

  const taskConfig = options?.taskConfig;
  if (taskConfig) {
    const taskId = resolveTaskId(data);
    if (!taskId) {
      throw new Error("KIE response did not include a task id.");
    }
    const finalData = await pollKieTask(key, taskId, taskConfig);
    const taskUrl =
      extractUrl(finalData) ??
      extractUrl(
        isRecord(finalData)
          ? (finalData.data as Record<string, unknown> | undefined)
          : undefined
      );

    if (taskUrl) {
      return {
        url: taskUrl,
        blob: await downloadBlob(taskUrl),
      };
    }

    const resultJsonUrl = extractUrlFromResultJson(finalData);
    if (resultJsonUrl) {
      return {
        url: resultJsonUrl,
        blob: await downloadBlob(resultJsonUrl),
      };
    }

    const taskBytes = blobFromBytes(
      isRecord(finalData) ? finalData.bytes : undefined,
      isRecord(finalData)
        ? ((finalData.mime as string | undefined) ?? "application/octet-stream")
        : "application/octet-stream"
    );
    if (taskBytes) {
      return { blob: taskBytes };
    }

    const logger = options?.log;
    if (typeof logger === "function") {
      logger(`KIE finalData: ${JSON.stringify(finalData, null, 2)}`);
    } else {
      console.log("KIE finalData:", JSON.stringify(finalData, null, 2));
    }

    throw new Error("KIE task completed without a downloadable asset.");
  }

  throw new Error("Unable to locate asset payload in KIE response.");
}

function resolveTaskId(data: Record<string, unknown>): string | undefined {
  const direct = data.taskId;
  if (typeof direct === "string" && direct) {
    return direct;
  }
  const nested = data.data;
  if (isRecord(nested) && typeof nested.taskId === "string" && nested.taskId) {
    return nested.taskId;
  }
  return undefined;
}

async function pollKieTask(
  key: string,
  taskId: string,
  config: TaskPollingConfig
): Promise<unknown> {
  const defaults = resolveTaskConfig(config);

  for (let attempt = 0; attempt < defaults.maxAttempts; attempt += 1) {
    const statusPayload = await fetchTaskStatus(key, taskId, config, defaults);
    const stateValue = getValueAtPath(statusPayload, defaults.statePath);

    if (typeof stateValue === "string") {
      if (defaults.successStates.includes(stateValue)) {
        return (
          getValueAtPath(statusPayload, defaults.responseDataPath) ??
          statusPayload
        );
      }
      if (defaults.failureStates.includes(stateValue)) {
        const errorMessage =
          (getValueAtPath(statusPayload, "data.failMsg") as string | undefined) ??
          (statusPayload.msg as string | undefined) ??
          (statusPayload.message as string | undefined) ??
          "Task failed.";
        throw new Error(`KIE task failed: ${errorMessage}`);
      }
    }

    const maybePayload =
      getValueAtPath(statusPayload, defaults.responseDataPath) ?? statusPayload;
    const maybeUrl = extractUrl(maybePayload);
    if (maybeUrl) {
      return maybePayload;
    }

    await delay(defaults.pollIntervalMs);
  }

  throw new Error("KIE task polling timed out.");
}

async function fetchTaskStatus(
  key: string,
  taskId: string,
  config: TaskPollingConfig,
  defaults: ReturnType<typeof resolveTaskConfig>
): Promise<Record<string, unknown>> {
  const method = config.method ?? "GET";
  const taskLocation = defaults.taskIdLocation;
  const paramName = defaults.taskIdParam;
  const query: Record<string, string | number | boolean | undefined> = {
    ...(config.query ?? {}),
  };
  const body: Record<string, unknown> = {
    ...(config.body ?? {}),
  };

  if (taskLocation === "query") {
    query[paramName] = taskId;
  } else if (method === "POST") {
    body[paramName] = taskId;
  } else {
    query[paramName] = taskId;
  }

  let target = buildProviderUrl(KIE_BASE_URL, config.statusEndpoint);
  const queryString = buildQueryString(query);
  if (queryString) {
    const separator = target.includes("?") ? "&" : "?";
    target = `${target}${separator}${queryString.replace(/^\?/, "")}`;
  }

  const response = await fetch(target, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`KIE task status request failed (${response.status}).`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.code === "number" && data.code !== 200) {
    const message =
      (data.msg as string | undefined) ??
      (data.message as string | undefined) ??
      "Task status failed.";
    throw new Error(`${message} (code ${data.code})`);
  }

  return data;
}

function extractUrlFromResultJson(input: unknown): string | undefined {
  if (!input || !isRecord(input)) return undefined;
  const candidates: string[] = [];
  const possibleKeys = ["resultJson", "resultInfoJson", "response"];
  for (const key of possibleKeys) {
    const value = input[key];
    if (typeof value === "string") {
      candidates.push(value);
    }
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const url = extractUrl(parsed);
      if (url) {
        return url;
      }
    } catch {
      continue;
    }
  }
  return undefined;
}
