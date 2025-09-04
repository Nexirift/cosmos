import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    const controller = new AbortController();
    mql.addEventListener("change", onChange, { signal: controller.signal });
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      // Abort controller detaches the listener in supported browsers
      if (!controller.signal.aborted) controller.abort();
    };
  }, []);

  return !!isMobile;
}
