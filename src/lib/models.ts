import specs from "./models.json";
import {
  EXTRA_MODELS,
  type ModelSpec as ExtraModelSpec,
} from "./models-extra";
import type {
  ModelProvider,
  TaskPollingConfig,
} from "./providers";

type SupportFlag = boolean | "unstable" | "unspecified";

export type ParamType = "string" | "enum" | "number" | "boolean";

export type ParamDefinition = {
  type: ParamType;
  required?: boolean;
  values?: Array<string | number>;
  default?: string | number | boolean;
  uiKey?: keyof UnifiedPayload;
};

export type ModelSpec = {
  id: string;
  endpoint: string;
  provider?: ModelProvider;
  label?: string;
  supports: {
    startFrame: SupportFlag;
    endFrame: SupportFlag;
    audio: SupportFlag;
    resolution: SupportFlag;
    aspectRatio: SupportFlag;
    fps: SupportFlag;
  };
  params: Record<string, ParamDefinition | undefined>;
  output: {
    videoPath: string;
  };
  referenceImages?: {
    min?: number;
    max: number;
  };
  taskConfig?: TaskPollingConfig;
  adapter?: {
    mapInput(unified: UnifiedPayload): Record<string, FalInputValue>;
    getVideoUrl(data: unknown): string | undefined;
  };
};

export type UnifiedPayload = {
  modelId: string;
  prompt: string;
  start_frame_url?: string;
  end_frame_url?: string;
  duration?: string | number;
  aspect_ratio?: string;
  resolution?: string;
  fps?: number;
  generate_audio?: boolean;
  negative_prompt?: string;
  cfg_scale?: number;
  prompt_optimizer?: boolean;
  reference_image_urls?: string[];
  enable_prompt_expansion?: boolean;
  enable_translation?: boolean;
  watermark?: string;
  seed?: number;
};

const jsonSpecs =
  (specs.models as unknown as ModelSpec[])?.map((spec) => ({
    ...spec,
    label: spec.label ?? spec.id,
    provider: spec.provider ?? "fal",
  })) ?? [];

const kling25 = jsonSpecs.find((spec) => spec.id === "kling-2.5-pro");
if (kling25) {
  kling25.provider = "kie";
  kling25.endpoint = "/api/v1/jobs/createTask";
  kling25.taskConfig = {
    statusEndpoint: "/api/v1/jobs/recordInfo",
    statePath: "data.state",
    successStates: ["success"],
    failureStates: ["fail"],
    responseDataPath: "data",
    pollIntervalMs: 4000,
  };
  kling25.adapter = {
    mapInput: (unified) => {
      if (!unified.start_frame_url) {
        throw new Error("Start frame is required for Kling 2.5 Pro.");
      }
      const input: Record<string, string | number> & {
        prompt: string;
        image_url: string;
      } = {
        prompt: unified.prompt,
        image_url: unified.start_frame_url,
      };
      if (unified.duration !== undefined) {
        input.duration = String(unified.duration);
      }
      if (unified.negative_prompt) {
        input.negative_prompt = unified.negative_prompt;
      }
      if (typeof unified.cfg_scale === "number") {
        input.cfg_scale = unified.cfg_scale;
      }
      return {
        model: "kling/v2-5-turbo-image-to-video-pro",
        input,
      };
    },
    getVideoUrl: (data) => {
      const json = (data as { resultJson?: string } | undefined)?.resultJson;
      if (typeof json !== "string") return undefined;
      try {
        const parsed = JSON.parse(json) as {
          resultUrls?: string[];
        };
        return (parsed.resultUrls ?? []).find(
          (url): url is string => typeof url === "string" && url.startsWith("http")
        );
      } catch {
        return undefined;
      }
    },
  };
}

const kling21 = jsonSpecs.find((spec) => spec.id === "kling-2.1-pro");
if (kling21) {
  kling21.provider = "kie";
  kling21.endpoint = "/api/v1/jobs/createTask";
  kling21.taskConfig = {
    statusEndpoint: "/api/v1/jobs/recordInfo",
    statePath: "data.state",
    successStates: ["success"],
    failureStates: ["fail"],
    responseDataPath: "data",
    pollIntervalMs: 4000,
  };
  kling21.adapter = {
    mapInput: (unified) => {
      if (!unified.start_frame_url) {
        throw new Error("Start frame is required for Kling 2.1 Pro.");
      }
      const input: Record<string, string | number> & {
        prompt: string;
        image_url: string;
      } = {
        prompt: unified.prompt,
        image_url: unified.start_frame_url,
      };
      if (unified.end_frame_url) {
        input.tail_image_url = unified.end_frame_url;
      }
      if (unified.duration !== undefined) {
        input.duration = String(unified.duration);
      }
      if (unified.negative_prompt) {
        input.negative_prompt = unified.negative_prompt;
      }
      if (typeof unified.cfg_scale === "number") {
        input.cfg_scale = unified.cfg_scale;
      }
      return {
        model: "kling/v2-1-pro",
        input,
      };
    },
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
  };
}

const hailuo23 = jsonSpecs.find((spec) => spec.id === "hailuo-2.3-pro");
if (hailuo23) {
  hailuo23.provider = "kie";
  hailuo23.endpoint = "/api/v1/jobs/createTask";
  hailuo23.taskConfig = {
    statusEndpoint: "/api/v1/jobs/recordInfo",
    statePath: "data.state",
    successStates: ["success"],
    failureStates: ["fail"],
    responseDataPath: "data",
    pollIntervalMs: 4000,
  };
  hailuo23.adapter = {
    mapInput: (unified) => {
      if (!unified.start_frame_url) {
        throw new Error("Start frame is required for Hailuo 2.3.");
      }
      const input: Record<string, string | number | boolean> & {
        prompt: string;
        image_url: string;
      } = {
        prompt: unified.prompt,
        image_url: unified.start_frame_url,
      };
      if (unified.duration !== undefined) {
        input.duration = String(unified.duration);
      }
      if (unified.resolution) {
        input.resolution = unified.resolution;
      }
      if (typeof unified.prompt_optimizer === "boolean") {
        input.prompt_optimizer = unified.prompt_optimizer;
      }
      return {
        model: "hailuo/2-3-image-to-video-pro",
        input,
      };
    },
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
  };
}

const VEO_CONFIG: Record<
  string,
  {
    apiModel: "veo3" | "veo3_fast";
    generationType: "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO";
    requiresStart: boolean;
    allowEnd?: boolean;
    reference?: { min?: number; max: number };
  }
> = {
  "veo-3.1-quality-text": {
    apiModel: "veo3",
    generationType: "TEXT_2_VIDEO",
    requiresStart: false,
  },
  "veo-3.1-quality-firstlast": {
    apiModel: "veo3",
    generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
    requiresStart: true,
    allowEnd: true,
  },
  "veo-3.1-fast-text": {
    apiModel: "veo3_fast",
    generationType: "TEXT_2_VIDEO",
    requiresStart: false,
  },
  "veo-3.1-fast-firstlast": {
    apiModel: "veo3_fast",
    generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
    requiresStart: true,
    allowEnd: true,
  },
  "veo-3.1-fast-reference": {
    apiModel: "veo3_fast",
    generationType: "REFERENCE_2_VIDEO",
    requiresStart: false,
    reference: { min: 1, max: 3 },
  },
};

for (const [modelId, config] of Object.entries(VEO_CONFIG)) {
  const target = jsonSpecs.find((spec) => spec.id === modelId);
  if (!target) continue;
  target.provider = "kie";
  target.endpoint = "/api/v1/jobs/createTask";
  target.taskConfig = {
    statusEndpoint: "/api/v1/jobs/recordInfo",
    statePath: "data.state",
    successStates: ["success"],
    failureStates: ["fail"],
    responseDataPath: "data",
    pollIntervalMs: 4000,
  };
  if (config.reference) {
    target.referenceImages = config.reference;
  }
  target.adapter = {
    mapInput: (unified) => {
      const aspectRatio = unified.aspect_ratio ?? "16:9";
      if (
        config.generationType === "REFERENCE_2_VIDEO" &&
        aspectRatio !== "16:9"
      ) {
        throw new Error("Veo reference mode only supports 16:9 aspect ratio.");
      }
      const imageUrls: string[] = [];
      if (config.requiresStart) {
        if (!unified.start_frame_url) {
          throw new Error("Start frame is required for this Veo model.");
        }
        imageUrls.push(unified.start_frame_url);
        if (config.allowEnd && unified.end_frame_url) {
          imageUrls.push(unified.end_frame_url);
        }
      }
      if (config.reference && unified.reference_image_urls?.length) {
        imageUrls.push(
          ...unified.reference_image_urls.slice(0, config.reference.max)
        );
      }
      return {
        model: config.apiModel,
        generationType: config.generationType,
        prompt: unified.prompt,
        ...(imageUrls.length ? { imageUrls } : {}),
        aspectRatio,
        ...(unified.enable_translation !== undefined
          ? { enableTranslation: unified.enable_translation }
          : {}),
        ...(unified.enable_prompt_expansion !== undefined
          ? { enablePromptExpansion: unified.enable_prompt_expansion }
          : {}),
        ...(unified.seed !== undefined ? { seeds: unified.seed } : {}),
      };
    },
    getVideoUrl: (data) => {
      const json = (data as { resultJson?: string } | undefined)?.resultJson;
      if (typeof json !== "string") return undefined;
      try {
        const parsed = JSON.parse(json) as { resultUrls?: string[] };
        return (parsed.resultUrls ?? []).find(
          (url) => typeof url === "string" && url.startsWith("http")
        );
      } catch {
        return undefined;
      }
    },
  };
}

const RESOLUTION_CONFIG: Record<
  string,
  { values: Array<string | number>; default: string | number }
> = {
  "seedance-pro-fast": {
    values: ["480p", "720p", "1080p"],
    default: "1080p",
  },
  "seedance-pro": {
    values: ["480p", "720p", "1080p"],
    default: "1080p",
  },
  "wan-2.2-turbo": {
    values: ["480p", "580p", "720p"],
    default: "720p",
  },
};

const ASPECT_RATIO_CONFIG: Record<
  string,
  { values: Array<string | number>; default: string | number }
> = {
  "seedance-pro-fast": {
    values: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    default: "auto",
  },
  "seedance-pro": {
    values: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    default: "auto",
  },
  "wan-2.2-turbo": {
    values: ["auto", "16:9", "9:16", "1:1"],
    default: "auto",
  },
};

const extraSpecs: ModelSpec[] = EXTRA_MODELS.map((extra: ExtraModelSpec): ModelSpec => {
  const supports: ModelSpec["supports"] = {
    startFrame: true,
    endFrame: extra.supportsEnd,
    audio: false,
    resolution: Boolean(RESOLUTION_CONFIG[extra.id]),
    aspectRatio: Boolean(ASPECT_RATIO_CONFIG[extra.id]),
    fps: false,
  };

  const params: Record<string, ParamDefinition | undefined> = {
    prompt: { type: "string", required: true },
    start_frame_url: {
      type: "string",
      required: true,
      uiKey: "start_frame_url",
    },
    ...(extra.supportsEnd
      ? {
          end_frame_url: {
            type: "string",
            required: false,
            uiKey: "end_frame_url",
          },
        }
      : {}),
  };

  const resolutionConfig = RESOLUTION_CONFIG[extra.id];
  if (resolutionConfig) {
    params.resolution = {
      type: "enum",
      values: resolutionConfig.values,
      default: resolutionConfig.default,
    };
  }

  const aspectConfig = ASPECT_RATIO_CONFIG[extra.id];
  if (aspectConfig) {
    params.aspect_ratio = {
      type: "enum",
      values: aspectConfig.values,
      default: aspectConfig.default,
    };
  }

  return {
    id: extra.id,
    endpoint: extra.endpoint,
    provider: extra.provider ?? "fal",
    label: extra.label,
    supports,
    params,
    output: {
      videoPath: "video.url",
    },
    referenceImages: extra.referenceImages,
    taskConfig: extra.taskConfig,
    adapter: {
      mapInput: (unified) => {
        if (!unified.start_frame_url) {
          throw new Error("Start frame is required for this model.");
        }
        return extra.mapInput({
          prompt: unified.prompt,
          startUrl: unified.start_frame_url,
          endUrl: unified.end_frame_url,
          aspectRatio: unified.aspect_ratio,
          resolution: unified.resolution,
          promptOptimizer: unified.prompt_optimizer,
        }) as Record<string, FalInputValue>;
      },
      getVideoUrl: (data) => extra.getVideoUrl(data),
    },
  };
});

export const MODEL_SPECS: ModelSpec[] = [...jsonSpecs, ...extraSpecs];

export const MODEL_SPEC_MAP: Record<string, ModelSpec> = Object.fromEntries(
  MODEL_SPECS.map((spec) => [spec.id, spec])
);

export const DEFAULT_MODEL_ID = MODEL_SPECS[0]?.id ?? "";

const SAFE_END_KEYS = new Set(["tail_image_url", "last_frame_url"]);

function isSupportEnabled(flag: SupportFlag): boolean {
  return flag === true;
}

function coerceEnumValue(
  value: unknown,
  allowed: Array<string | number>,
  fallback: string | number | undefined
): string | number | undefined {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (allowed.some((option) => option === value)) {
    return value as string | number;
  }
  return fallback;
}

type FalInputValue =
  | string
  | number
  | boolean
  | undefined
  | Record<string, unknown>
  | string[];

export function buildModelInput(
  model: ModelSpec,
  unified: UnifiedPayload
): Record<string, FalInputValue> {
  if (model.adapter) {
    return model.adapter.mapInput(unified);
  }

  const input: Record<string, FalInputValue> = {};

  for (const [paramKey, definition] of Object.entries(model.params)) {
    if (!definition) continue;
    const uiKey =
      definition.uiKey ??
      (paramKey as keyof UnifiedPayload);
    const unifiedValue = unified[uiKey];

    if (definition.type === "enum" && definition.values) {
      const coerced = coerceEnumValue(
        unifiedValue,
        definition.values,
        definition.default as string | number | undefined
      );
      if (coerced !== undefined) {
        input[paramKey] = coerced;
      } else if (definition.required) {
        throw new Error(`Missing required enum value for ${paramKey}`);
      }
      continue;
    }

    if (unifiedValue !== undefined) {
      input[paramKey] = unifiedValue;
      continue;
    }

    if (definition.default !== undefined) {
      input[paramKey] = definition.default;
      continue;
    }

    if (definition.required) {
      throw new Error(`Missing required param: ${String(uiKey)} → ${paramKey}`);
    }
  }

  if (!isSupportEnabled(model.supports.endFrame)) {
    for (const key of SAFE_END_KEYS) {
      if (key in input) {
        delete input[key];
      }
    }
  } else if (!unified.end_frame_url) {
    for (const key of SAFE_END_KEYS) {
      if (key in input) {
        delete input[key];
      }
    }
  }

  return input;
}

function getPathSegments(path: string): string[] {
  return path.split(".").filter(Boolean);
}

export function extractVideoUrl(
  model: ModelSpec,
  data: unknown
): string | undefined {
  if (model.adapter) {
    return model.adapter.getVideoUrl(data);
  }
  const segments = getPathSegments(model.output.videoPath);
  let current: unknown = data;

  for (const segment of segments) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : undefined;
}
