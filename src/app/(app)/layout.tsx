import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getBranding } from "@/lib/settings";
import AppShell from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Force initial/reset passwords to be changed before using the app.
  // The change-password page lives outside this layout group, so no loop.
  if (user.mustChangePassword) {
    redirect("/account/password");
  }

  const branding = await getBranding();

  return (
    <AppShell user={user} branding={branding}>
      {children}
    </AppShell>
  );
}
