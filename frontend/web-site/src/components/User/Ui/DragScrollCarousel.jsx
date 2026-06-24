import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "../../../hooks/useDragScroll";

const NAV_BUTTON_CLASS =
    "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover/carousel:opacity-100";

export default function DragScrollCarousel({
    children,
    showNav = true,
    scrollAmount = 400,
    navOffset = "default",
    className = "",
    trackClassName = "",
}) {
    const { ref, dragging, dragHandlers } = useDragScroll();

    const scroll = (direction) => {
        ref.current?.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const leftNavClass =
        navOffset === "compact"
            ? `${NAV_BUTTON_CLASS} left-0 -translate-x-2 sm:-translate-x-5`
            : `${NAV_BUTTON_CLASS} left-0 -translate-x-5`;

    const rightNavClass =
        navOffset === "compact"
            ? `${NAV_BUTTON_CLASS} right-0 translate-x-2 sm:translate-x-5`
            : `${NAV_BUTTON_CLASS} right-0 translate-x-5`;

    return (
        <div className={`group/carousel relative ${className}`}>
            {showNav ? (
                <>
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        aria-label="Cuộn trái"
                        className={leftNavClass}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        aria-label="Cuộn phải"
                        className={rightNavClass}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            ) : null}

            <div
                ref={ref}
                {...dragHandlers}
                className={`flex gap-4 overflow-x-auto scroll-smooth touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                    dragging ? "cursor-grabbing select-none" : "cursor-grab"
                } ${trackClassName}`}
            >
                {children}
            </div>
        </div>
    );
}
