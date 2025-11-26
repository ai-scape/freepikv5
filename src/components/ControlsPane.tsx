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
} from "../lib/image-models";
import { getModelPricingLabel } from "../lib/pricing";
import { uploadToFal } from "../lib/fal";
import { extensionFromMime } from "../lib/mime";
import { buildFilename } from "../lib/filename";
import { useCatalog } from "../state/useCatalog";
import { Spinner } from "./ui/Spinner";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";
import {
  callModelEndpoint,
  getProviderEnvVar,
  getProviderKey,
  type ModelProvider,
  type ProviderCallOptions,
} from "../lib/providers";
import { downloadBlob } from "../lib/providers/shared";
import {
  fetchFileBlob,
  uploadFile,
  type WorkspaceConnection,
} from "../lib/api/files";
import { useQueue } from "../state/queue";

function formatDateFolder(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}





import { type UploadSlot } from "./UpscaleControls";
import { UploadZone } from "./UploadZone";

type ReferenceUpload = {
  id: string;
  url?: string;
  preview: string;
  name: string;
  uploading: boolean;
  error?: string;
};



const DEFAULT_MODEL_KEY = MODEL_SPECS.length
  ? `video:${DEFAULT_MODEL_ID || MODEL_SPECS[0].id}`
  : IMAGE_MODELS.length
    ? `image:${IMAGE_MODELS[0].id}`
    : "";

export default function ControlsPane() {
  const {
    state: { connection },
    actions: { refreshTree },
  } = useCatalog();
  const { addJob } = useQueue();
  const [modelKey, setModelKey] = useState(DEFAULT_MODEL_KEY);
  const [activeTab, setActiveTab] = useState<"image" | "video">(() => {
    if (DEFAULT_MODEL_KEY.startsWith("image:")) return "image";
    return "video";
  });
  const [prompt, setPrompt] = useState("");
  const [startFrame, setStartFrame] = useState<UploadSlot>({ uploading: false });
  const [endFrame, setEndFrame] = useState<UploadSlot>({ uploading: false });
  const [seed, setSeed] = useState("");
  const [referenceUploads, setReferenceUploads] = useState<ReferenceUpload[]>([]);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageResolution, setImageResolution] = useState("1K");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [busy, setBusy] = useState(false);
  const [isReferenceDragActive, setIsReferenceDragActive] = useState(false);


  const referenceInputRef = useRef<HTMLInputElement | null>(null);


  const previewRegistry = useRef(new Set<string>());
  const [paramValues, setParamValues] = useState<
    Record<string, string | number | boolean | undefined>
  >({});

  const modelKind = activeTab;

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

  const supportsStartFrame = selectedVideo?.supports?.startFrame !== false;
  const supportsEndFrame = selectedVideo?.supports?.endFrame === true;
  const videoReferenceConfig = selectedVideo?.referenceImages;
  const referenceLimit =
    modelKind === "video"
      ? Math.min(videoReferenceConfig?.max ?? 0, 5)
      : Math.min(selectedImage?.maxRefs ?? 0, 5);

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
    const registry = previewRegistry.current;
    return () => {
      registry.forEach((url) => URL.revokeObjectURL(url));
      registry.clear();
    };
  }, []);

  useEffect(() => {
    const ui = selectedImage?.ui;
    const aspectOptions =
      ui?.aspectRatios && ui.aspectRatios.length > 0
        ? ui.aspectRatios
        : [
          { value: "16:9", label: "16:9" },
          { value: "4:3", label: "4:3" },
          { value: "1:1", label: "1:1" },
          { value: "3:2", label: "3:2" },
          { value: "9:16", label: "9:16" },
        ];
    setAspectRatio(aspectOptions[0]?.value ?? "1:1");
    if (ui?.resolutions?.length) {
      setImageResolution(ui.resolutions[0].value);
    } else {
      setImageResolution("1K");
    }
  }, [selectedImage?.id, selectedImage?.ui]);



  const extractFilesFromDataTransfer = useCallback(
    async (dataTransfer: DataTransfer | null): Promise<File[]> => {
      if (!dataTransfer) return [];
      if (dataTransfer.files && dataTransfer.files.length > 0) {
        return Array.from(dataTransfer.files);
      }
      const payloadRaw = dataTransfer.getData(FILE_ENTRY_MIME);
      if (payloadRaw && connection) {
        try {
          const payload = JSON.parse(payloadRaw) as {
            workspaceId: string;
            path: string;
            name?: string;
            mime?: string;
          };
          if (payload.workspaceId !== connection.workspaceId) return [];
          const blob = await fetchFileBlob(connection, payload.path);
          const name =
            payload.name ??
            payload.path.split("/").filter(Boolean).pop() ??
            "file.bin";
          return [
            new File([blob], name, {
              type: blob.type || payload.mime || "application/octet-stream",
            }),
          ];
        } catch {
          return [];
        }
      }
      return [];
    },
    [connection]
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
    async (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (newFiles.length === 0) return;

      // Enforce max 5 references
      const availableSlots = 5 - referenceUploads.length;
      if (availableSlots <= 0) {
        setStatus("Maximum 5 reference images allowed.");
        setTimeout(() => setStatus(null), 3000);
        return;
      }

      const filesToUpload = newFiles.slice(0, availableSlots);
      if (newFiles.length > availableSlots) {
        setStatus(`Only adding ${availableSlots} images (max 5).`);
        setTimeout(() => setStatus(null), 3000);
      }

      const newEntries = filesToUpload.map((file) => ({
        id: Math.random().toString(36).slice(2),
        preview: URL.createObjectURL(file),
        name: file.name,
        uploading: true,
      }));

      // Register previews
      newEntries.forEach((entry) => registerPreview(entry.preview));

      setReferenceUploads((prev) => [...prev, ...newEntries]);

      // Upload each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const entry = newEntries[i];
        try {
          const url = await uploadToFal(file);
          setReferenceUploads((prev) =>
            prev.map((item) =>
              item.id === entry.id
                ? { ...item, uploading: false, url }
                : item
            )
          );
        } catch (error) {
          console.error("Ref upload error:", error);
          setReferenceUploads((prev) =>
            prev.map((item) =>
              item.id === entry.id
                ? {
                  ...item,
                  uploading: false,
                  error: "Upload failed",
                }
                : item
            )
          );
        }
      }
    },
    [referenceUploads, registerPreview, uploadToFal, setStatus]
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


  const imageRequiresReference =
    modelKind === "image" && selectedImage?.requireReference === true;
  const isMissingImageReference =
    imageRequiresReference && imageReferenceUrls.length === 0;








  const handleReferenceDrop = useCallback(
    async (dataTransfer: DataTransfer | null) => {
      const files = await extractFilesFromDataTransfer(dataTransfer);
      if (files.length) {
        const dt = new DataTransfer();
        files.forEach(f => dt.items.add(f));
        await handleReferenceFiles(dt.files);
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

    if (limit > 0 && referenceUploads.length > limit) {
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
    if (!selectedVideo || !definition || definition.hidden) return null;
    const uiKey =
      definition.uiKey ??
      (key as keyof UnifiedPayload);
    // Skip rendering these - they have dedicated UI sections
    if (uiKey === "start_frame_url" || uiKey === "end_frame_url" || uiKey === "prompt") {
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
    setIsSubmitting(true);

    // Artificial delay for UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const modelId = modelKey.replace(/^(image:|video:|upscale:)/, "");
      const modelSpec = MODEL_SPECS.find((m) => m.id === modelId);
      const imageModelSpec = IMAGE_MODELS.find((m) => m.id === modelId);


      let endpoint = "";
      let category: "image" | "video" = "image";
      let provider: ModelProvider = "fal";

      let payload: Record<string, unknown> | undefined;

      let callOptions: ProviderCallOptions | undefined;

      if (modelSpec) {
        endpoint = modelSpec.endpoint;
        category = "video";
        provider = modelSpec.provider ?? "fal";
        callOptions = modelSpec.taskConfig ? { taskConfig: modelSpec.taskConfig } : undefined;

        const unifiedPayload: UnifiedPayload = {
          modelId,
          prompt,
          aspect_ratio: aspectRatio,
          resolution: imageResolution,
          start_frame_url: startFrame.url,
          end_frame_url: endFrame.url,
          reference_image_urls: referenceUploads.map(r => r.url).filter(Boolean) as string[],
          seed: seed ? parseInt(seed, 10) : undefined,
          duration: paramValues.duration as string | number | undefined,
        };

        payload = buildModelInput(modelSpec, unifiedPayload);
      } else if (imageModelSpec) {
        endpoint = imageModelSpec.endpoint;
        category = "image";
        provider = imageModelSpec.provider ?? "fal";
        callOptions = imageModelSpec.taskConfig ? { taskConfig: imageModelSpec.taskConfig } : undefined;

        const maxImagesConfig = imageModelSpec.ui?.maxImages;
        const parsedMaxImages = maxImagesConfig
          ? maxImagesConfig.default ?? maxImagesConfig.min ?? 1
          : undefined;

        const imageJob = {
          prompt: prompt.trim(),
          imageUrls: imageReferenceUrls,
          aspectRatio,
          seed: seed ? parseInt(seed, 10) : undefined,
          imageResolution: imageModelSpec.ui?.resolutions ? imageResolution : undefined,
          maxImages: parsedMaxImages,
          numImages: parsedMaxImages,
        };

        payload = imageModelSpec.mapInput(imageJob);

      } else {
        throw new Error("Model not found");
      }

      if (!endpoint || !payload || !modelId || !category) {
        throw new Error("Model configuration is incomplete.");
      }
      if (!getProviderKey(provider)) {
        throw new Error(
          `Missing ${getProviderEnvVar(provider)} in the environment.`
        );
      }

      addJob(
        category,
        prompt.trim() || modelId,
        {
          endpoint,
          payload,
          modelId,
          category,
          provider,
          callOptions: callOptions ?? {},
          seed,
          prompt,
          connection,
          refreshTree,
        },
        async (data: unknown, log) => {
          const {
            endpoint,
            payload,
            modelId,
            category,
            provider,
            callOptions,
            seed,
            prompt,
            connection,
            refreshTree,
          } = data as {
            endpoint: string;
            payload: Record<string, unknown>;
            modelId: string;
            category: "image" | "video";
            provider: ModelProvider;
            callOptions?: ProviderCallOptions;
            seed: string;
            prompt: string;
            connection: WorkspaceConnection;
            refreshTree: (path?: string) => Promise<void>;
          };

          log("Calling model API...");
          const result = await callModelEndpoint(
            provider,
            endpoint,
            payload,
            { ...callOptions, log }
          );

          let downloadedBlob: Blob;
          let resultUrlStr: string | undefined;

          if (result.blob) {
            downloadedBlob = result.blob;
          } else if (result.url) {
            resultUrlStr = result.url;
            log("Downloading result...");
            downloadedBlob = await downloadBlob(result.url);
          } else {
            throw new Error("No result from model");
          }

          // Determine extension
          let extension = category === "image" ? "png" : "mp4";
          if (resultUrlStr) {
            try {
              const urlObj = new URL(resultUrlStr);
              const pathname = urlObj.pathname;
              const ext = pathname.split(".").pop();
              if (ext && ext.length >= 3 && ext.length <= 4) {
                extension = ext;
              } else {
                const type = downloadedBlob.type;
                const mimeExt = extensionFromMime(type);
                if (mimeExt) {
                  extension = mimeExt;
                }
              }
            } catch {
              // ignore
            }
          }

          const dateFolder = formatDateFolder(new Date());
          const filename = buildFilename(modelId, prompt, extension, seed);
          const relPath = `${dateFolder}/${filename}`;

          log("Saving to workspace...");
          if (connection) {
            await uploadFile(connection, relPath, downloadedBlob);
            await refreshTree(relPath);
          }

          return resultUrlStr || "Blob saved";
        }
      );
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      console.error(error);
      setStatus(error instanceof Error ? error.message : "Generation failed");
    }
  };

  return (
    <form className="flex h-full flex-col text-sm" onSubmit={handleGenerate}>
      <div className="flex-1 space-y-3 pb-40">
        <div className="space-y-3">
          <div className="flex rounded-lg bg-white/5 p-1">
            {(["image", "video"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "image" && IMAGE_MODELS.length) {
                    setModelKey(`image:${IMAGE_MODELS[0].id}`);
                  } else if (tab === "video" && MODEL_SPECS.length) {
                    setModelKey(`video:${MODEL_SPECS[0].id}`);
                  }
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-all ${activeTab === tab
                  ? "bg-slate-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Model
            </label>
            <select
              value={modelKey}
              onChange={(event) => setModelKey(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            >
              {activeTab === "video" && (
                <optgroup label="Video Pipelines">
                  {MODEL_SPECS.map((spec) => (
                    <option key={spec.id} value={`video:${spec.id}`}>
                      {spec.label ?? spec.id}
                    </option>
                  ))}
                </optgroup>
              )}

              {activeTab === "image" && (
                <optgroup label="Image Pipelines">
                  {IMAGE_MODELS.map((spec) => (
                    <option key={spec.id} value={`image:${spec.id}`}>
                      {spec.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* IMAGE CONTROLS */}
        {modelKind === "image" ? (
          <div className="space-y-4">
            {/* 1. Reference Uploads (Top) */}
            {/* 1. Reference Uploads (Top) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reference Images (optional)
                </label>
                <span className="text-[10px] text-slate-500">Max 5</span>
              </div>

              <div
                className={`relative flex min-h-[60px] flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-2 transition ${isReferenceDragActive
                  ? "border-sky-400 shadow-lg shadow-sky-500/20"
                  : "hover:border-white/20"
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

                {/* Previews */}
                {referenceUploads.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20"
                    title={entry.name}
                  >
                    <img
                      src={entry.preview}
                      alt={entry.name}
                      className="h-full w-full object-cover"
                    />
                    {entry.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Spinner size="sm" />
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeReference(entry.id);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white hover:text-rose-400"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add Button */}
                {referenceUploads.length < 5 && (
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-white/20 bg-white/5 text-slate-400 transition hover:border-sky-400 hover:text-sky-200"
                    onClick={() => referenceInputRef.current?.click()}
                    title="Add image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </button>
                )}

                {/* Empty State Text */}
                {referenceUploads.length === 0 && (
                  <span className="ml-1 text-xs text-slate-500 pointer-events-none">
                    Drag images or click +
                  </span>
                )}
              </div>
            </div>

            {/* 2. Prompt */}
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

            {/* 3. Aspect ratio & model-specific inputs */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Aspect ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(event) => setAspectRatio(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                >
                  {(selectedImage?.ui?.aspectRatios ??
                    [
                      { value: "16:9", label: "16:9" },
                      { value: "4:3", label: "4:3" },
                      { value: "1:1", label: "1:1" },
                      { value: "3:2", label: "3:2" },
                      { value: "9:16", label: "9:16" },
                    ]).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>

              {selectedImage?.ui?.resolutions ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resolution
                  </label>
                  <select
                    value={imageResolution}
                    onChange={(event) => setImageResolution(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  >
                    {selectedImage.ui.resolutions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            {/* 4. Seed */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Seed (optional)
              </label>
              <input
                type="number"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                placeholder="-1 for random"
              />
            </div>
          </div>
        ) : null}

        {/* VIDEO CONTROLS */}
        {modelKind === "video" ? (
          <div className="space-y-4">
            {/* Start/End Frames */}
            {supportsStartFrame ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <UploadZone
                    label="Start frame"
                    accept="image/*"
                    slot={startFrame}
                    onFile={handleStartFrameSelect}
                    extractFiles={extractFilesFromDataTransfer}
                  />
                </div>

                {supportsEndFrame ? (
                  <div className="min-w-0 flex-1">
                    <UploadZone
                      label="End frame (optional)"
                      accept="image/*"
                      slot={endFrame}
                      onFile={handleEndFrameSelect}
                      extractFiles={extractFilesFromDataTransfer}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Prompt */}
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

            {/* Reference Images (for video models that support it) */}
            {referenceLimit > 0 ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reference Images (max 5)
                </label>
                <div
                  className={`relative flex min-h-[100px] flex-col justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-3 transition ${isReferenceDragActive
                    ? "border-sky-400 shadow-lg shadow-sky-500/20"
                    : "hover:border-white/20"
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

                  {referenceUploads.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-2 text-center cursor-pointer"
                      onClick={() => referenceInputRef.current?.click()}
                    >
                      <div className="mb-2 rounded-full bg-white/5 p-2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                      </div>
                      <div className="text-xs text-slate-400">
                        <span className="font-medium text-slate-300">Click to upload</span> or drag and drop
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        Max 5 images
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {referenceUploads.map((entry) => (
                        <div
                          key={entry.id}
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20 group"
                          title={entry.name}
                        >
                          <img
                            src={entry.preview}
                            alt={entry.name}
                            className="h-full w-full object-cover"
                          />
                          {entry.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Spinner size="sm" />
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-rose-500 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReference(entry.id);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                          </button>
                        </div>
                      ))}

                      {/* Add more button (small square) */}
                      {referenceUploads.length < 5 && (
                        <button
                          type="button"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-white/20 bg-white/5 text-slate-400 transition hover:border-sky-400 hover:text-sky-200"
                          onClick={() => referenceInputRef.current?.click()}
                          title="Add more images"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Dynamic Params */}
            {selectedVideo ? (
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
        ) : null}


      </div>

      <div className="sticky bottom-0 left-0 right-0 mt-auto space-y-2 border-t border-white/10 bg-slate-950/95 p-3 shadow-[0_-6px_25px_rgba(0,0,0,0.7)] backdrop-blur sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={pendingUploads || isMissingImageReference || isSubmitting}
            className="rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Queueing..."
              : pendingUploads
                ? "Waiting on uploads…"
                : isMissingImageReference
                  ? "Add a reference image"
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
        ) : isMissingImageReference ? (
          <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Add at least one reference image to generate with this model.
          </div>
        ) : null}
      </div>
    </form>
  );
}
