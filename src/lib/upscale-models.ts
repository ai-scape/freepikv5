import type { ModelProvider, TaskPollingConfig } from "./providers";

export type UpscaleJob = {
  sourceUrl: string;
  upscaleFactor?: string;
  targetResolution?: "1080p" | "2k" | "4k";
  targetFps?: "30fps" | "60fps";
};

export type UpscaleModelSpec = {
  id: string;
  label: string;
  endpoint: string;
  provider?: ModelProvider;
  pricing?: string;
  taskConfig?: TaskPollingConfig;
  kind: "image" | "video";
  mapInput(job: UpscaleJob): Record<string, unknown>;
};

export const UPSCALE_MODELS: UpscaleModelSpec[] = [
  {
    id: "bytedance-video-upscaler",
    label: "ByteDance Video Upscaler",
    endpoint: "fal-ai/bytedance-upscaler/upscale/video",
    provider: "fal",
    pricing: "$0.04/sec (video)",
    kind: "video",
    mapInput: ({ sourceUrl, targetResolution, targetFps }) => ({
      video_url: sourceUrl,
      target_resolution: targetResolution ?? "1080p",
      target_fps: targetFps ?? "30fps",
    }),
  },
  {
    id: "topaz-image-upscale",
    label: "Topaz Image Upscale",
    endpoint: "/api/v1/jobs/createTask",
    provider: "kie",
    pricing: "$0.05/image",
    kind: "image",
    taskConfig: {
      statusEndpoint: "/api/v1/jobs/recordInfo",
      statePath: "data.state",
      successStates: ["success"],
      failureStates: ["fail"],
      responseDataPath: "data",
      pollIntervalMs: 4000,
    },
    mapInput: ({ sourceUrl, upscaleFactor }) => ({
      model: "topaz/image-upscale",
      input: {
        image_url: sourceUrl,
        upscale_factor:
          upscaleFactor && ["1", "2", "4", "8"].includes(upscaleFactor)
            ? upscaleFactor
            : "2",
      },
    }),
  },
  {
    id: "clarity-image-upscale",
    label: "Clarity Upscaler",
    endpoint: "fal-ai/clarity-upscaler",
    provider: "fal",
    pricing: "$0.03/image",
    kind: "image",
    mapInput: ({ sourceUrl, upscaleFactor }) => ({
      image_url: sourceUrl,
      ...(upscaleFactor ? { upscale_factor: Number(upscaleFactor) } : {}),
    }),
  },
];
