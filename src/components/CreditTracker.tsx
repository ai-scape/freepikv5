import { useEffect, useState } from "react";
import { getKieCredits, getKieKey } from "../lib/kie";
import { Tooltip } from "./ui/Tooltip";

export default function CreditTracker() {
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        setHasKey(!!getKieKey());
        void fetchCredits();
    }, []);

    const fetchCredits = async () => {
        if (!getKieKey()) return;
        setLoading(true);
        try {
            const amount = await getKieCredits();
            setCredits(amount);
        } finally {
            setLoading(false);
        }
    };

    if (!hasKey) return null;

    return (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs">
            <Tooltip text="Remaining KIE credits for generation tasks.">
                <span className="text-slate-400">Credits:</span>
            </Tooltip>
            <span className={`font-mono font-semibold ${credits !== null && credits < 10 ? "text-red-400" : "text-sky-200"}`}>
                {loading && credits === null ? "..." : credits ?? 0}
            </span>
            <button
                type="button"
                onClick={fetchCredits}
                disabled={loading}
                className="ml-1 text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh Credits"
            >
                ↻
            </button>
        </div>
    );
}
