import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type QueueJobStatus = "pending" | "processing" | "completed" | "failed";

export type QueueJob = {
    id: string;
    status: QueueJobStatus;
    type: "image" | "video" | "upscale";
    name: string; // Display name (e.g. prompt snippet or file name)
    payload: any; // The data needed to run the job
    result?: any; // The result (e.g. URL)
    error?: string;
    timestamp: number;
    logs: string[];
};

type QueueContextType = {
    jobs: QueueJob[];
    addJob: (
        type: QueueJob["type"],
        name: string,
        payload: any,
        processor: (payload: any, log: (msg: string) => void) => Promise<any>
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
        Record<string, (payload: any, log: (msg: string) => void) => Promise<any>>
    >({});
    const [isLogOpen, setIsLogOpen] = useState(false);

    const addJob = useCallback(
        (
            type: QueueJob["type"],
            name: string,
            payload: any,
            processor: (payload: any, log: (msg: string) => void) => Promise<any>
        ) => {
            const id = crypto.randomUUID();
            setProcessors((prev) => ({ ...prev, [id]: processor }));
            setJobs((prev) => [
                {
                    id,
                    status: "pending",
                    type,
                    name,
                    payload,
                    timestamp: Date.now(),
                    logs: ["Job queued."],
                },
                ...prev,
            ]);
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

            const log = (msg: string) => {
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
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Unknown error";
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
