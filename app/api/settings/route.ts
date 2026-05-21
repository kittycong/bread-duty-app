import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SharedDutySettings } from "@/types";

const settingsKey = "bread-duty-settings";

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });
}

export async function GET() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ settings: null, shared: false }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", settingsKey)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, settings: null, shared: false }, { status: 500 });
  }

  return NextResponse.json({ settings: data?.value ?? null, shared: true });
}

export async function PUT(request: Request) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase 환경 변수가 설정되지 않아 공동 저장을 사용할 수 없습니다." },
      { status: 503 }
    );
  }

  const settings = (await request.json()) as SharedDutySettings;
  const nextSettings: SharedDutySettings = {
    assignmentOverrides: settings.assignmentOverrides ?? {},
    employees: settings.employees ?? [],
    workerSupport: settings.workerSupport ?? { name: "근로지원인" },
    updatedAt: new Date().toISOString()
  };

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: settingsKey, value: nextSettings }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: nextSettings, shared: true });
}
