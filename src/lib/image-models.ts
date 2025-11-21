import type {
  ModelProvider,
  TaskPollingConfig,
} from "./providers";

export type ImageSizePreset =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_3_2"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_3_2"
  | "landscape_16_9"
  | "landscape_21_9";

export type UiOption = { value: string; label: string };

export type ImageJob = {
  prompt: string;
  imageUrls: string[];
  size?: ImageSizePreset | { width: number; height: number };
  seed?: number;
  temporal?: boolean;
  steps?: number;
  imageResolution?: string;
  maxImages?: number;
  outputFormat?: string;
  aspectRatio?: string;
  enableTranslation?: boolean;
  model?: string;
  promptUpsampling?: boolean;
  safetyTolerance?: number;
  watermark?: string;
  numImages?: number;
};

export type ImageModelSpec = {
  id: string;
  label: string;
  endpoint: string;
  provider?: ModelProvider;
  pricing?: string;
  mode: "edit" | "hybrid" | "text";
  maxRefs: number;
  taskConfig?: TaskPollingConfig;
  mapInput: (job: ImageJob) => Record<string, unknown>;
  getUrls: (out: unknown) => string[];
  requireReference?: boolean;
  ui?: {
    aspectRatios?: UiOption[];
    resolutions?: UiOption[];
    outputFormats?: UiOption[];
    maxImages?: { min: number; max: number; default: number };
    supportsSyncMode?: boolean;
  };
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
      case "portrait_3_2":
        return "2:3";
      case "portrait_16_9":
        return "9:16";
      case "landscape_4_3":
        return "4:3";
      case "landscape_3_2":
        return "3:2";
      case "landscape_16_9":
        return "16:9";
      case "landscape_21_9":
        return "21:9";
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
    pricing: "$0.02/image",
    mode: "edit",
    maxRefs: 10,
    ui: {
      aspectRatios: [
        { value: "1:1", label: "Square (1:1)" },
        { value: "3:4", label: "Portrait (3:4)" },
        { value: "2:3", label: "Portrait (2:3)" },
        { value: "9:16", label: "Portrait (9:16)" },
        { value: "4:3", label: "Landscape (4:3)" },
        { value: "3:2", label: "Landscape (3:2)" },
        { value: "16:9", label: "Landscape (16:9)" },
        { value: "21:9", label: "Landscape (21:9)" },
      ],
    },
    mapInput: ({ prompt, imageUrls, aspectRatio, outputFormat, size }) => {
      // If references are provided, use edit mode; otherwise fall back to text-to-image.
      const resolvedAspect = aspectRatio ?? resolveAspectRatio(size);
      const hasRefs = imageUrls.length > 0;
      return {
        model: hasRefs ? "google/nano-banana-edit" : "google/nano-banana",
        input: {
          prompt,
          ...(hasRefs
            ? { image_urls: imageUrls.slice(0, 10) }
            : resolvedAspect
              ? { image_size: resolvedAspect }
              : {}),
          output_format: outputFormat ?? "png",
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
    id: "nano-banana-pro-edit",
    label: "Nano Banana Pro — Edit",
    endpoint: "/api/v1/jobs/createTask",
    provider: "kie",
    pricing: "$0.15/image",
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
    ui: {
      aspectRatios: [
        { value: "1:1", label: "1:1" },
        { value: "2:3", label: "2:3" },
        { value: "3:2", label: "3:2" },
        { value: "3:4", label: "3:4" },
        { value: "4:3", label: "4:3" },
        { value: "4:5", label: "4:5" },
        { value: "5:4", label: "5:4" },
        { value: "9:16", label: "9:16" },
        { value: "16:9", label: "16:9" },
        { value: "21:9", label: "21:9" },
      ],
      resolutions: [
        { value: "1K", label: "1K" },
        { value: "2K", label: "2K" },
        { value: "4K", label: "4K" },
      ],
      outputFormats: [
        { value: "png", label: "PNG" },
        { value: "jpg", label: "JPG" },
      ],
    },
    mapInput: ({
      prompt,
      imageUrls,
      size,
      imageResolution,
      aspectRatio,
      outputFormat,
    }) => {
      const resolvedAspect = aspectRatio ?? resolveAspectRatio(size);
      return {
        model: "nano-banana-pro",
        input: {
          prompt,
          ...(imageUrls.length
            ? { image_input: imageUrls.slice(0, 10) }
            : {}),
          ...(resolvedAspect ? { aspect_ratio: resolvedAspect } : {}),
          ...(imageResolution ? { resolution: imageResolution } : {}),
          output_format: outputFormat ?? "png",
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
      return [];
    },
  },
  {
    id: "seedream-v4-edit",
    label: "Seedream V4 — Edit",
    endpoint: "/api/v1/jobs/createTask",
    provider: "kie",
    pricing: "$0.0175/image",
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
    ui: {
      aspectRatios: [
        { value: "square_hd", label: "Square HD (1:1)" },
        { value: "square", label: "Square (1:1)" },
        { value: "portrait_4_3", label: "Portrait (3:4)" },
        { value: "portrait_3_2", label: "Portrait (2:3)" },
        { value: "portrait_16_9", label: "Portrait (9:16)" },
        { value: "landscape_4_3", label: "Landscape (4:3)" },
        { value: "landscape_3_2", label: "Landscape (3:2)" },
        { value: "landscape_16_9", label: "Landscape (16:9)" },
        { value: "landscape_21_9", label: "Landscape (21:9)" },
      ],
      resolutions: [
        { value: "1K", label: "1K" },
        { value: "2K", label: "2K" },
        { value: "4K", label: "4K" },
      ],
      maxImages: { min: 1, max: 6, default: 1 },
    },
    mapInput: ({ prompt, imageUrls, aspectRatio, seed, imageResolution, maxImages }) => {
      const clampedMax =
        typeof maxImages === "number"
          ? Math.min(6, Math.max(1, Math.round(maxImages)))
          : undefined;

      return {
        model:
          imageUrls.length > 0
            ? "bytedance/seedream-v4-edit"
            : "bytedance/seedream-v4-text-to-image",
        input: {
          prompt,
          ...(imageUrls.length > 0
            ? { image_urls: imageUrls.slice(0, 10) }
            : aspectRatio
              ? { image_size: aspectRatio }
              : {}),
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
  {
    id: "flux-kontext-pro",
    label: "Flux Kontext Pro — Text & Edit",
    endpoint: "https://api.kie.ai/fluxkontext/v1/generate",
    provider: "kie",
    pricing: "$0.025/image",
    mode: "hybrid",
    maxRefs: 1,
    ui: {
      aspectRatios: [
        { value: "16:9", label: "Landscape (16:9)" },
        { value: "4:3", label: "Landscape (4:3)" },
        { value: "3:2", label: "Landscape (3:2)" },
        { value: "1:1", label: "Square (1:1)" },
        { value: "3:4", label: "Portrait (3:4)" },
        { value: "2:3", label: "Portrait (2:3)" },
        { value: "9:16", label: "Portrait (9:16)" },
        { value: "21:9", label: "Ultra-wide (21:9)" },
      ],
      outputFormats: [
        { value: "jpeg", label: "JPEG" },
        { value: "png", label: "PNG" },
      ],
    },
    mapInput: ({ prompt, imageUrls, aspectRatio, outputFormat, enableTranslation, promptUpsampling, safetyTolerance, watermark }) => {
      const hasRef = imageUrls.length > 0;
      const aspect = aspectRatio ?? "16:9";
      return hasRef
        ? {
            prompt,
            inputImage: imageUrls[0],
            aspectRatio: aspect,
            outputFormat: outputFormat ?? "png",
            enableTranslation: enableTranslation ?? true,
            model: "flux-kontext-pro",
            ...(promptUpsampling !== undefined ? { promptUpsampling } : {}),
            ...(safetyTolerance !== undefined ? { safetyTolerance } : {}),
            ...(watermark ? { watermark } : {}),
          }
        : {
            prompt,
            aspectRatio: aspect,
            outputFormat: outputFormat ?? "png",
            enableTranslation: enableTranslation ?? true,
            model: "flux-kontext-pro",
            ...(promptUpsampling !== undefined ? { promptUpsampling } : {}),
            ...(safetyTolerance !== undefined ? { safetyTolerance } : {}),
            ...(watermark ? { watermark } : {}),
          };
    },
    getUrls: (output) => {
      const url = (output as { url?: string })?.url;
      if (typeof url === "string") return [url];
      return [];
    },
  },
  {
    id: "flux-kontext-max",
    label: "Flux Kontext Max — Text & Edit",
    endpoint: "https://api.kie.ai/fluxkontext/v1/generate",
    provider: "kie",
    pricing: "$0.05/image",
    mode: "hybrid",
    maxRefs: 1,
    ui: {
      aspectRatios: [
        { value: "16:9", label: "Landscape (16:9)" },
        { value: "4:3", label: "Landscape (4:3)" },
        { value: "3:2", label: "Landscape (3:2)" },
        { value: "1:1", label: "Square (1:1)" },
        { value: "3:4", label: "Portrait (3:4)" },
        { value: "2:3", label: "Portrait (2:3)" },
        { value: "9:16", label: "Portrait (9:16)" },
        { value: "21:9", label: "Ultra-wide (21:9)" },
      ],
      outputFormats: [
        { value: "jpeg", label: "JPEG" },
        { value: "png", label: "PNG" },
      ],
    },
    mapInput: ({ prompt, imageUrls, aspectRatio, outputFormat, enableTranslation, promptUpsampling, safetyTolerance, watermark }) => {
      const hasRef = imageUrls.length > 0;
      const aspect = aspectRatio ?? "16:9";
      return hasRef
        ? {
            prompt,
            inputImage: imageUrls[0],
            aspectRatio: aspect,
            outputFormat: outputFormat ?? "png",
            enableTranslation: enableTranslation ?? true,
            model: "flux-kontext-max",
            ...(promptUpsampling !== undefined ? { promptUpsampling } : {}),
            ...(safetyTolerance !== undefined ? { safetyTolerance } : {}),
            ...(watermark ? { watermark } : {}),
          }
        : {
            prompt,
            aspectRatio: aspect,
            outputFormat: outputFormat ?? "png",
            enableTranslation: enableTranslation ?? true,
            model: "flux-kontext-max",
            ...(promptUpsampling !== undefined ? { promptUpsampling } : {}),
            ...(safetyTolerance !== undefined ? { safetyTolerance } : {}),
            ...(watermark ? { watermark } : {}),
          };
    },
    getUrls: (output) => {
      const url = (output as { url?: string })?.url;
      if (typeof url === "string") return [url];
      return [];
    },
  },
];
