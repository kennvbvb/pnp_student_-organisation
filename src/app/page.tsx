import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  // Logged-in users go to their dashboard; everyone else sees the public page.
  redirect(user ? "/dashboard" : "/public");
}
