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
];
