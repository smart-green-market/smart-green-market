import { Star } from "lucide-react";

export default function StarRating({
    value = 0,
    size = "sm",
    showValue = false,
    className = "",
}) {
    const iconSize = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {Array.from({ length: 5 }, (_, index) => {
                const filled = value >= index + 1;
                const half = !filled && value >= index + 0.5;

                return (
                    <Star
                        key={index}
                        className={`${iconSize} ${
                            filled || half
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-none text-stone-300"
                        }`}
                    />
                );
            })}
            {showValue ? (
                <span className="ml-2 text-xs font-medium text-neutral-700">{value.toFixed(1)}</span>
            ) : null}
        </div>
    );
}
