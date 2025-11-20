import type { ModelProvider, TaskPollingConfig } from "./providers";

export type UpscaleJob = {
  videoUrl: string;
  upscaleFactor?: string;
  targetResolution?: "1080p" | "2k" | "4k";
  targetFps?: "30fps" | "60fps";
  acceleration?: "regular" | "high" | "full";
  colorFix?: boolean;
  quality?: number;
  preserveAudio?: boolean;
  outputFormat?: "X264 (.mp4)" | "VP9 (.webm)" | "PRORES4444 (.mov)" | "GIF (.gif)";
  outputQuality?: "low" | "medium" | "high" | "maximum";
  outputWriteMode?: "fast" | "balanced" | "small";
};

export type UpscaleModelSpec = {
  id: string;
  label: string;
  endpoint: string;
  provider?: ModelProvider;
  pricing?: string;
  taskConfig?: TaskPollingConfig;
  mapInput(job: UpscaleJob): Record<string, unknown>;
};

export const UPSCALE_MODELS: UpscaleModelSpec[] = [
  {
    id: "topaz-video-upscaler",
    label: "Topaz Video Upscaler",
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
    mapInput: ({ videoUrl, upscaleFactor }) => ({
      model: "topaz/video-upscale",
      input: {
        video_url: videoUrl,
        ...(upscaleFactor ? { upscale_factor: upscaleFactor } : {}),
      },
    }),
  },
  {
    id: "bytedance-video-upscaler",
    label: "ByteDance Video Upscaler",
    endpoint: "fal-ai/bytedance-upscaler/upscale/video",
    provider: "fal",
    mapInput: ({ videoUrl, targetResolution, targetFps }) => {
      return {
        video_url: videoUrl,
        target_resolution: targetResolution ?? "1080p",
        target_fps: targetFps ?? "30fps",
      };
    },
  },
  {
    id: "flashvsr-video-upscaler",
    label: "FlashVSR Video Upscaler",
    endpoint: "fal-ai/flashvsr/upscale/video",
    provider: "fal",
    mapInput: ({
      videoUrl,
      upscaleFactor,
      acceleration,
      colorFix,
      quality,
      preserveAudio,
      outputFormat,
      outputQuality,
      outputWriteMode,
    }) => {
      const numericFactor = upscaleFactor ? Number(upscaleFactor) : undefined;
      return {
        video_url: videoUrl,
        ...(numericFactor && Number.isFinite(numericFactor)
          ? { upscale_factor: numericFactor }
          : {}),
        ...(acceleration ? { acceleration } : {}),
        ...(colorFix !== undefined ? { color_fix: colorFix } : {}),
        ...(quality !== undefined ? { quality } : {}),
        ...(preserveAudio !== undefined ? { preserve_audio: preserveAudio } : {}),
        ...(outputFormat ? { output_format: outputFormat } : {}),
        ...(outputQuality ? { output_quality: outputQuality } : {}),
        ...(outputWriteMode ? { output_write_mode: outputWriteMode } : {}),
      };
    },
  },
];
