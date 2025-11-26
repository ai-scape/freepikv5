/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { QueueJob } from "./queueTypes";

type QueueContextType = {
    jobs: QueueJob[];
    addJob: (
        type: QueueJob["type"],
        name: string,
        payload: unknown,
        processor: (payload: unknown, log: (msg: string) => void) => Promise<unknown>
    ) => void;
    retryJob: (id: string) => void;
    clearCompleted: () => void;
    removeJob: (id: string) => void;
    toggleLog: () => void;
    isLogOpen: boolean;
};

const QueueContext = createContext<QueueContextType | null>(null);

const CONCURRENCY_LIMIT = 2;

export function QueueProvider({ children }: { children: ReactNode }) {
    const [jobs, setJobs] = useState<QueueJob[]>([]);
    const [processors, setProcessors] = useState<
        Record<string, (payload: unknown, log: (msg: string) => void) => Promise<unknown>>
    >({});
    const [isLogOpen, setIsLogOpen] = useState(false);

    const addJob = useCallback(
        (
            type: QueueJob["type"],
            name: string,
            payload: unknown,
            processor: (payload: unknown, log: (msg: string) => void) => Promise<unknown>
        ) => {
            const id = crypto.randomUUID();
            setProcessors((prev) => ({ ...prev, [id]: processor }));
            setJobs((prev) => [
                {
                    id,
                    status: "pending" as const,
                    type,
                    name,
                    payload,
                    timestamp: Date.now(),
                    logs: ["Job queued."],
                },
                ...prev,
            ].slice(0, 50));
        },
        []
    );

    const retryJob = useCallback((id: string) => {
        setJobs((prev) =>
            prev.map((job) =>
                job.id === id
                    ? {
                        ...job,
                        status: "pending",
                        error: undefined,
                        logs: [...job.logs, "Retrying job..."],
                    }
                    : job
            )
        );
    }, []);

    const removeJob = useCallback((id: string) => {
        setJobs((prev) => prev.filter((job) => job.id !== id));
        setProcessors((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const clearCompleted = useCallback(() => {
        setJobs((prev) =>
            prev.filter((job) => job.status !== "completed" && job.status !== "failed")
        );
    }, []);

    const toggleLog = useCallback(() => setIsLogOpen((v) => !v), []);

    // Queue Processor
    useEffect(() => {
        const processQueue = async () => {
            const processingCount = jobs.filter((j) => j.status === "processing").length;
            if (processingCount >= CONCURRENCY_LIMIT) return;

            const nextJob = jobs
                .slice()
                .reverse() // FIFO for pending
                .find((j) => j.status === "pending");

            if (!nextJob) return;

            const processor = processors[nextJob.id];
            if (!processor) {
                // Should not happen, but fail if it does
                setJobs((prev) =>
                    prev.map((j) =>
                        j.id === nextJob.id
                            ? { ...j, status: "failed", error: "Processor not found" }
                            : j
                    )
                );
                return;
            }

            // Mark as processing
            setJobs((prev) =>
                prev.map((j) =>
                    j.id === nextJob.id ? { ...j, status: "processing" } : j
                )
            );

            const localLogs: string[] = [...nextJob.logs];
            const log = (msg: string) => {
                console.log(`[Queue] ${msg}`);
                localLogs.push(msg);
                setJobs((prev) =>
                    prev.map((j) =>
                        j.id === nextJob.id ? { ...j, logs: [...j.logs, msg] } : j
                    )
                );
            };

            try {
                log("Starting processing...");
                const result = await processor(nextJob.payload, log);
                setJobs((prev) =>
                    prev.map((j) =>
                        j.id === nextJob.id
                            ? {
                                ...j,
                                status: "completed",
                                result,
                                logs: [...j.logs, "Completed successfully."],
                            }
                            : j
                    )
                );
                // Auto-fade after 10 seconds
                setTimeout(() => {
                    setJobs((prev) => prev.filter((j) => j.id !== nextJob.id));
                    setProcessors((prev) => {
                        const next = { ...prev };
                        delete next[nextJob.id];
                        return next;
                    });
                }, 10000);
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Unknown error";
                localLogs.push(`Failed: ${msg}`);

                setJobs((prev) =>
                    prev.map((j) =>
                        j.id === nextJob.id
                            ? {
                                ...j,
                                status: "failed",
                                error: msg,
                                logs: [...j.logs, `Failed: ${msg}`],
                            }
                            : j
                    )
                );

                // Log to server
                try {
                    // Assuming connection info is in payload or we can just hit the local server
                    // The local server is always at http://localhost:8787 (or env)
                    // But we might not have the URL here easily if it's dynamic.
                    // However, we can try the default or extract from payload if available.
                    // Let's assume standard local dev port for now or try to use payload.connection.apiBase
                    const payload = nextJob.payload as { connection?: { apiBase?: string } };
                    const apiBase = payload?.connection?.apiBase || "http://localhost:8787";
                    await fetch(new URL("/log", apiBase).toString(), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            level: "error",
                            message: `Job ${nextJob.id} failed`,
                            data: {
                                jobId: nextJob.id,
                                type: nextJob.type,
                                error: msg,
                                logs: localLogs
                            }
                        })
                    });
                } catch (e) {
                    console.error("Failed to log error to server", e);
                }
            }
        };

        processQueue();
    }, [jobs, processors]);

    const value = useMemo(
        () => ({
            jobs,
            addJob,
            retryJob,
            clearCompleted,
            removeJob,
            toggleLog,
            isLogOpen,
        }),
        [jobs, addJob, retryJob, clearCompleted, removeJob, toggleLog, isLogOpen]
    );

    return (
        <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
    );
}

export function useQueue() {
    const context = useContext(QueueContext);
    if (!context) {
        throw new Error("useQueue must be used within a QueueProvider");
    }
    return context;
}
