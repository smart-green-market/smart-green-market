import { useCallback, useRef, useState } from "react";

const DRAG_THRESHOLD = 8;

export function useDragScroll() {
  const ref = useRef(null);
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const activePointerId = useRef(null);
  const [dragging, setDragging] = useState(false);

  const endDrag = useCallback(() => {
    isPointerDown.current = false;
    isDragging.current = false;
    setDragging(false);
    activePointerId.current = null;
  }, []);

  const onPointerDown = useCallback((event) => {
    const element = ref.current;
    if (!element || event.button !== 0) return;

    if (event.target.closest("button")) {
      return;
    }

    isPointerDown.current = true;
    isDragging.current = false;
    didDrag.current = false;
    startX.current = event.clientX;
    scrollLeftStart.current = element.scrollLeft;
    activePointerId.current = event.pointerId;
  }, []);

  const onPointerMove = useCallback((event) => {
    const element = ref.current;
    if (!element || !isPointerDown.current) return;

    const delta = event.clientX - startX.current;

    if (!isDragging.current) {
      if (Math.abs(delta) <= DRAG_THRESHOLD) return;

      isDragging.current = true;
      didDrag.current = true;
      setDragging(true);

      if (activePointerId.current != null) {
        element.setPointerCapture(activePointerId.current);
      }
    }

    event.preventDefault();
    element.scrollLeft = scrollLeftStart.current - delta;
  }, []);

  const onPointerUp = useCallback(
    (event) => {
      const element = ref.current;
      if (
        element &&
        activePointerId.current != null &&
        element.hasPointerCapture(activePointerId.current)
      ) {
        element.releasePointerCapture(activePointerId.current);
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
      onPointerLeave: onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
      onDragStart: (event) => event.preventDefault(),
    },
  };
}
