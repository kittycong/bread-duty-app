import Link from "next/link";
import DutyTable from "@/components/DutyTable";
import { generateSchedule } from "@/utils/dutyGenerator";

const schedule = generateSchedule("2026-05-25", 8);

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-700">bread-duty-app</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-stone-950 md:text-4xl">
              빵 수령 당번표
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              백업팀 순환 규칙에 따라 주차별 수령 담당자를 자동으로 구성합니다.
            </p>
          </div>
          <Link
            href="/schedule"
            className="inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          >
            일정 보기
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8">
        <DutyTable assignments={schedule} />
      </section>
    </main>
  );
}
