import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollWindowToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

/** Cuộn lên đầu trang mỗi khi đổi route (trừ anchor #hash trên cùng trang). */
export default function ScrollToTopOnNavigate() {
    const { pathname, hash } = useLocation();

    useLayoutEffect(() => {
        if (hash) return;
        scrollWindowToTop();
    }, [pathname, hash]);

    return null;
}
