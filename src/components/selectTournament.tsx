"use client";

import Link from "next/link";
import NewTournament from "@/components/newTournament";
import { useTranslations } from "next-intl";
import Tournament from "@/types/Tournament";

type SelectTournamentProps = {
  recentTournaments: Tournament[];
};

export default function SelectTournament({
  recentTournaments,
}: SelectTournamentProps) {
  const t = useTranslations("Select");

  return (
    <section className="container mx-auto mt-10 p-4 flex flex-col items-center gap-6">
      <div className="border border-gray-900 max-w-md p-6 rounded-md shadow-md w-full space-y-5">
        <h1 className="font-bold text-xl">{t("selecttournament")}</h1>
        {recentTournaments.length > 0 ? (
          <ul className="flex flex-col gap-8 divide-y">
            {recentTournaments.map((tour) => (
              <li key={Number(tour.id)}>
                <Link
                  href={`/tournament/${tour.id}`}
                  className="underline underline-offset-2"
                >
                  {tour.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("notournamentsfound")}</p>
        )}
      </div>
      <div className="border border-gray-900 max-w-md p-6 rounded-md shadow-md w-full">
        <NewTournament />
      </div>
    </section>
  );
}
