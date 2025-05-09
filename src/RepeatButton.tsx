import React from "react";

interface RepeatButtonProps extends React.ComponentProps<"button"> {
  /**
   * Return `true` to continue repeating, `false` to stop
   */
  onTrigger: () => boolean;
}
const INITIAL_HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 1000 / 60;

/**
 * A `<button>` that repeats an action when held down
 */
export function RepeatButton({ onTrigger, ...props }: RepeatButtonProps) {
  const [enabled, setEnabled] = React.useState(false);

  const onTriggerRef = React.useRef(onTrigger);
  React.useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    if (onTriggerRef.current() === false) {
      return;
    }

    let timer = setTimeout(() => {
      function onTick() {
        if (onTriggerRef.current() !== false) {
          timer = setTimeout(onTick, HOLD_INTERVAL_MS);
        }
      }
      onTick();
    }, INITIAL_HOLD_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled]);

  return (
    <button
      {...props}
      onMouseDown={(e) => {
        setEnabled(true);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setEnabled(false);
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        setEnabled(false);
        props.onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        setEnabled(true);
        props.onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        setEnabled(false);
        props.onTouchEnd?.(e);
      }}
    />
  );
}
