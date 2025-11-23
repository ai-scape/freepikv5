import { useQueue } from "../state/queue";
import { Spinner } from "./ui/Spinner";

export default function QueueLog() {
    const { jobs, isLogOpen, toggleLog, removeJob, retryJob } = useQueue();

    if (!isLogOpen) return null;

    return (
        <div className="absolute right-4 top-16 z-50 flex w-96 flex-col rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h3 className="font-semibold text-sm text-white">Generation Queue</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleLog}
                        className="text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-4">
                {jobs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                        No active jobs.
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/5 p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {job.status === "processing" ? (
                                        <Spinner className="h-3 w-3 text-sky-400" />
                                    ) : job.status === "completed" ? (
                                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                    ) : job.status === "failed" ? (
                                        <div className="h-2 w-2 rounded-full bg-rose-400" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                                    )}
                                    <span className="font-medium text-xs text-slate-200 truncate max-w-[180px]">
                                        {job.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {job.status === "failed" && (
                                        <button
                                            onClick={() => retryJob(job.id)}
                                            className="text-[10px] text-sky-400 hover:text-sky-300"
                                        >
                                            Retry
                                        </button>
                                    )}
                                    <button
                                        onClick={() => removeJob(job.id)}
                                        className="text-[10px] text-slate-500 hover:text-rose-400"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 rounded bg-black/20 p-2 font-mono text-[10px] text-slate-400">
                                {job.logs.slice(-3).map((log, i) => (
                                    <div key={i} className="truncate">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
