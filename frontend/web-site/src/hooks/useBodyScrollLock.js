import { useEffect } from "react";

export function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked) return undefined;

        const { body, documentElement: html } = document;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlOverflow = html.style.overflow;

        body.style.overflow = "hidden";
        html.style.overflow = "hidden";

        return () => {
            body.style.overflow = prevBodyOverflow;
            html.style.overflow = prevHtmlOverflow;
        };
    }, [locked]);
}
