import { useEffect, useRef, useState } from "react";

const VARIANTS = {
    "fade-up": {
        hidden: "translate-y-10 opacity-0",
        visible: "translate-y-0 opacity-100",
    },
    "fade-down": {
        hidden: "-translate-y-10 opacity-0",
        visible: "translate-y-0 opacity-100",
    },
    "fade-left": {
        hidden: "-translate-x-10 opacity-0",
        visible: "translate-x-0 opacity-100",
    },
    "fade-right": {
        hidden: "translate-x-10 opacity-0",
        visible: "translate-x-0 opacity-100",
    },
    "zoom-in": {
        hidden: "scale-[0.96] opacity-0",
        visible: "scale-100 opacity-100",
    },
    fade: {
        hidden: "opacity-0",
        visible: "opacity-100",
    },
};

function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ScrollReveal({
    children,
    className = "",
    variant = "fade-up",
    delay = 0,
    duration = 700,
    once = true,
    threshold = 0.12,
    as: Component = "div",
}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(() => prefersReducedMotion());
    const styles = VARIANTS[variant] ?? VARIANTS["fade-up"];

    useEffect(() => {
        if (prefersReducedMotion()) {
            setVisible(true);
            return undefined;
        }

        const element = ref.current;
        if (!element) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (once) observer.unobserve(element);
                } else if (!once) {
                    setVisible(false);
                }
            },
            {
                threshold,
                rootMargin: "0px 0px -6% 0px",
            },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [once, threshold]);

    return (
        <Component
            ref={ref}
            className={`will-change-transform ${
                visible ? styles.visible : styles.hidden
            } ${className}`}
            style={{
                transitionProperty: "opacity, transform",
                transitionDuration: `${duration}ms`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </Component>
    );
}
