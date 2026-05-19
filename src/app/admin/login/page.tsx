import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const isAuthenticated = await hasValidAdminSession();

  if (isAuthenticated) {
    redirect("/admin/bookings");
  }

  return (
    <main className="admin-login-shell">
      <LoginForm />
    </main>
  );
}
