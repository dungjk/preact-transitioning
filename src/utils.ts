import type { Ref, RefCallback } from "preact";
import type { MutableRefObject } from "preact/compat";

/**
 * A function that merges React refs into one.
 * Supports both functions and ref objects created using createRef() and useRef().
 *
 * Usage:
 * ```tsx
 * <div ref={mergeRefs(ref1, ref2, ref3)} />
 * ```
 *
 * @param {(Ref<T> | undefined)[]} inputRefs Array of refs
 * @returns {Ref<T> | RefCallback<T>} Merged refs
 */
export function mergeRefs<T>(...inputRefs: (Ref<T> | undefined)[]): Ref<T> | RefCallback<T> {
  const filteredInputRefs = inputRefs.filter(Boolean);

  if (filteredInputRefs.length <= 1) {
    const firstRef = filteredInputRefs[0];

    return firstRef || null;
  }

  return function mergedRefs(ref) {
    filteredInputRefs.forEach((inputRef) => {
      if (typeof inputRef === 'function') {
        inputRef(ref);
      } else if (inputRef) {
        (inputRef as MutableRefObject<T | null>).current = ref;
      }
    });
  };
}
