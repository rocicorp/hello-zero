import React from "react";

type DownEvent = React.MouseEvent | React.TouchEvent;

interface RepeatButtonProps extends React.ComponentProps<"button"> {
  /**
   * Return `true` / `void` to continue repeating, `false` to stop
   */
  onTrigger: (originalEvent: DownEvent) => boolean | void;
}
const INITIAL_HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 1000 / 60;

/**
 * A `<button>` that repeats an action when held down
 */
export function RepeatButton({ onTrigger, ...props }: RepeatButtonProps) {
  const [event, setEvent] = React.useState<DownEvent | null>(null);

  const onTriggerRef = React.useRef(onTrigger);
  React.useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  React.useEffect(() => {
    if (!event) {
      return;
    }

    let timer = setTimeout(() => {
      const onTick = () => {
        if (onTriggerRef.current(event) !== false) {
          timer = setTimeout(onTick, HOLD_INTERVAL_MS);
        }
      };
      onTick();
    }, INITIAL_HOLD_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [event]);

  function start(e: DownEvent) {
    if (onTriggerRef.current(e) !== false) {
      setEvent(e);
    }
  }

  return (
    <button
      {...props}
      onMouseDown={(e) => {
        start(e);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setEvent(null);
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        setEvent(null);
        props.onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        start(e);
        props.onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        setEvent(null);
        props.onTouchEnd?.(e);
      }}
    />
  );
}
