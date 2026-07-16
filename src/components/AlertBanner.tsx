const VARIANT_STYLES = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-red-50 text-red-700 border-red-200",
} as const;

export default function AlertBanner({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT_STYLES;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </div>
  );
}
