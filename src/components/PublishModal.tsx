import { useState } from "react";
import { Spinner } from "./ui/Spinner";

type PublishModalProps = {
    fileName: string;
    defaultProject?: string;
    onConfirm: (metadata: {
        project: string;
        sequence: string;
        shot: string;
        version: string;
    }) => Promise<void>;
    onCancel: () => void;
};

export function PublishModal({
    fileName,
    defaultProject = "",
    onConfirm,
    onCancel,
}: PublishModalProps) {
    const [project, setProject] = useState(defaultProject);
    const [sequence, setSequence] = useState("01");
    const [shot, setShot] = useState("01");
    const [version, setVersion] = useState("01");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project.trim()) {
            setError("Project name is required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await onConfirm({
                project: project.trim(),
                sequence: sequence.trim(),
                shot: shot.trim(),
                version: version.trim(),
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to publish";
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
                <h2 className="mb-1 text-xl font-bold text-white">Publish File</h2>
                <p className="mb-6 text-sm text-zinc-400">
                    Publishing <span className="text-white font-mono">{fileName}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-400">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="e.g. MyProject"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">
                                Sequence
                            </label>
                            <input
                                type="text"
                                value={sequence}
                                onChange={(e) => setSequence(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">
                                Shot
                            </label>
                            <input
                                type="text"
                                value={shot}
                                onChange={(e) => setShot(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-400">
                                Version
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-sm text-zinc-500">v</span>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-black/40 pl-6 pr-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-3 text-xs text-zinc-400">
                        <span className="block mb-1 font-medium text-zinc-300">Preview:</span>
                        <span className="font-mono text-sky-400">
                            publish/{project || "{project}"}/{project || "Project"}_{sequence}_{shot}_v{version}.{fileName.split('.').pop()}
                        </span>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                        >
                            {loading && <Spinner className="h-4 w-4" />}
                            Publish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
