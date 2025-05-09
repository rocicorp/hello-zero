import React from "react";

type ClickEvent = React.MouseEvent | React.TouchEvent;

interface RepeatButtonProps extends React.ComponentProps<"button"> {
  /**
   * Return `true` / `void` to continue repeating, `false` to stop
   */
  onTrigger: (originalEvent: ClickEvent) => boolean | void;
}
const INITIAL_HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 1000 / 60;

/**
 * A `<button>` that repeats an action when held down
 */
export function RepeatButton({ onTrigger, ...props }: RepeatButtonProps) {
  const [state, setState] = React.useState<{
    enabled: true;
    event: ClickEvent;
  } | {
    enabled: false;
  }>({
    enabled: false,
  });

  const onTriggerRef = React.useRef(onTrigger);
  React.useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  React.useEffect(() => {
    
    
    if (!state.enabled) {
      return;
    }
    const {event} = state;

    if (onTriggerRef.current(event) === false) {
      return;
    }

    let timer = setTimeout(() => {
      function onTick() {
        if (onTriggerRef.current(event) !== false) {
          timer = setTimeout(onTick, HOLD_INTERVAL_MS);
        }
      }
      onTick();
    }, INITIAL_HOLD_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [state]);

  return (
    <button
      {...props}
      onMouseDown={(e) => {
        setState({
            enabled: true,
            event: e,
          });
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setState({
          enabled: false,
        });
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        setState({
          enabled: false,
        });
        props.onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        setState({
          enabled: true,
          event: e,
        });
        props.onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        setState({
          enabled: false,
        });
        props.onTouchEnd?.(e);
      }}
    />
  );
}
