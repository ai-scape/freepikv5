import type {
  ModelProvider,
  TaskPollingConfig,
} from "./providers";

type ExtraInput = {
  prompt: string;
  startUrl: string;
  endUrl?: string;
  aspectRatio?: string;
  resolution?: string;
  promptOptimizer?: boolean;
};

export type ModelSpec = {
  id: string;
  endpoint: string;
  label: string;
  provider?: ModelProvider;
  supportsEnd: boolean;
  taskConfig?: TaskPollingConfig;
  mapInput: (u: ExtraInput) => Record<string, unknown>;
  getVideoUrl: (data: unknown) => string | undefined;
  referenceImages?: {
    min?: number;
    max: number;
  };
};

export const EXTRA_MODELS: ModelSpec[] = [
  {
    id: "seedance-pro",
    endpoint: "fal-ai/bytedance/seedance/v1/pro/image-to-video",
    label: "Seedance 1.0 Pro (I2V + End)",
    supportsEnd: true,
    mapInput: ({ prompt, startUrl, endUrl, aspectRatio, resolution }) => ({
      prompt,
      image_url: startUrl,
      ...(endUrl ? { end_image_url: endUrl } : {}),
      aspect_ratio: aspectRatio ?? "auto",
      resolution: resolution ?? "1080p",
      duration: "5",
      seed: -1,
      enable_safety_checker: true,
    }),
    getVideoUrl: (d) => (d as { video?: { url?: string } })?.video?.url,
  },
  {
    id: "wan-2.2-turbo",
    endpoint: "fal-ai/wan/v2.2-a14b/image-to-video/turbo",
    label: "WAN 2.2 Turbo (I2V + End)",
    supportsEnd: true,
    mapInput: ({ prompt, startUrl, endUrl, aspectRatio, resolution }) => ({
      image_url: startUrl,
      prompt,
      ...(endUrl ? { end_image_url: endUrl } : {}),
      resolution: resolution ?? "720p",
      aspect_ratio: aspectRatio ?? "auto",
      enable_safety_checker: true,
      enable_output_safety_checker: false,
      enable_prompt_expansion: false,
      acceleration: "regular",
      video_quality: "high",
      video_write_mode: "balanced",
    }),
    getVideoUrl: (d) => (d as { video?: { url?: string } })?.video?.url,
  },
  {
    id: "wan-2.5-i2v",
    endpoint: "/api/v1/jobs/createTask",
    label: "WAN 2.5 (I2V Preview)",
    supportsEnd: false,
    provider: "kie",
    taskConfig: {
      statusEndpoint: "/api/v1/jobs/recordInfo",
      statePath: "data.state",
      successStates: ["success"],
      failureStates: ["fail"],
      responseDataPath: "data",
      pollIntervalMs: 4000,
    },
    mapInput: ({ prompt, startUrl, resolution, promptOptimizer }) => ({
      model: "wan/2-5-image-to-video",
      input: {
        prompt,
        image_url: startUrl,
        duration: "5",
        resolution: resolution ?? "1080p",
        enable_prompt_expansion: promptOptimizer ?? true,
      },
    }),
    getVideoUrl: (data) => {
      const json = (data as { resultJson?: string } | undefined)?.resultJson;
      if (typeof json !== "string") return undefined;
      try {
        const parsed = JSON.parse(json) as { resultUrls?: string[] };
        return (parsed.resultUrls ?? []).find((url) =>
          typeof url === "string" && url.startsWith("http")
        );
      } catch {
        return undefined;
      }
    },
  },
];
