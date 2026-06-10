import Link from "next/link";
import ScheduleTabs from "@/components/ScheduleTabs";
import { employees } from "@/lib/employees";

const startDate = "2026-05-27";
const endDate = "2027-12-29";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-5 sm:py-8 md:flex-row md:items-end md:justify-between md:py-10">
          <div>
            <p className="text-sm font-semibold text-amber-700">bread-duty-app</p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal text-stone-950 sm:text-3xl md:text-4xl">
              빵 수령 당번표
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
              2026년 5월 27일부터 2027년 말까지 수요일 기준으로 이어지는 당번표입니다.
              공휴일과 겹치면 목요일로 자동 이동합니다.
            </p>
          </div>
          <Link
            href="/schedule"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 sm:w-auto"
          >
            일정 보기
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8">
        <ScheduleTabs endDate={endDate} initialEmployees={employees} startDate={startDate} />
      </section>
    </main>
  );
}
