import { useCallback, useRef, useState } from "react";

const DRAG_THRESHOLD = 6;

export function useDragScroll() {
    const ref = useRef(null);
    const isDragging = useRef(false);
    const didDrag = useRef(false);
    const startX = useRef(0);
    const scrollLeftStart = useRef(0);
    const [dragging, setDragging] = useState(false);

    const endDrag = useCallback(() => {
        isDragging.current = false;
        setDragging(false);
    }, []);

    const onPointerDown = useCallback((event) => {
        const element = ref.current;
        if (!element || event.button !== 0) return;

        isDragging.current = true;
        didDrag.current = false;
        startX.current = event.clientX;
        scrollLeftStart.current = element.scrollLeft;
        setDragging(true);
        element.setPointerCapture(event.pointerId);
    }, []);

    const onPointerMove = useCallback((event) => {
        if (!isDragging.current) return;

        const element = ref.current;
        if (!element) return;

        const delta = event.clientX - startX.current;
        if (Math.abs(delta) > DRAG_THRESHOLD) {
            didDrag.current = true;
        }

        element.scrollLeft = scrollLeftStart.current - delta;
    }, []);

    const onPointerUp = useCallback(
        (event) => {
            const element = ref.current;
            if (element?.hasPointerCapture(event.pointerId)) {
                element.releasePointerCapture(event.pointerId);
            }
            endDrag();
        },
        [endDrag],
    );

    const onClickCapture = useCallback((event) => {
        if (!didDrag.current) return;

        event.preventDefault();
        event.stopPropagation();
        didDrag.current = false;
    }, []);

    return {
        ref,
        dragging,
        dragHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave: endDrag,
            onPointerCancel: endDrag,
            onClickCapture,
            onDragStart: (event) => event.preventDefault(),
        },
    };
}
