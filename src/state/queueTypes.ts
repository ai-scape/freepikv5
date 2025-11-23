export type QueueJobStatus = "pending" | "processing" | "completed" | "failed";

export type QueueJob = {
    id: string;
    status: QueueJobStatus;
    type: "image" | "video" | "upscale";
    name: string; // Display name (e.g. prompt snippet or file name)
    payload: unknown; // The data needed to run the job
    result?: unknown; // The result (e.g. URL)
    error?: string;
    timestamp: number;
    logs: string[];
};
