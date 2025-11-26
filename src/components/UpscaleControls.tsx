
import { UploadZone } from "./UploadZone";

export type UploadSlot = {
    url?: string;
    preview?: string;
    name?: string;
    uploading: boolean;
    error?: string | null;
};

type UpscaleControlsProps = {
    upscaleSource: UploadSlot;
    handleUpscaleSourceSelect: (file: File | null) => void;
    videoUpscaleResolution: "1080p" | "2k" | "4k";
    setVideoUpscaleResolution: (res: "1080p" | "2k" | "4k") => void;
    videoUpscaleFps: "30fps" | "60fps";
    setVideoUpscaleFps: (fps: "30fps" | "60fps") => void;
    upscaleFactor: string;
    setUpscaleFactor: (factor: string) => void;
    isVideoUpscaler: boolean;
    extractFilesFromDataTransfer: (dataTransfer: DataTransfer | null) => Promise<File[]>;
};

export function UpscaleControls({
    upscaleSource,
    handleUpscaleSourceSelect,
    // isUpscaleDragActive, // Removed
    // setIsUpscaleDragActive, // Removed
    videoUpscaleResolution,
    setVideoUpscaleResolution,
    videoUpscaleFps,
    setVideoUpscaleFps,
    upscaleFactor,
    setUpscaleFactor,
    isVideoUpscaler,
    extractFilesFromDataTransfer,
}: UpscaleControlsProps) {
    // const upscaleInputRef = useRef<HTMLInputElement | null>(null); // Removed

    return (
        <div className="space-y-3">
            <UploadZone
                label="Source file (required)"
                accept={isVideoUpscaler ? "video/*" : "image/*"}
                slot={upscaleSource}
                onFile={handleUpscaleSourceSelect}
                extractFiles={extractFilesFromDataTransfer}
                isVideo={isVideoUpscaler}
            />

            {isVideoUpscaler ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Target resolution
                        </label>
                        <select
                            value={videoUpscaleResolution}
                            onChange={(event) =>
                                setVideoUpscaleResolution(
                                    event.target.value as "1080p" | "2k" | "4k"
                                )
                            }
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        >
                            <option value="1080p">1080p</option>
                            <option value="2k">2K</option>
                            <option value="4k">4K</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Target FPS
                        </label>
                        <select
                            value={videoUpscaleFps}
                            onChange={(event) =>
                                setVideoUpscaleFps(event.target.value as "30fps" | "60fps")
                            }
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        >
                            <option value="30fps">30 fps</option>
                            <option value="60fps">60 fps</option>
                        </select>
                    </div>
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Upscale factor
                    </label>
                    <select
                        value={upscaleFactor}
                        onChange={(event) => setUpscaleFactor(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    >
                        <option value="1">1x</option>
                        <option value="2">2x</option>
                        <option value="4">4x</option>
                        <option value="8">8x</option>
                    </select>
                </div>
            )}
        </div>
    );
}
