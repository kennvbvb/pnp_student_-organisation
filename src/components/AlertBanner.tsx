const VARIANT_STYLES = {
  info: "bg-sky-50 text-sky-800 border-sky-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-red-50 text-red-700 border-red-200",
} as const;

const ICON_COLOR = {
  info: "text-sky-500",
  warning: "text-amber-500",
  success: "text-emerald-500",
  error: "text-red-500",
} as const;

type Variant = keyof typeof VARIANT_STYLES;

function VariantIcon({ variant }: { variant: Variant }) {
  const cls = `h-5 w-5 shrink-0 ${ICON_COLOR[variant]}`;
  if (variant === "warning") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4M12 17h.01M10.3 4l-7.6 13A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z" />
      </svg>
    );
  }
  if (variant === "success") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export default function AlertBanner({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${VARIANT_STYLES[variant]}`}
    >
      <VariantIcon variant={variant} />
      <div className="pt-0.5">{children}</div>
    </div>
  );
}
