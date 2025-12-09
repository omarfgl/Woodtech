import type {
  ComponentPropsWithoutRef,
  ElementType,
  MutableRefObject,
  Ref
} from "react";
import { forwardRef, useMemo, useRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] hover:bg-brand-400 border border-brand-400/60",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/15 text-white/90",
  outline:
    "bg-transparent text-white/90 border border-white/35 hover:border-white/60 hover:bg-white/5",
  ghost: "bg-transparent text-white/80 hover:bg-white/10 border border-transparent"
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11 p-0"
};

const joinClasses = (...values: Array<string | undefined | false | null>) =>
  values.filter(Boolean).join(" ");

export type ButtonProps = {
  as?: ElementType;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
} & ComponentPropsWithoutRef<"button"> &
  Record<string, unknown>;

export const Button = forwardRef(function Button(
  {
    as,
    variant = "primary",
    size = "md",
    fullWidth,
    className,
    disabled,
    isLoading,
    children,
    type,
    ...rest
  }: ButtonProps,
  forwardedRef: Ref<HTMLElement>
) {
  const Comp = (as ?? "button") as ElementType;
  const innerRef = useRef<HTMLElement | null>(null);

  const setRefs = (node: HTMLElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  const statefulDisabled = disabled || isLoading;

  const pulseStyle = useMemo(
    () => ({
      boxShadow:
        variant === "primary"
          ? "0 18px 46px -22px rgba(0,0,0,0.75)"
          : "0 14px 34px -24px rgba(0,0,0,0.7)"
    }),
    [variant]
  );

  return (
    <Comp
      {...rest}
      ref={setRefs}
      type={
        as
          ? undefined
          : (typeof type === "string"
              ? (type as ComponentPropsWithoutRef<"button">["type"])
              : undefined) ?? "button"
      }
      aria-disabled={statefulDisabled || undefined}
      disabled={as ? undefined : statefulDisabled}
      className={joinClasses(
        "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70",
        "before:absolute before:inset-0 before:-z-10 before:bg-white/5 before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100",
        "after:pointer-events-none after:absolute after:left-[-40%] after:top-[-40%] after:h-[180%] after:w-[40%] after:rotate-12 after:bg-gradient-to-b after:from-white/15 after:via-white/5 after:to-transparent after:opacity-0 after:transition-all after:duration-500 hover:after:left-[110%] hover:after:opacity-100",
        "active:translate-y-[1px]",
        fullWidth ? "w-full" : "",
        sizeClasses[size],
        variantClasses[variant],
        statefulDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
      style={pulseStyle}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
      ) : null}
      <span className={joinClasses("relative z-10 inline-flex items-center gap-2", isLoading && "opacity-80")}>
        {children}
      </span>
    </Comp>
  );
});
