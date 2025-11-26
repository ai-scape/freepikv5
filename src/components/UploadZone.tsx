import { type ChangeEvent, useRef, useState, useEffect } from "react";
import { Spinner } from "./ui/Spinner";

export type UploadSlot = {
    url?: string;
    preview?: string;
    name?: string;
    uploading: boolean;
    error?: string | null;
};

type UploadZoneProps = {
    label?: string;
    accept: string;
    slot: UploadSlot;
    onFile: (file: File | null) => void;
    extractFiles: (dataTransfer: DataTransfer | null) => Promise<File[]>;
    isVideo?: boolean;
};

export function UploadZone({
    label,
    accept,
    slot,
    onFile,
    extractFiles,
    isVideo = false,
}: UploadZoneProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [tempError, setTempError] = useState<string | null>(null);

    useEffect(() => {
        if (tempError) {
            const timer = setTimeout(() => setTempError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [tempError]);

    // Sync slot error to temp error if it changes, so it fades out too?
    // Or just display slot.error persistently if it's a real upload error?
    // User said "temporary error... fades".
    // Let's assume slot.error is persistent (upload failed), but maybe we want to show it in the overlay too.
    // For now, let's handle drag-drop errors locally.

    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false);

        const files = await extractFiles(event.dataTransfer);
        const file = files.find((candidate) =>
            isVideo
                ? candidate.type.startsWith("video/")
                : candidate.type.startsWith("image/")
        );

        if (!file) {
            if (files.length > 0) {
                setTempError(`Invalid file type. Please drop ${isVideo ? "a video" : "an image"}.`);
            }
            return;
        }

        onFile(file);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (file) {
            onFile(file);
        }
        event.target.value = "";
    };

    return (
        <div className="space-y-1">
            {label && (
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </label>
            )}
            <div
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/10 to-transparent transition-all ${isDragActive
                        ? "border-sky-400 shadow-lg shadow-sky-500/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                }}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleChange}
                />

                {/* Content */}
                <div className="flex min-h-[128px] w-full flex-col items-center justify-center">
                    {slot.preview ? (
                        <div className="relative h-32 w-full">
                            {isVideo ? (
                                <video
                                    src={slot.preview}
                                    className="h-full w-full object-cover"
                                    controls={false} // Hide controls for cleaner look, or maybe show them? User said "compact".
                                    // Let's keep it simple. If it's a preview, maybe just an image frame is better?
                                    // But we might not have a frame. Let's use video tag but muted/loop?
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={slot.preview}
                                    alt={slot.name}
                                    className="h-full w-full object-cover"
                                />
                            )}

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                <p className="mb-2 max-w-[90%] truncate text-xs font-medium text-white drop-shadow-md">
                                    {slot.name}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onFile(null)}
                                    className="rounded-full bg-red-500/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm transition hover:bg-red-500"
                                >
                                    REMOVE
                                </button>
                            </div>

                            {/* Status Overlay (Uploading / Ready) */}
                            <div className="absolute bottom-2 right-2 pointer-events-none">
                                {slot.uploading ? (
                                    <div className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-sky-300 backdrop-blur-md">
                                        <Spinner size="sm" /> Uploading
                                    </div>
                                ) : slot.url ? (
                                    <div className="rounded-md bg-emerald-500/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md shadow-sm">
                                        READY
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="mb-2 rounded-full bg-white/5 p-3 text-slate-400">
                                {isVideo ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                )}
                            </div>
                            <div className="text-xs text-slate-400">
                                <span className="font-medium text-slate-300">Click to upload</span> or drag and drop
                            </div>
                            <div className="mt-1 text-[10px] text-slate-500">
                                {isVideo ? "MP4, MOV" : "PNG, JPG, WEBP"}
                            </div>
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                        </div>
                    )}
                </div>

                {/* Error Overlay */}
                {(tempError || slot.error) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="text-xs font-medium text-rose-300">
                            {tempError || slot.error}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
