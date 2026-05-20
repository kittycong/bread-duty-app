import Link from "next/link";
import DutyTable from "@/components/DutyTable";
import { generateSchedule } from "@/utils/dutyGenerator";

const schedule = generateSchedule("2026-05-25", 12);

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-700">12주 일정</p>
            <h1 className="mt-1 text-3xl font-bold text-stone-950">전체 당번표</h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          >
            메인으로
          </Link>
        </div>

        <DutyTable assignments={schedule} />
      </div>
    </main>
  );
}
