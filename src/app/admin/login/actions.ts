"use server";

import { redirect } from "next/navigation";
import { createAdminSession, validateAdminPassword } from "@/lib/admin-auth";

export async function login(_: { error: string } | undefined, formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || password.trim().length === 0) {
    return { error: "Enter your admin password." };
  }

  if (!validateAdminPassword(password.trim())) {
    return { error: "That password was not correct." };
  }

  await createAdminSession();
  redirect("/admin/bookings");
}
