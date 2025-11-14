type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-transparent border-t-white/80 ${sizeMap[size]} ${className}`}
    />
  );
}

