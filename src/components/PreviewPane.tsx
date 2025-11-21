import { useCallback, useEffect, useRef, useState } from "react";
import { getObjectURL, revokeURL } from "../fs/preview";
import { writeBlob } from "../fs/write";
import { useCatalog } from "../state/useCatalog";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: number) {
  return new Date(value).toLocaleString();
}

export default function PreviewPane() {
  const {
    state: { selected, project },
    actions: { refreshTree },
  } = useCatalog();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canCapture, setCanCapture] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const handleDragStart = (event: React.DragEvent) => {
    if (!selected || selected.kind !== "file") return;
    event.dataTransfer.setData(FILE_ENTRY_MIME, selected.relPath);
    event.dataTransfer.effectAllowed = "copy";
  };

  useEffect(() => {
    setCanCapture(false);
    setCaptureStatus(null);
    setVideoDuration(null);
  }, [selected?.id]);

  const ensureMetadataReady = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      throw new Error("Video is not ready for capture.");
    }
    if (video.readyState >= video.HAVE_METADATA) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Unable to load video metadata for capture."));
      };
      const cleanup = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);
    });
  }, []);

  const seekToTime = useCallback(
    (time: number) =>
      new Promise<void>((resolve, reject) => {
        const video = videoRef.current;
        if (!video) {
          reject(new Error("Video element missing."));
          return;
        }
        const target =
          Number.isFinite(video.duration) && video.duration > 0
            ? Math.min(Math.max(time, 0), video.duration)
            : Math.max(time, 0);

        if (Math.abs(video.currentTime - target) < 0.001) {
          resolve();
          return;
        }

        const handleSeeked = () => {
          cleanup();
          resolve();
        };
        const handleError = () => {
          cleanup();
          reject(new Error("Unable to seek to requested frame."));
        };
        const cleanup = () => {
          video.removeEventListener("seeked", handleSeeked);
          video.removeEventListener("error", handleError);
        };

        video.addEventListener("seeked", handleSeeked, { once: true });
        video.addEventListener("error", handleError, { once: true });
        video.currentTime = target;
      }),
    []
  );

  const captureFrameToBlob = useCallback(async (): Promise<Blob> => {
    const video = videoRef.current;
    if (!video) {
      throw new Error("Video is not ready for capture.");
    }
    const canvas = document.createElement("canvas");
    const width = video.videoWidth || Math.max(video.clientWidth, 1);
    const height = video.videoHeight || Math.max(video.clientHeight, 1);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to prepare drawing surface for capture.");
    }
    context.drawImage(video, 0, 0, width, height);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to extract frame as image."));
          return;
        }
        resolve(blob);
      }, "image/png");
    });
  }, []);

  const captureFrame = useCallback(
    async (targetTime?: number, label?: string) => {
      if (!project || !selected || selected.kind !== "file") {
        setCaptureStatus("Frame extraction is only available when a project and file are selected.");
        return;
      }
      if (!selected.mime.startsWith("video")) {
        setCaptureStatus("Frame extraction is only available for videos.");
        return;
      }
      const video = videoRef.current;
      if (!video) {
        setCaptureStatus("Video is not ready for capture.");
        return;
      }

      setCaptureBusy(true);
      setCaptureStatus(label ?? "Extracting frame…");

      try {
        await ensureMetadataReady();
        const rawTime =
          typeof targetTime === "number" ? targetTime : video.currentTime;
        const duration =
          videoDuration ??
          (Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : undefined);
        const captureTime =
          typeof rawTime === "number" && Number.isFinite(rawTime)
            ? duration !== undefined
              ? Math.min(Math.max(rawTime, 0), duration)
              : Math.max(rawTime, 0)
            : 0;
        if (typeof targetTime === "number") {
          await seekToTime(captureTime);
        }

        const blob = await captureFrameToBlob();
        const directoryParts = selected.relPath.split("/");
        const filename = directoryParts.pop() ?? selected.name;
        const baseDir = directoryParts.join("/");
        const baseName = filename.replace(/\.[^.]+$/, "");
        const msStamp = Math.round(captureTime * 1000);
        const outputName = `${baseName}_frame_${msStamp}ms.png`;
        const relPath = baseDir ? `${baseDir}/${outputName}` : outputName;

        await writeBlob(project, relPath, blob);
        await refreshTree(selected.relPath);
        setCaptureStatus(`Saved frame to ${relPath}`);
      } catch (err) {
        setCaptureStatus(
          err instanceof Error ? err.message : "Unable to extract frame."
        );
      } finally {
        setCaptureBusy(false);
      }
    },
    [
      captureFrameToBlob,
      ensureMetadataReady,
      project,
      refreshTree,
      selected,
      seekToTime,
      videoDuration,
    ]
  );

  const handleMetadataLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCanCapture(true);
    setVideoDuration(
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : null
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!project || !selected || selected.kind === "dir") {
      setError(null);
      setPreviewUrl((previous) => {
        if (previous) {
          revokeURL(previous);
        }
        return null;
      });
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const url = await getObjectURL(project, selected.relPath);
        if (cancelled) {
          revokeURL(url);
          return;
        }
        setPreviewUrl((previous) => {
          if (previous) {
            revokeURL(previous);
          }
          return url;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to preview file.");
        setPreviewUrl((previous) => {
          if (previous) {
            revokeURL(previous);
          }
          return null;
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [project, selected]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-xs rounded-lg border border-dashed border-white/20 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 p-6 text-center text-sm">
          <div className="mb-3 text-4xl">👁️</div>
          <div className="mb-2 font-semibold text-sky-200">
            Preview Panel
          </div>
          <div className="text-slate-300">
            Select a project folder first, then click any file to preview it here.
          </div>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-xs rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm">
          <div className="mb-3 text-4xl">👈</div>
          <div className="mb-2 font-semibold text-white">
            No File Selected
          </div>
          <div className="text-slate-300">
            Click on any image or video from the file browser to see a live preview here.
          </div>
        </div>
      </div>
    );
  }

  if (selected.kind === "dir") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-xs rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm">
          <div className="mb-3 text-4xl">📁</div>
          <div className="mb-2 font-semibold text-white">
            Directory Selected
          </div>
          <div className="text-slate-300">
            "{selected.name}" is a folder. Select a file instead to view its contents.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-white">
            {selected.name}
          </div>
          <div className="text-xs text-slate-400">{selected.relPath}</div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>{formatBytes(selected.size)}</div>
          <div>{formatDate(selected.mtime)}</div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 p-4">
        {error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : loading || !previewUrl ? (
          <div className="text-sm text-slate-400">Loading preview…</div>
        ) : selected.mime.startsWith("video") ? (
          <video
            key={previewUrl}
            ref={videoRef}
            src={previewUrl}
            controls
            draggable={selected.kind === "file"}
            onDragStart={handleDragStart}
            onLoadedMetadata={handleMetadataLoaded}
            onDurationChange={handleMetadataLoaded}
            className="h-full w-full rounded-xl border border-white/10 bg-black object-contain"
          />
        ) : (
          <img
            src={previewUrl}
            alt={selected.name}
            draggable={selected.kind === "file"}
            onDragStart={handleDragStart}
            className="h-full w-full rounded-xl border border-white/10 object-contain"
          />
        )}
      </div>

      {selected && selected.mime.startsWith("video") ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">Frame extraction</span>
            <span className="text-[11px] text-slate-400">
              Scrub to any time, then capture a PNG.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canCapture || captureBusy}
              onClick={() => void captureFrame(undefined, "Extracting current frame…")}
              className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {captureBusy ? "Working…" : "Extract current frame"}
            </button>
            <button
              type="button"
              disabled={!canCapture || captureBusy}
              onClick={() => void captureFrame(0, "Extracting start frame…")}
              className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save start frame
            </button>
            <button
              type="button"
              disabled={!canCapture || captureBusy || !videoDuration}
              onClick={() => {
                const endTime =
                  videoDuration ??
                  (videoRef.current?.duration && Number.isFinite(videoRef.current.duration)
                    ? videoRef.current.duration
                    : 0);
                void captureFrame(Math.max(endTime - 0.001, 0), "Extracting end frame…");
              }}
              className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save end frame
            </button>
          </div>
          {captureStatus ? (
            <div className="mt-2 rounded-md border border-white/10 bg-black/40 px-2 py-2 text-[11px]">
              {captureStatus}
            </div>
          ) : null}
        </div>
      ) : null}

      {previewUrl ? (
        <div className="flex gap-2">
          <a
            href={previewUrl}
            download={selected.name}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
          >
            Download
          </a>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
          >
            Open in New Tab
          </a>
        </div>
      ) : null}
    </div>
  );
}
