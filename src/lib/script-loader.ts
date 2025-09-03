type ScriptStatus = "loading" | "loaded" | "error";

interface ScriptRecord {
  status: ScriptStatus;
  promise: Promise<void>;
  error?: unknown;
}

const scriptCache: Record<string, ScriptRecord> = {};

/**
 * Dynamically load a script only once per src.
 * Subsequent calls while loading share the same promise.
 * If loading fails, the cache entry is cleared allowing retries.
 */
export function loadScript(src: string, id: string): Promise<void> {
  // Reuse in-flight / completed load.
  const cached = scriptCache[src];
  if (cached) return cached.promise;

  // SSR / non-browser environments: no-op resolve.
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  let resolveFn!: () => void;
  let rejectFn!: (e: unknown) => void;

  const promise = new Promise<void>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  scriptCache[src] = { status: "loading", promise };
  const record = scriptCache[src];

  // Locate existing script by id first, then by matching src.
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script =
      (Array.from(document.getElementsByTagName("script")).find(
        (s) => s.src === src,
      ) as HTMLScriptElement | undefined) || null;
  }

  if (script) {
    // Heuristic: if already complete (legacy readyState) or previously tagged, resolve immediately.
    if (
      (script as any).readyState === "complete" ||
      script.getAttribute("data-loaded") === "true"
    ) {
      record.status = "loaded";
      resolveFn();
    } else {
      // Attach one-time listeners.
      script.addEventListener(
        "load",
        () => {
          record.status = "loaded";
          script!.setAttribute("data-loaded", "true");
          resolveFn();
        },
        { once: true },
      );
      script.addEventListener(
        "error",
        (e) => {
          record.status = "error";
          record.error = e;
          delete scriptCache[src]; // Allow retry on next call.
          rejectFn(e);
        },
        { once: true },
      );
    }
    return promise;
  }

  // Create new script element.
  script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  script.defer = true;

  script.addEventListener(
    "load",
    () => {
      record.status = "loaded";
      script!.setAttribute("data-loaded", "true");
      resolveFn();
    },
    { once: true },
  );

  script.addEventListener(
    "error",
    (e) => {
      record.status = "error";
      record.error = e;
      delete scriptCache[src];
      rejectFn(e);
    },
    { once: true },
  );

  document.head.appendChild(script);

  return promise;
}
