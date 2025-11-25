import { useState, useCallback, useRef, useEffect } from "react";
import { useCatalog } from "../state/useCatalog";
import { getFileUrl } from "../lib/api/files";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";

export default function ImageComparer() {
    const {
        state: { connection },
    } = useCatalog();
    const [leftImage, setLeftImage] = useState<{ url: string; name: string } | null>(null);
    const [rightImage, setRightImage] = useState<{ url: string; name: string } | null>(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDrop = useCallback(
        (event: React.DragEvent, side: "left" | "right") => {
            event.preventDefault();
            setIsDragging(false);
            if (!connection) return;

            try {
                const data = event.dataTransfer.getData(FILE_ENTRY_MIME);
                if (!data) return;
                const payload = JSON.parse(data);
                if (payload.workspaceId !== connection.workspaceId) return;
                if (!payload.mime?.startsWith("image/")) {
                    alert("Please drop an image file.");
                    return;
                }

                const url = getFileUrl(connection, payload.path, { includeToken: true });
                const image = { url, name: payload.name };

                if (side === "left") setLeftImage(image);
                else setRightImage(image);
            } catch (e) {
                console.error("Failed to parse drop data", e);
            }
        },
        [connection]
    );

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleMouseMove = useCallback(
        (event: React.MouseEvent | React.TouchEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            setSliderPosition(percentage);
        },
        []
    );

    // Simple drag handling for the slider
    const [isSliding, setIsSliding] = useState(false);

    useEffect(() => {
        const handleUp = () => setIsSliding(false);
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (isSliding) {
                // @ts-expect-error - simple casting for shared event logic
                handleMouseMove(e);
            }
        };

        if (isSliding) {
            window.addEventListener("mouseup", handleUp);
            window.addEventListener("touchend", handleUp);
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("touchmove", handleMove);
        }

        return () => {
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchend", handleUp);
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("touchmove", handleMove);
        };
    }, [isSliding, handleMouseMove]);

    if (!leftImage || !rightImage) {
        return (
            <div className="flex h-full gap-4 p-4">
                <div
                    onDrop={(e) => handleDrop(e, "left")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${leftImage
                        ? "border-sky-500/50 bg-sky-500/10"
                        : isDragging
                            ? "border-sky-400 bg-sky-400/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                >
                    {leftImage ? (
                        <img
                            src={leftImage.url}
                            alt="Left"
                            className="max-h-full max-w-full object-contain p-2"
                        />
                    ) : (
                        <div className="text-center text-slate-400">
                            <div className="text-2xl mb-2">👈</div>
                            <div className="text-sm font-semibold">Drop Left Image</div>
                        </div>
                    )}
                </div>
                <div
                    onDrop={(e) => handleDrop(e, "right")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${rightImage
                        ? "border-sky-500/50 bg-sky-500/10"
                        : isDragging
                            ? "border-sky-400 bg-sky-400/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                >
                    {rightImage ? (
                        <img
                            src={rightImage.url}
                            alt="Right"
                            className="max-h-full max-w-full object-contain p-2"
                        />
                    ) : (
                        <div className="text-center text-slate-400">
                            <div className="text-2xl mb-2">👉</div>
                            <div className="text-sm font-semibold">Drop Right Image</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col min-h-0">
            <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/50 select-none touch-none"
                onMouseDown={(e) => { setIsSliding(true); handleMouseMove(e); }}
                onTouchStart={(e) => { setIsSliding(true); handleMouseMove(e); }}
            >
                {/* Background Image (Right) */}
                <img
                    src={rightImage.url}
                    alt="Right"
                    className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                />

                {/* Foreground Image (Left) - Clipped */}
                <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${sliderPosition}%` }}
                >
                    <img
                        src={leftImage.url}
                        alt="Left"
                        className="absolute inset-0 h-full w-full object-contain max-w-none"
                        style={{ width: containerRef.current?.clientWidth, height: containerRef.current?.clientHeight }}
                    />
                </div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-sm">
                        <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 bg-white/80"></div>
                            <div className="w-0.5 h-3 bg-white/80"></div>
                        </div>
                    </div>
                </div>

                {/* Reset Button */}
                <button
                    onClick={() => { setLeftImage(null); setRightImage(null); }}
                    className="absolute top-4 right-4 z-10 rounded-lg bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-red-500/80"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
