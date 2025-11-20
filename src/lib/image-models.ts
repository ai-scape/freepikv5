import type {
  ModelProvider,
  TaskPollingConfig,
} from "./providers";

export type ImageSizePreset =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

export type ImageJob = {
  prompt: string;
  imageUrls: string[];
  size?: ImageSizePreset | { width: number; height: number };
  seed?: number;
  temporal?: boolean;
  steps?: number;
  imageResolution?: string;
  maxImages?: number;
};

export type ImageModelSpec = {
  id: string;
  label: string;
  endpoint: string;
  provider?: ModelProvider;
  mode: "edit" | "hybrid" | "text";
  maxRefs: number;
  taskConfig?: TaskPollingConfig;
  mapInput: (job: ImageJob) => Record<string, unknown>;
  getUrls: (out: unknown) => string[];
};

function resolveAspectRatio(
  size: ImageJob["size"]
): string | undefined {
  if (!size) return undefined;
  if (typeof size === "string") {
    switch (size) {
      case "square_hd":
      case "square":
        return "1:1";
      case "portrait_4_3":
        return "3:4";
      case "portrait_16_9":
        return "9:16";
      case "landscape_4_3":
        return "4:3";
      case "landscape_16_9":
        return "16:9";
      default:
        return undefined;
    }
  }
  const { width, height } = size;
  if (!width || !height) return undefined;
  const gcd = (a: number, b: number): number =>
    b === 0 ? a : gcd(b, a % b);
  const factor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width / factor);
  const h = Math.round(height / factor);
  return `${w}:${h}`;
}

export const IMAGE_MODELS: ImageModelSpec[] = [
  {
    id: "nano-banana-edit",
    label: "Nano Banana — Edit",
    endpoint: "/api/v1/jobs/createTask",
    provider: "kie",
    mode: "edit",
    maxRefs: 4,
    mapInput: ({ prompt, imageUrls, size }) => {
      const aspectRatio = resolveAspectRatio(size);
      return {
        model: "google/nano-banana-edit",
        input: {
          prompt,
          image_urls: imageUrls.slice(0, 10),
          output_format: "png",
          ...(aspectRatio ? { image_size: aspectRatio } : {}),
        },
      };
    },
    taskConfig: {
      statusEndpoint: "/api/v1/jobs/recordInfo",
      statePath: "data.state",
      successStates: ["success"],
      failureStates: ["fail"],
      responseDataPath: "data",
      pollIntervalMs: 4000,
    },
    getUrls: (output) => {
      const data = (output as { resultJson?: string } | undefined)?.resultJson;
      if (typeof data !== "string") return [];
      try {
        const parsed = JSON.parse(data) as { resultUrls?: string[] };
        return (parsed.resultUrls ?? []).filter(Boolean);
      } catch {
        return [];
      }
    },
  },
  {
    id: "imagen-4-fast",
    label: "Imagen 4 Fast — Text",
    endpoint: "fal-ai/imagen4/preview/fast",
    mode: "text",
    maxRefs: 0,
    mapInput: ({ prompt, size, seed, steps }) => {
      const aspectRatio = resolveAspectRatio(size);
      return {
        prompt,
        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
        ...(seed !== undefined ? { seed } : {}),
        ...(steps !== undefined ? { num_inference_steps: steps } : {}),
        guidance_scale: 5,
        num_images: 1,
        output_format: "png",
      };
    },
    getUrls: (output) =>
      ((output as { images?: Array<{ url?: string }> })?.images ?? [])
        .map((image) => image?.url)
        .filter(Boolean) as string[],
  },
  {
    id: "imagen-4",
    label: "Imagen 4 — Text",
    endpoint: "fal-ai/imagen4/preview",
    mode: "text",
    maxRefs: 0,
    mapInput: ({ prompt, size, seed, steps }) => {
      const aspectRatio = resolveAspectRatio(size);
      return {
        prompt,
        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
        ...(seed !== undefined ? { seed } : {}),
        ...(steps !== undefined ? { num_inference_steps: steps } : {}),
        guidance_scale: 6,
        num_images: 1,
        output_format: "png",
      };
    },
    getUrls: (output) =>
      ((output as { images?: Array<{ url?: string }> })?.images ?? [])
        .map((image) => image?.url)
        .filter(Boolean) as string[],
  },
  {
    id: "qwen-image-edit-plus",
    label: "Qwen Image Edit Plus (2509)",
    endpoint: "/api/v1/jobs/createTask",
    provider: "kie",
    taskConfig: {
      statusEndpoint: "/api/v1/jobs/recordInfo",
      statePath: "data.state",
      successStates: ["success"],
      failureStates: ["fail"],
      responseDataPath: "data",
      pollIntervalMs: 4000,
    },
    mode: "edit",
    maxRefs: 4,
    mapInput: ({ prompt, imageUrls, size, seed, steps }) => ({
      model: "qwen/image-edit",
      input: {
        prompt,
        image_url: imageUrls[0],
        image_size: size ?? "square_hd",
        num_inference_steps: steps ?? 30,
        guidance_scale: 4,
        sync_mode: false,
        enable_safety_checker: true,
        output_format: "png",
        acceleration: "none",
        ...(seed !== undefined ? { seed } : {}),
      },
    }),
    getUrls: (output) => {
      const json = (output as { resultJson?: string } | undefined)?.resultJson;
      if (typeof json === "string") {
        try {
          const parsed = JSON.parse(json) as { resultUrls?: string[] };
          return (parsed.resultUrls ?? []).filter(Boolean) as string[];
        } catch {
          // ignore
        }
      }
      return (
        ((output as { images?: Array<{ url?: string }> })?.images ?? [])
          .map((image) => image?.url)
          .filter(Boolean) as string[]
      );
    },
  },
  {
    id: "seedream-v4-edit",
    label: "Seedream v4 — Edit",
    endpoint: "/api/v1/jobs/createTask",
    provider: "kie",
    taskConfig: {
      statusEndpoint: "/api/v1/jobs/recordInfo",
      statePath: "data.state",
      successStates: ["success"],
      failureStates: ["fail"],
      responseDataPath: "data",
      pollIntervalMs: 4000,
    },
    mode: "edit",
    maxRefs: 10,
    mapInput: ({ prompt, imageUrls, size, seed, imageResolution, maxImages }) => {
      const clampedMax =
        typeof maxImages === "number"
          ? Math.min(6, Math.max(1, Math.round(maxImages)))
          : undefined;

      return {
        model: "bytedance/seedream-v4-edit",
        input: {
          prompt,
          image_urls: imageUrls.slice(0, 10),
          ...(size ? { image_size: size } : {}),
          ...(imageResolution ? { image_resolution: imageResolution } : {}),
          ...(clampedMax !== undefined ? { max_images: clampedMax } : {}),
          ...(seed !== undefined ? { seed } : {}),
        },
      };
    },
    getUrls: (output) => {
      const resultJson = (output as { resultJson?: string } | undefined)?.resultJson;
      if (typeof resultJson === "string") {
        try {
          const parsed = JSON.parse(resultJson) as { resultUrls?: string[] };
          return (parsed.resultUrls ?? []).filter(Boolean) as string[];
        } catch {
          // fall through
        }
      }
      return (
        ((output as { images?: Array<{ url?: string }> })?.images ?? [])
          .map((image) => image?.url)
          .filter(Boolean) as string[]
      );
    },
  },
];
