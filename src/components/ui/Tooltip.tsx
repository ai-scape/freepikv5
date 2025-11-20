export function InfoIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

export function Tooltip({
    children,
    text,
}: {
    children: React.ReactNode;
    text: string;
}) {
    return (
        <div className="group relative inline-block">
            {children}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 group-hover:block">
                <div className="relative rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/10">
                    <div className="max-w-xs whitespace-normal">{text}</div>
                    <div className="absolute left-1/2 top-full -translate-x-1/2 ">
                        <div className="border-4 border-transparent border-t-slate-900" />
                    </div>
                </div>
            </div>
        </div>
    );
}
