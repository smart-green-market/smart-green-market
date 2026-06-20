import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HEADER_OFFSET = 96;

export function useScrollToHash(offset = HEADER_OFFSET) {
    const { hash, pathname } = useLocation();

    useEffect(() => {
        if (!hash) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return undefined;
        }

        const id = hash.replace("#", "");
        const timer = window.setTimeout(() => {
            const element = document.getElementById(id);
            if (!element) return;

            const top =
                element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
        }, 80);

        return () => window.clearTimeout(timer);
    }, [hash, pathname, offset]);
}
