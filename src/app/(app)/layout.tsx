import { requireUser } from "@/lib/auth-guard";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-1">
      <div className="sticky top-0 h-screen">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
          <div className="animate-fade-in-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
