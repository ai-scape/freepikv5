import type {
  ModelProvider,
  TaskPollingConfig,
} from "./providers";

export type ModelSpec = {
  id: string;
  endpoint: string;
  label: string;
  provider?: ModelProvider;
  supportsEnd: boolean;
  taskConfig?: TaskPollingConfig;
  mapInput: (
    u: {
      prompt: string;
      startUrl: string;
      endUrl?: string;
      aspectRatio?: string;
      resolution?: string;
    }
  ) => Record<string, string | number | boolean | undefined>;
  getVideoUrl: (data: unknown) => string | undefined;
};

export const EXTRA_MODELS: ModelSpec[] = [
  {
    id: "seedance-pro-fast",
    endpoint: "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video",
    label: "Seedance 1.0 Pro Fast (I2V)",
    supportsEnd: false,
    mapInput: ({ prompt, startUrl, aspectRatio, resolution }) => ({
      prompt,
      image_url: startUrl,
      aspect_ratio: aspectRatio ?? "auto",
      resolution: resolution ?? "1080p",
      duration: "5",
      seed: -1,
      enable_safety_checker: true,
    }),
    getVideoUrl: (d) => (d as { video?: { url?: string } })?.video?.url,
  },
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
    id: "hailuo-02-pro",
    endpoint: "fal-ai/minimax/hailuo-02/pro/image-to-video",
    label: "Hailuo 02 Pro (I2V + End, 1080p)",
    supportsEnd: true,
    mapInput: ({ prompt, startUrl, endUrl }) => ({
      prompt,
      image_url: startUrl,
      ...(endUrl ? { end_image_url: endUrl } : {}),
      prompt_optimizer: true,
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
    endpoint: "fal-ai/wan-25-preview/image-to-video",
    label: "WAN 2.5 (I2V Preview)",
    supportsEnd: false,
    mapInput: ({ prompt, startUrl }) => ({
      prompt,
      image_url: startUrl,
      resolution: "1080p",
      duration: "5",
      enable_prompt_expansion: true,
      enable_safety_checker: true,
    }),
    getVideoUrl: (d) => (d as { video?: { url?: string } })?.video?.url,
  },
];
