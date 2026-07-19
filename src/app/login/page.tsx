import Link from "next/link";
import { getBranding } from "@/lib/settings";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const branding = await getBranding();

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-12">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 text-center">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from site settings
            <img
              src={branding.logo}
              alt={`โลโก้${branding.schoolName}`}
              className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/90 object-contain p-1 shadow-lg ring-1 ring-white/25"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white shadow-lg ring-1 ring-white/25 backdrop-blur">
              สภ
            </div>
          )}
          <h1 className="text-xl font-bold text-white">{branding.siteTitle}</h1>
          <p className="mt-1 text-sm text-blue-100/80">{branding.schoolName}</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm">
          <Link href="/public" className="text-blue-100/80 hover:text-white hover:underline">
            ← กลับหน้าสาธารณะ
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-white/60">
          © {new Date().getFullYear()} สภานักเรียน{branding.schoolName}
        </p>
      </div>
    </div>
  );
}
