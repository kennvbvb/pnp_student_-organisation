import Link from "next/link";
import { getBranding } from "@/lib/settings";

// Public area: no authentication required. Read-only school-facing pages.
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/public" className="flex items-center gap-3">
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from site settings
              <img
                src={branding.logo}
                alt={`โลโก้${branding.schoolName}`}
                className="h-10 w-10 rounded-xl border border-slate-100 object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-800 to-indigo-900 text-base font-bold text-white">
                สภ
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {branding.siteTitle}
              </p>
              <p className="truncate text-xs text-slate-400">
                {branding.schoolName}
              </p>
            </div>
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} สภานักเรียน{branding.schoolName}
          {branding.contactInfo && (
            <span className="mt-1 block whitespace-pre-line">
              {branding.contactInfo}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
