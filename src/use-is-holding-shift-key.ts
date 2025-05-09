import { useState, useEffect } from "react";

export function useIsHoldingShiftKey() {
  const [isHoldingShiftKey, setIsHoldingShift] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setIsHoldingShift(e.shiftKey);
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

  return isHoldingShiftKey;
}
