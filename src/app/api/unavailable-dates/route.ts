import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("unavailable_dates")
      .select("blocked_date, reason")
      .gte("blocked_date", today)
      .order("blocked_date", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      dates: data ?? []
    });
  } catch (error) {
    console.error("Unavailable dates fetch failed:", error);

    return NextResponse.json(
      {
        message: "Could not load unavailable dates right now."
      },
      { status: 500 }
    );
  }
}
