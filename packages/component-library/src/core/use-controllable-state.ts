import { useCallback, useState } from "react";

/**
 * Controlled/uncontrolled state in one hook — the boilerplate every widget with
 * a `value`/`defaultValue`/`onChange` trio was repeating.
 *
 * Pass the `controlled` prop to drive it from outside, or leave it `undefined`
 * to own the state internally; either way `onChange` fires. `undefined` is the
 * only "uncontrolled" signal, so a `null` (or `false`) controlled value is
 * respected — which is why combobox's cleared state works.
 *
 * For widgets whose change callback carries extra data (the picked option, a
 * validation result), omit `onChange` and call it yourself after the setter:
 *
 *   const [value, setValue] = useControllableState(valueProp, defaultValue);
 *   setValue(next);
 *   onValueChange?.(next, extra);
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, setValue];
}
