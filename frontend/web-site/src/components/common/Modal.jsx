import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal — Reusable base modal component
 *
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   title     : string
 *   children  : ReactNode        — body content
 *   footer    : ReactNode        — custom footer buttons
 *   size      : "sm" | "md" | "lg"
 */
export default function Modal({ isOpen, onClose, title, children, footer, size = "md" }) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" }[size] ?? "max-w-md";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`relative w-full ${sizeClass} bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
                style={{ animation: "modalIn 0.18s ease-out both" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="text-emerald-950 text-lg font-bold font-['Geist',sans-serif]">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="h-px bg-neutral-100 mx-6" />

                {/* Body */}
                <div className="px-6 py-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <>
                        <div className="h-px bg-neutral-100 mx-6" />
                        <div className="px-6 py-4 flex justify-end gap-3 bg-stone-50 rounded-b-2xl">
                            {footer}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);    }
                }
            `}</style>
        </div>
    );
}