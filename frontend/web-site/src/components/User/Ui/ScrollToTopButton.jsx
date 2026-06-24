import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const SCROLL_THRESHOLD = 300;

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > SCROLL_THRESHOLD);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="Lên đầu trang"
            title="Lên đầu trang"
            className={`cursor-pointer hover:scale-105 fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-all duration-300 hover:bg-emerald-800 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 ${
                visible
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-4 opacity-0"
            }`}
        >
            <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
    );
}
