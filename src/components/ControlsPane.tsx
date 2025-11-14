import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  DEFAULT_MODEL_ID,
  MODEL_SPECS,
  buildModelInput,
  type ParamDefinition,
  type UnifiedPayload,
} from "../lib/models";
import {
  IMAGE_MODELS,
  type ImageJob,
  type ImageSizePreset,
} from "../lib/image-models";
import { getModelPricingLabel } from "../lib/pricing";
import { uploadToFal } from "../lib/fal";
import { extensionFromMime } from "../lib/mime";
import { buildFilename } from "../lib/filename";
import { writeBlob } from "../fs/write";
import { resolvePath } from "../fs/dir";
import { useCatalog } from "../state/catalog";
import { Spinner } from "./ui/Spinner";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";
import {
  callModelEndpoint,
  getProviderEnvVar,
  getProviderKey,
  type ModelProvider,
  type ProviderCallOptions,
} from "../lib/providers";

function formatDateFolder(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type UploadSlot = {
  url?: string;
  preview?: string;
  name?: string;
  uploading: boolean;
  error?: string | null;
};

type ReferenceUpload = {
  id: string;
  url?: string;
  preview: string;
  name: string;
  uploading: boolean;
  error?: string;
};

const createLocalId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `upload-${Math.random().toString(36).slice(2)}`;

const DEFAULT_MODEL_KEY = MODEL_SPECS.length
  ? `video:${DEFAULT_MODEL_ID || MODEL_SPECS[0].id}`
  : IMAGE_MODELS.length
    ? `image:${IMAGE_MODELS[0].id}`
    : "";

export default function ControlsPane() {
  const {
    state: { project },
    actions: { refreshTree },
  } = useCatalog();
  const [modelKey, setModelKey] = useState(DEFAULT_MODEL_KEY);
  const [prompt, setPrompt] = useState("");
  const [startFrame, setStartFrame] = useState<UploadSlot>({ uploading: false });
  const [endFrame, setEndFrame] = useState<UploadSlot>({ uploading: false });
  const [seed, setSeed] = useState("");
  const [referenceUploads, setReferenceUploads] = useState<ReferenceUpload[]>([]);
  const [size, setSize] = useState<ImageSizePreset>("square_hd");
  const [steps, setSteps] = useState("");
  const [temporal, setTemporal] = useState(true);
  const [imageResolution, setImageResolution] = useState("1K");
  const [maxImages, setMaxImages] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isStartDragActive, setIsStartDragActive] = useState(false);
  const [isEndDragActive, setIsEndDragActive] = useState(false);
  const [isReferenceDragActive, setIsReferenceDragActive] = useState(false);

  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
  const referenceInputRef = useRef<HTMLInputElement | null>(null);
  const previewRegistry = useRef(new Set<string>());
  const [paramValues, setParamValues] = useState<
    Record<string, string | number | boolean | undefined>
  >({});

  const modelKind = modelKey.startsWith("image:") ? "image" : "video";

  const selectedVideo = useMemo(() => {
    if (modelKind !== "video") return undefined;
    const id = modelKey.replace("video:", "");
    return MODEL_SPECS.find((spec) => spec.id === id);
  }, [modelKey, modelKind]);

  const selectedImage = useMemo(() => {
    if (modelKind !== "image") return undefined;
    const id = modelKey.replace("image:", "");
    return IMAGE_MODELS.find((spec) => spec.id === id);
  }, [modelKey, modelKind]);

  const pricingLabel = useMemo(() => {
    if (selectedVideo) return getModelPricingLabel(selectedVideo.id);
    if (selectedImage) return getModelPricingLabel(selectedImage.id);
    return undefined;
  }, [selectedVideo, selectedImage]);

  const supportsStartFrame = selectedVideo?.supports.startFrame !== false;
  const supportsEndFrame = selectedVideo?.supports.endFrame === true;
  const videoReferenceConfig = selectedVideo?.referenceImages;
  const referenceLimit =
    modelKind === "video"
      ? videoReferenceConfig?.max ?? 0
      : selectedImage?.maxRefs ?? 0;
  const referenceMin =
    modelKind === "video" ? videoReferenceConfig?.min ?? 0 : 0;
  const registerPreview = useCallback((url: string) => {
    previewRegistry.current.add(url);
    return url;
  }, []);

  const releasePreview = useCallback((url?: string) => {
    if (url && previewRegistry.current.has(url)) {
      URL.revokeObjectURL(url);
      previewRegistry.current.delete(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      previewRegistry.current.forEach((url) => URL.revokeObjectURL(url));
      previewRegistry.current.clear();
    };
  }, []);

  useEffect(() => {
    if (selectedImage?.id !== "seedream-v4-edit") {
      setImageResolution("1K");
      setMaxImages("1");
    }
  }, [selectedImage?.id]);

  const parseSeed = () => {
    if (!seed.trim()) return undefined;
    const numeric = Number(seed);
    return Number.isNaN(numeric) ? undefined : numeric;
  };

  const extractFilesFromDataTransfer = useCallback(
    async (dataTransfer: DataTransfer | null): Promise<File[]> => {
      if (!dataTransfer) return [];
      if (dataTransfer.files && dataTransfer.files.length > 0) {
        return Array.from(dataTransfer.files);
      }
      const relPath = dataTransfer.getData(FILE_ENTRY_MIME);
      if (relPath && project) {
        try {
          const resolved = await resolvePath(project, relPath);
          if (resolved.file) {
            const file = await resolved.file.getFile();
            return [file];
          }
        } catch {
          return [];
        }
      }
      return [];
    },
    [project]
  );

  const handleStartFrameSelect = useCallback(
    async (file: File | null) => {
      setStartFrame((previous) => {
        if (previous.preview) {
          releasePreview(previous.preview);
        }
        return { uploading: false };
      });
      if (!file) return;
      const preview = registerPreview(URL.createObjectURL(file));
      setStartFrame({
        uploading: true,
        preview,
        name: file.name,
      });
      try {
        const url = await uploadToFal(file);
        setStartFrame((prev) => ({
          ...prev,
          uploading: false,
          url,
          error: null,
        }));
      } catch (error) {
        setStartFrame((prev) => ({
          ...prev,
          uploading: false,
          error: error instanceof Error ? error.message : "Upload failed.",
        }));
      }
    },
    [registerPreview, releasePreview]
  );

  const handleEndFrameSelect = useCallback(
    async (file: File | null) => {
      setEndFrame((previous) => {
        if (previous.preview) {
          releasePreview(previous.preview);
        }
        return { uploading: false };
      });
      if (!file) return;
      const preview = registerPreview(URL.createObjectURL(file));
      setEndFrame({
        uploading: true,
        preview,
        name: file.name,
      });
      try {
        const url = await uploadToFal(file);
        setEndFrame((prev) => ({
          ...prev,
          uploading: false,
          url,
          error: null,
        }));
      } catch (error) {
        setEndFrame((prev) => ({
          ...prev,
          uploading: false,
          error: error instanceof Error ? error.message : "Upload failed.",
        }));
      }
    },
    [registerPreview, releasePreview]
  );

  const handleReferenceFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const limit =
        modelKind === "video"
          ? videoReferenceConfig?.max ?? 0
          : selectedImage?.maxRefs ?? 0;
      if (limit === 0) {
        setStatus("This model does not accept reference uploads.");
        return;
      }
      const currentCount = referenceUploads.length;
      const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      let allowedFiles = validFiles;
      if (limit > 0) {
        const remaining = Math.max(0, limit - currentCount);
        if (remaining === 0) {
          const scope = modelKind === "video" ? "This model" : "This pipeline";
          setStatus(
            `${scope} allows up to ${limit} reference image${limit === 1 ? "" : "s"}. Remove one to add another.`
          );
          return;
        }
        allowedFiles = validFiles.slice(0, remaining);
      }
      if (!allowedFiles.length) {
        if (!validFiles.length) {
          setStatus("Please drop image files.");
        }
        return;
      }
      for (const file of allowedFiles) {
        const preview = registerPreview(URL.createObjectURL(file));
        const id = createLocalId();
        setReferenceUploads((prev) => [
          ...prev,
          {
            id,
            preview,
            name: file.name,
            uploading: true,
          },
        ]);
        try {
          const url = await uploadToFal(file);
          setReferenceUploads((prev) =>
            prev.map((entry) =>
              entry.id === id
                ? { ...entry, url, uploading: false, error: undefined }
                : entry
            )
          );
        } catch (error) {
          setReferenceUploads((prev) =>
            prev.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    uploading: false,
                    error:
                      error instanceof Error
                        ? error.message
                        : "Upload failed.",
                  }
                : entry
            )
          );
        }
      }
    },
    [
      modelKind,
      registerPreview,
      referenceUploads.length,
      selectedImage,
      setStatus,
      videoReferenceConfig?.max,
    ]
  );

  const removeReference = useCallback(
    (id: string) => {
      setReferenceUploads((prev) => {
        const target = prev.find((entry) => entry.id === id);
        if (target) {
          releasePreview(target.preview);
        }
        return prev.filter((entry) => entry.id !== id);
      });
    },
    [releasePreview]
  );

  const uploadedReferenceUrls = referenceUploads
    .filter((entry) => Boolean(entry.url))
    .map((entry) => entry.url as string);

  const imageReferenceUrls =
    modelKind === "image" && (selectedImage?.maxRefs ?? 0) !== 0
      ? uploadedReferenceUrls
      : [];

  const videoReferenceUrls =
    modelKind === "video" && videoReferenceConfig
      ? uploadedReferenceUrls
      : [];

  const handleStartFrameDrop = useCallback(
    async (dataTransfer: DataTransfer | null) => {
      const files = await extractFilesFromDataTransfer(dataTransfer);
      const file = files.find((candidate) =>
        candidate.type.startsWith("image/")
      );
      void handleStartFrameSelect(file ?? null);
    },
    [extractFilesFromDataTransfer, handleStartFrameSelect]
  );

  const handleEndFrameDrop = useCallback(
    async (dataTransfer: DataTransfer | null) => {
      const files = await extractFilesFromDataTransfer(dataTransfer);
      const file = files.find((candidate) =>
        candidate.type.startsWith("image/")
      );
      void handleEndFrameSelect(file ?? null);
    },
    [extractFilesFromDataTransfer, handleEndFrameSelect]
  );

  const handleReferenceDrop = useCallback(
    async (dataTransfer: DataTransfer | null) => {
      const files = await extractFilesFromDataTransfer(dataTransfer);
      if (files.length) {
        await handleReferenceFiles(files);
      }
    },
    [extractFilesFromDataTransfer, handleReferenceFiles]
  );

  const pendingUploads =
    startFrame.uploading ||
    endFrame.uploading ||
    referenceUploads.some((entry) => entry.uploading);

  useEffect(() => {
    if (!selectedVideo) {
      setParamValues({});
      return;
    }
    const defaults: Record<string, string | number | boolean | undefined> = {};
    const entries = Object.entries(selectedVideo.params) as Array<
      [string, ParamDefinition | undefined]
    >;
    entries.forEach(([key, definition]) => {
      if (!definition) return;
      const uiKey =
        definition.uiKey ?? (key as keyof UnifiedPayload);
      if (uiKey === "start_frame_url" || uiKey === "end_frame_url") {
        return;
      }
      if (definition.default !== undefined) {
        defaults[uiKey] = definition.default as
          | string
          | number
          | boolean
          | undefined;
      } else {
        defaults[uiKey] =
          definition.type === "boolean" ? false : undefined;
      }
    });
    setParamValues(defaults);
  }, [selectedVideo]);

  useEffect(() => {
    const limit =
      modelKind === "video"
        ? videoReferenceConfig?.max ?? 0
        : selectedImage?.maxRefs ?? 0;
    if (limit === 0) {
      if (referenceUploads.length) {
        setReferenceUploads([]);
      }
      return;
    }
    if (referenceUploads.length > limit) {
      setReferenceUploads((prev) => prev.slice(0, limit));
    }
  }, [
    modelKind,
    selectedImage?.maxRefs,
    videoReferenceConfig?.max,
    referenceUploads.length,
  ]);

  const handleParamChange = (
    key: string,
    value: string | number | boolean | undefined
  ) => {
    setParamValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderParamControl = (
    key: string,
    definition?: ParamDefinition
  ) => {
    if (!selectedVideo || !definition) return null;
    const uiKey =
      definition.uiKey ??
      (key as keyof UnifiedPayload);
    if (uiKey === "start_frame_url" || uiKey === "end_frame_url") {
      return null;
    }
    const value = paramValues[uiKey];
    if (definition.type === "enum" && definition.values) {
      return (
        <div
          key={key}
          className="space-y-1"
        >
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {key.replace(/_/g, " ")}
          </label>
          <select
            value={value === undefined ? "" : String(value)}
            onChange={(event) =>
              handleParamChange(
                uiKey as string,
                event.target.value === ""
                  ? undefined
                  : definition.values?.[0] &&
                      typeof definition.values[0] === "number"
                    ? Number(event.target.value)
                    : event.target.value
              )
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
          >
            <option value="">
              {definition.required ? "Select..." : "Default"}
            </option>
            {definition.values.map((option: string | number) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ))}
          </select>
        </div>
      );
    }
    if (definition.type === "boolean") {
      return (
        <label
          key={key}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300"
        >
          <span>{key.replace(/_/g, " ")}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              handleParamChange(uiKey as string, event.target.checked)
            }
          />
        </label>
      );
    }
    const isNumber = definition.type === "number";
    return (
      <div
        key={key}
        className="space-y-1"
      >
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {key.replace(/_/g, " ")}
        </label>
        <input
          type={isNumber ? "number" : "text"}
          value={
            value === undefined ? "" : isNumber ? Number(value) : String(value)
          }
          onChange={(event) =>
            handleParamChange(
              uiKey as string,
              event.target.value === ""
                ? undefined
                : isNumber
                  ? Number(event.target.value)
                  : event.target.value
            )
          }
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
        />
      </div>
    );
  };

  const handleGenerate = async (event: FormEvent) => {
    event.preventDefault();
    if (!project) {
      setStatus("Pick a project folder before generating.");
      return;
    }
    if (!prompt.trim()) {
      setStatus("Prompt is required.");
      return;
    }
    if (pendingUploads) {
      setStatus("Uploads in progress. Please wait until they complete.");
      return;
    }
    setBusy(true);
    setStatus("Starting render…");

    try {
      let endpoint: string | undefined;
      let payload: Record<string, unknown> | undefined;
      let modelId: string | undefined;
      let category: "image" | "video" | undefined;
      let provider: ModelProvider = "fal";
      let callOptions: ProviderCallOptions | undefined;

      if (modelKind === "video" && selectedVideo) {
        if (supportsStartFrame && !startFrame.url) {
          throw new Error("Start frame is required.");
        }
        if (
          videoReferenceConfig?.min &&
          videoReferenceUrls.length < videoReferenceConfig.min
        ) {
          throw new Error(
            `Add at least ${videoReferenceConfig.min} reference image${
              videoReferenceConfig.min === 1 ? "" : "s"
            }.`
          );
        }

        const unified: UnifiedPayload = {
          modelId: selectedVideo.id,
          prompt: prompt.trim(),
        };
        if (supportsStartFrame && startFrame.url) {
          unified.start_frame_url = startFrame.url;
        }

        if (supportsEndFrame && endFrame.url) {
          unified.end_frame_url = endFrame.url;
        }

        Object.entries(selectedVideo.params).forEach(([key, definition]) => {
          if (!definition) return;
          const uiKey =
            definition.uiKey ??
            (key as keyof UnifiedPayload);
          if (
            uiKey === "prompt" ||
            uiKey === "start_frame_url" ||
            uiKey === "end_frame_url"
          ) {
            return;
          }
          const rawValue = paramValues[uiKey as string];
          if (rawValue === undefined || rawValue === "") {
            if (definition.default !== undefined) {
              (unified as Record<string, unknown>)[uiKey as string] =
                definition.default;
            }
            return;
          }
          (unified as Record<string, unknown>)[uiKey as string] = rawValue;
        });

        if (videoReferenceUrls.length) {
          unified.reference_image_urls = videoReferenceUrls;
        }

        const parsedSeed = parseSeed();
        if (parsedSeed !== undefined) {
          unified.seed = parsedSeed;
        }

        endpoint = selectedVideo.endpoint;
        payload = buildModelInput(selectedVideo, unified);
        modelId = selectedVideo.id;
        category = "video";
        provider = selectedVideo.provider ?? "fal";
        callOptions = selectedVideo.taskConfig
          ? { taskConfig: selectedVideo.taskConfig }
          : undefined;
      } else if (modelKind === "image" && selectedImage) {
        if (
          (selectedImage.maxRefs ?? 0) > 0 &&
          imageReferenceUrls.length === 0
        ) {
          throw new Error("Add at least one reference image.");
        }

        const stepsValue = steps.trim() ? Number(steps) : undefined;
        if (stepsValue !== undefined && Number.isNaN(stepsValue)) {
          throw new Error("Steps must be a number.");
        }

        const parsedMaxImages =
          selectedImage.id === "seedream-v4-edit"
            ? (() => {
                const value = Number(maxImages);
                if (Number.isNaN(value)) return 1;
                return Math.min(6, Math.max(1, Math.round(value)));
              })()
            : undefined;

        const imageJob: ImageJob = {
          prompt: prompt.trim(),
          imageUrls: imageReferenceUrls,
          size,
          seed: parseSeed(),
          temporal: selectedImage.id === "chrono-edit" ? temporal : undefined,
          steps: stepsValue,
          imageResolution:
            selectedImage.id === "seedream-v4-edit" ? imageResolution : undefined,
          maxImages: parsedMaxImages,
        };

        endpoint = selectedImage.endpoint;
        payload = selectedImage.mapInput(imageJob);
        modelId = selectedImage.id;
        category = "image";
        provider = selectedImage.provider ?? "fal";
        callOptions = selectedImage.taskConfig
          ? { taskConfig: selectedImage.taskConfig }
          : undefined;
      } else {
        throw new Error("Select a model to continue.");
      }

      if (!endpoint || !payload || !modelId || !category) {
        throw new Error("Model configuration is incomplete.");
      }
      if (!getProviderKey(provider)) {
        throw new Error(
          `Missing ${getProviderEnvVar(provider)} in the environment.`
        );
      }

      const result = await callModelEndpoint(provider, endpoint, payload, callOptions);
      if (!result.blob) {
        throw new Error("Provider response did not include a binary output.");
      }

      const extension = extensionFromMime(
        result.blob.type || (category === "image" ? "image/png" : "video/mp4")
      );
      const folder = category === "image" ? "images" : "videos";
      const relPath = `${folder}/${formatDateFolder(new Date())}/${buildFilename(
        modelId,
        prompt,
        extension,
        seed.trim() ? seed.trim() : undefined
      )}`;

      await writeBlob(project, relPath, result.blob);
      await refreshTree(relPath);
      setStatus(`Saved render to ${relPath}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex h-full flex-col text-sm" onSubmit={handleGenerate}>
      <div className="flex-1 space-y-3 pb-40">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Model
          </label>
          <select
            value={modelKey}
            onChange={(event) => setModelKey(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
          >
            <optgroup label="Video Pipelines">
              {MODEL_SPECS.map((spec) => (
                <option key={spec.id} value={`video:${spec.id}`}>
                  {spec.label ?? spec.id}
                </option>
              ))}
            </optgroup>
            <optgroup label="Image Pipelines">
              {IMAGE_MODELS.map((spec) => (
                <option key={spec.id} value={`image:${spec.id}`}>
                  {spec.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {modelKind === "video" ? (
          <div className="space-y-3">
            {supportsStartFrame ? (
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[160px] space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Start frame (required)
                  </label>
                  <div
                    className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent px-3 py-3 transition ${
                      isStartDragActive ? "border-sky-400 shadow-lg shadow-sky-500/20" : ""
                    }`}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsStartDragActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsStartDragActive(false);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsStartDragActive(true);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsStartDragActive(false);
                      void handleStartFrameDrop(event.dataTransfer);
                    }}
                  >
                    <input
                      ref={startInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleStartFrameSelect(file);
                        event.target.value = "";
                      }}
                    />
                    {startFrame.preview ? (
                      <img
                        src={startFrame.preview}
                        alt="Start frame preview"
                        className="h-32 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-32 flex-col items-center justify-center text-xs text-slate-400">
                        Drag & drop <br /> first frame
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                      <button
                        type="button"
                        className="rounded-full border border-white/20 px-3 py-1 font-semibold transition hover:border-sky-400 hover:text-sky-200"
                        onClick={() => startInputRef.current?.click()}
                      >
                        Browse
                      </button>
                      {startFrame.uploading ? (
                        <span className="inline-flex items-center gap-1 text-sky-200">
                          <Spinner size="sm" /> Uploading…
                        </span>
                      ) : startFrame.url ? (
                        <span className="text-emerald-300">Ready</span>
                      ) : null}
                      {startFrame.name ? (
                        <span className="truncate text-slate-500">{startFrame.name}</span>
                      ) : null}
                      {startFrame.url || startFrame.preview ? (
                        <button
                          type="button"
                          className="rounded-full border border-white/10 px-3 py-1 font-semibold text-slate-200 hover:border-rose-400 hover:text-rose-200"
                          onClick={() => handleStartFrameSelect(null)}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {supportsEndFrame ? (
                  <div className="flex-1 min-w-[160px] space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      End frame (optional)
                    </label>
                    <div
                      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent px-3 py-3 transition ${
                        isEndDragActive ? "border-sky-400 shadow-lg shadow-sky-500/20" : ""
                      }`}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsEndDragActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setIsEndDragActive(false);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsEndDragActive(true);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsEndDragActive(false);
                        void handleEndFrameDrop(event.dataTransfer);
                      }}
                    >
                      <input
                        ref={endInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleEndFrameSelect(file);
                          event.target.value = "";
                        }}
                      />
                      {endFrame.preview ? (
                        <img
                          src={endFrame.preview}
                          alt="End frame preview"
                          className="h-32 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center text-xs text-slate-400">
                          Drag & drop <br /> last frame
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                        <button
                          type="button"
                          className="rounded-full border border-white/20 px-3 py-1 font-semibold transition hover:border-sky-400 hover:text-sky-200"
                          onClick={() => endInputRef.current?.click()}
                        >
                          Browse
                        </button>
                        {endFrame.uploading ? (
                          <span className="inline-flex items-center gap-1 text-sky-200">
                            <Spinner size="sm" /> Uploading…
                          </span>
                        ) : endFrame.url ? (
                          <span className="text-emerald-300">Ready</span>
                        ) : null}
                        {endFrame.name ? (
                          <span className="truncate text-slate-500">{endFrame.name}</span>
                        ) : null}
                        {endFrame.url || endFrame.preview ? (
                          <button
                            type="button"
                            className="rounded-full border border-white/10 px-3 py-1 font-semibold text-slate-200 hover:border-rose-400 hover:text-rose-200"
                            onClick={() => handleEndFrameSelect(null)}
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Size Preset
              </label>
              <select
                value={size}
                onChange={(event) =>
                  setSize(event.target.value as ImageSizePreset)
                }
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              >
                {[
                  "square_hd",
                  "square",
                  "portrait_4_3",
                  "portrait_16_9",
                  "landscape_4_3",
                  "landscape_16_9",
                ].map((preset) => (
                  <option key={preset} value={preset}>
                    {preset.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Steps
              </label>
              <input
                type="number"
                min={1}
                value={steps}
                onChange={(event) => setSteps(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>

          {selectedImage?.id === "chrono-edit" ? (
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <input
                type="checkbox"
                checked={temporal}
                onChange={(event) => setTemporal(event.target.checked)}
              />
              Temporal reasoning
            </label>
          ) : null}

          {selectedImage?.id === "seedream-v4-edit" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Image resolution
                </label>
                <select
                  value={imageResolution}
                  onChange={(event) => setImageResolution(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                >
                  {["1K", "2K", "4K"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Max images
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={maxImages}
                  onChange={(event) => setMaxImages(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </div>
            </div>
          ) : null}
        </>
      )}

      {referenceLimit > 0 ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Reference images
          </label>
          <div
            className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent px-3 py-4 transition ${
              isReferenceDragActive ? "border-sky-400 shadow-lg shadow-sky-500/20" : ""
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsReferenceDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsReferenceDragActive(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsReferenceDragActive(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsReferenceDragActive(false);
              void handleReferenceDrop(event.dataTransfer);
            }}
          >
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                void handleReferenceFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
              <span>
                {modelKind === "video"
                  ? "Drag & drop supporting stills or click browse."
                  : "Drag & drop reference frames or click browse."}
              </span>
              <span className="text-[11px] text-slate-500">
                Slots: {Math.max(0, referenceLimit - referenceUploads.length)} / {referenceLimit}
              </span>
            </div>
            {referenceMin ? (
              <div className="mt-1 text-[11px] text-slate-500">
                Requires at least {referenceMin} image{referenceMin === 1 ? "" : "s"}.
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200"
                onClick={() => referenceInputRef.current?.click()}
              >
                Browse files
              </button>
              {referenceUploads.some((entry) => entry.uploading) ? (
                <span className="inline-flex items-center gap-1 text-sky-200">
                  <Spinner size="sm" /> Uploading…
                </span>
              ) : null}
            </div>
            {referenceUploads.length ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {referenceUploads.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs"
                  >
                    <div className="relative">
                      <img
                        src={entry.preview}
                        alt={entry.name}
                        className="h-20 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-rose-500/80"
                        onClick={() => removeReference(entry.id)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-2 truncate font-semibold text-white">
                      {entry.name}
                    </div>
                    <div className="text-slate-400">
                      {entry.uploading
                        ? "Uploading…"
                        : entry.error
                          ? `Error: ${entry.error}`
                          : "Ready"}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={6}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Seed (optional)
        </label>
        <input
          type="number"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
        />
      </div>

      {modelKind === "video" && selectedVideo ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {(Object.entries(selectedVideo.params) as Array<
            [string, ParamDefinition | undefined]
          >)
            .map(([key, definition]) =>
              definition ? renderParamControl(key, definition) : null
            )
            .filter(Boolean)}
        </div>
      ) : null}
      </div>

      <div className="sticky bottom-0 left-0 right-0 mt-auto space-y-2 border-t border-white/10 bg-slate-950/95 p-3 shadow-[0_-6px_25px_rgba(0,0,0,0.7)] backdrop-blur sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={busy || pendingUploads}
            className="rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Generating…"
              : pendingUploads
                ? "Waiting on uploads…"
                : "Generate"}
          </button>
          {pricingLabel ? (
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-slate-300">
              {pricingLabel}
            </span>
          ) : null}
        </div>
        {status ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            {status}
          </div>
        ) : null}
      </div>
    </form>
  );
}
