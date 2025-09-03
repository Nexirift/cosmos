"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loadScript } from "../lib/script-loader";
import { Button } from "./ui/button";
import { env } from "@/env";

export type CaptchaProvider =
  | "turnstile"
  | "recaptcha_v2"
  | "recaptcha_v3"
  | "hcaptcha";

export interface CaptchaHandle {
  execute?: () => void; // for v3 / invisible / on-demand
  reset?: () => void; // for v2 / turnstile / hcaptcha
}

interface BaseProps {
  provider: CaptchaProvider;
  onToken: (token: string, provider: CaptchaProvider) => void;
  onExpire?: () => void;
  onError?: (err: unknown) => void;
  action?: string;
  siteKeyOverride?: string;
  className?: string;
  autoExecuteV3?: boolean;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
  forceRefreshKey?: string | number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => any;
      reset: (id: any) => void;
      execute: (id: any) => void;
    };
    hcaptcha?: {
      render: (el: HTMLElement, opts: any) => any;
      reset: (id: any) => void;
      execute: (id: any) => void;
    };
    grecaptcha?: {
      render: (el: HTMLElement, opts: any) => any;
      reset: (id: any) => void;
      execute: (id?: any, opts?: any) => Promise<string>;
      ready: (cb: () => void) => void;
    };
    __turnstileOnLoad?: () => void;
    __grecaptchaV2OnLoad?: () => void;
    __hcaptchaOnLoad?: () => void;
  }
}

const CALLBACK_ID_PREFIX = "captcha_container_";

// Internal helper describing provider script config
const PROVIDER_SCRIPT: Record<
  CaptchaProvider,
  {
    id: string;
    // If function, it can build dynamic src (e.g. includes site key)
    src: (siteKey: string) => string;
    onloadCallbackName?: keyof Window;
    usesExplicitRender: boolean;
  }
> = {
  turnstile: {
    id: "turnstile-script",
    src: () =>
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileOnLoad&render=explicit",
    onloadCallbackName: "__turnstileOnLoad",
    usesExplicitRender: true,
  },
  recaptcha_v2: {
    id: "recaptcha-v2-script",
    src: () =>
      "https://www.google.com/recaptcha/api.js?onload=__grecaptchaV2OnLoad&render=explicit",
    onloadCallbackName: "__grecaptchaV2OnLoad",
    usesExplicitRender: true,
  },
  recaptcha_v3: {
    id: "recaptcha-v3-script",
    src: (siteKey: string) =>
      `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
        siteKey,
      )}`,
    usesExplicitRender: false,
  },
  hcaptcha: {
    id: "hcaptcha-script",
    src: () =>
      "https://hcaptcha.com/1/api.js?onload=__hcaptchaOnLoad&render=explicit",
    onloadCallbackName: "__hcaptchaOnLoad",
    usesExplicitRender: true,
  },
};

export const Captcha = forwardRef<CaptchaHandle, BaseProps>(
  function Captcha(props, ref) {
    const {
      provider,
      onToken,
      onExpire,
      onError,
      action = "submit",
      siteKeyOverride,
      className,
      autoExecuteV3 = true,
      size = "normal",
      forceRefreshKey,
    } = props;

    var theme = props.theme;
    const nextTheme = useTheme().resolvedTheme;

    if (!theme) {
      if (
        nextTheme === "light" ||
        nextTheme === "dark" ||
        nextTheme === "auto"
      ) {
        theme = nextTheme;
      } else {
        theme = "light";
      }
    }

    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<any>(null);
    const mountedRef = useRef<boolean>(false);
    const [ready, setReady] = useState(false);
    const uniqueId = useId();

    const siteKey = siteKeyOverride || env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
    if (!siteKey) {
      throw new Error(`Missing site key for provider: ${provider}`);
    }

    // Consolidated reset logic
    const reset = useCallback(() => {
      const widgetId = widgetIdRef.current;
      if (widgetId == null) return;
      try {
        switch (provider) {
          case "turnstile":
            window.turnstile?.reset(widgetId);
            break;
          case "recaptcha_v2":
            window.grecaptcha?.reset(widgetId);
            break;
          case "hcaptcha":
            window.hcaptcha?.reset(widgetId);
            break;
          case "recaptcha_v3":
            // No visible widget to reset; noop
            break;
        }
      } catch (e) {
        onError?.(e);
      }
    }, [provider, onError]);

    const execute = useCallback(() => {
      const widgetId = widgetIdRef.current;
      try {
        switch (provider) {
          case "recaptcha_v3": {
            if (!window.grecaptcha) return;
            window.grecaptcha.ready(() => {
              window.grecaptcha
                ?.execute(siteKey, { action })
                .then((token: string) => onToken(token, provider))
                .catch(onError);
            });
            break;
          }
          case "recaptcha_v2": {
            if (size === "invisible" && window.grecaptcha && widgetId != null) {
              window.grecaptcha.execute(widgetId);
            }
            break;
          }
          case "turnstile": {
            if (window.turnstile && widgetId != null) {
              // For invisible Turnstile; safe to call otherwise
              window.turnstile.execute(widgetId);
            }
            break;
          }
          case "hcaptcha": {
            if (size === "invisible" && window.hcaptcha && widgetId != null) {
              window.hcaptcha.execute(widgetId);
            }
            break;
          }
        }
      } catch (e) {
        onError?.(e);
      }
    }, [provider, siteKey, action, onToken, onError, size]);

    useImperativeHandle(ref, () => ({ execute, reset }), [execute, reset]);

    // Render widget per provider
    const renderWidget = useCallback(() => {
      if (!mountedRef.current) return;
      if (!containerRef.current) return;

      // Re-render safety: if already rendered and not forced, skip.
      if (widgetIdRef.current && provider !== "recaptcha_v3") {
        return;
      }

      if (provider === "recaptcha_v3") {
        // v3 does not render a visible widget
        if (autoExecuteV3) execute();
        setReady(true);
        return;
      }

      const baseOptions = {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => onToken(token, provider),
      };

      try {
        if (provider === "turnstile" && window.turnstile) {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            ...baseOptions,
            "error-callback": () => onError?.(new Error("Turnstile error")),
            "timeout-callback": () => onExpire?.(),
          });
          setReady(true);
        } else if (provider === "recaptcha_v2" && window.grecaptcha) {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            ...baseOptions,
            "expired-callback": () => onExpire?.(),
            "error-callback": () => onError?.(new Error("reCAPTCHA v2 error")),
          });
          setReady(true);
        } else if (provider === "hcaptcha" && window.hcaptcha) {
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            ...baseOptions,
            "expired-callback": () => onExpire?.(),
            "error-callback": () => onError?.(new Error("hCaptcha error")),
          });
          setReady(true);
        }
      } catch (e) {
        onError?.(e);
      }
    }, [
      provider,
      siteKey,
      theme,
      size,
      onToken,
      onExpire,
      onError,
      autoExecuteV3,
      execute,
    ]);

    // Script loading + onload handling
    useEffect(() => {
      // Skip if already rendered (no need to reload or re-render)
      if (widgetIdRef.current && provider !== "recaptcha_v3") {
        return;
      }

      mountedRef.current = true;
      setReady(false);
      widgetIdRef.current = null;

      const cfg = PROVIDER_SCRIPT[provider];
      const scriptId = cfg.id;
      const scriptSrc = cfg.src(siteKey);

      const afterLoad = () => {
        if (!mountedRef.current) return;
        renderWidget();
      };

      // Assign onload callback (only for providers needing explicit render param)
      if (cfg.onloadCallbackName) {
        (window as any)[cfg.onloadCallbackName] = afterLoad;
      }

      // If script already present, just proceed
      if (document.getElementById(scriptId)) {
        afterLoad();
      } else {
        loadScript(scriptSrc, scriptId)
          .then(() => {
            // For v3 or any script without explicit onload param we call manually
            if (!cfg.onloadCallbackName) afterLoad();
          })
          .catch((e) => {
            onError?.(e);
          });
      }

      return () => {
        mountedRef.current = false;
      };
    }, [provider, siteKey, renderWidget, onError]);

    // Force refresh effect
    useEffect(() => {
      if (forceRefreshKey !== undefined) {
        reset();
        // Clear previous widget reference to allow re-render
        widgetIdRef.current = null;
        setReady(false);
        renderWidget();
      }
    }, [forceRefreshKey, reset, renderWidget]);

    return (
      <div className={className}>
        {provider !== "recaptcha_v3" && (
          <div
            ref={containerRef}
            id={`${CALLBACK_ID_PREFIX}${provider}_${uniqueId}`}
            style={{ display: "inline-block" }}
          />
        )}
        {provider === "recaptcha_v3" && (
          <div ref={containerRef} style={{ display: "none" }} />
        )}
        {!ready && <span style={{ fontSize: 12 }}>Loading challenge...</span>}
      </div>
    );
  },
);

type CaptchaVerificationDialogProps = {
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onToken: (token: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
};

/**
 * Reusable captcha verification dialog.
 */
export function CaptchaVerificationDialog({
  open,
  loading,
  onOpenChange,
  onToken,
  onCancel,
  title = "Captcha Verification",
  description = "Please complete the captcha challenge to continue.",
}: CaptchaVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center">
            <Captcha
              provider={env.NEXT_PUBLIC_CAPTCHA_PROVIDER as CaptchaProvider}
              onToken={(token) => onToken(token)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
