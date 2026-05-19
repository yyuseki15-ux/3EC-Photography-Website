import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const isAuthenticated = await hasValidAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  return children;
}
