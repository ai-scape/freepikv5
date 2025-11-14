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
  taskConfig?: TaskPollingConfig;
  adapter?: {
    mapInput(unified: UnifiedPayload): Record<string, FalInputValue>;
    getVideoUrl(data: unknown): string | undefined;
  };
};

export type UnifiedPayload = {
  modelId: string;
  prompt: string;
  start_frame_url: string;
  end_frame_url?: string;
  duration?: string | number;
  aspect_ratio?: string;
  resolution?: string;
  fps?: number;
  generate_audio?: boolean;
  negative_prompt?: string;
  cfg_scale?: number;
  prompt_optimizer?: boolean;
};

const jsonSpecs =
  (specs.models as unknown as ModelSpec[])?.map((spec) => ({
    ...spec,
    label: spec.label ?? spec.id,
    provider: spec.provider ?? "fal",
  })) ?? [];

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
    taskConfig: extra.taskConfig,
    adapter: {
      mapInput: (unified) =>
        extra.mapInput({
          prompt: unified.prompt,
          startUrl: unified.start_frame_url,
          endUrl: unified.end_frame_url,
          aspectRatio: unified.aspect_ratio,
          resolution: unified.resolution,
        }),
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

type FalInputValue = string | number | boolean | undefined;

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
