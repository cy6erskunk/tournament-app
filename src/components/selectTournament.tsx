"use client";

import Link from "next/link";
import NewTournament from "@/components/newTournament";
import { useTranslations } from "next-intl";
import Tournament from "@/types/Tournament";
import { useEffect, useState } from "react";
import { getRecentTournaments } from "@/database/getTournament";
import { useUserContext } from "@/context/UserContext";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function SelectTournament() {
  const t = useTranslations("Select");
  const account = useUserContext();
  const [previousTournaments, setPreviousTournaments] = useState<Tournament[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [removeTournamentLoading, setRemoveTournamentLoading] = useState(false);
  const [tournamentsLength, setTournamentsLength] = useState(0)

  const getRemoveTournamentButton = (tour: Tournament) => {
    if (!account.user) return;
    if (account.user.role !== "admin") return;

    return (
      <button
        onClick={() => removeTournament(tour)}
        className="bg-red-400 p-1 rounded-full hover:bg-red-500"
        disabled={removeTournamentLoading}
      >
        <TrashIcon className="h-5 w-5 text-white" />
      </button>
    );
  };

  async function removeTournament(tour: Tournament) {
    if (window.confirm(`${t("remove")} ${tour.name}?`)) {
      setRemoveTournamentLoading(true);
      const request = {
        name: tour.name,
        id: tour.id,
      };

      const res = await fetch("/api/tournament/name", {
        method: "DELETE",
        body: JSON.stringify(request),
      });

      if (res.ok) {
        const updatedTournaments = previousTournaments.filter(
          (tournament) => tournament.id !== tour.id,
        );
        setPreviousTournaments(updatedTournaments);
        setRemoveTournamentLoading(false);
        return;
      }
      alert(t("unexpectederror"));
      setRemoveTournamentLoading(false);
    }
  }

  useEffect(() => {
    async function fetchTournaments() {
      const recentTournaments = await getRecentTournaments(previousTournaments.length);
      if (!recentTournaments.success) {
        console.log("Error: " + recentTournaments.error);
        setLoading(false);
        return [];
      }
      setPreviousTournaments(recentTournaments.value);
      setLoading(false);
      setTournamentsLength(recentTournaments.value.length)
    }
    fetchTournaments();
  }, []);

  async function loadMoreTournaments() {
    const loadNewTournaments = await getRecentTournaments(previousTournaments.length)
    if (!loadNewTournaments.success) {
      console.log("Error: " + loadNewTournaments.error)
      return;
    }
    setPreviousTournaments(previousTournaments.concat(loadNewTournaments.value))
    console.log(loadNewTournaments.value)
    setTournamentsLength(loadNewTournaments.value.length)
  }

  function loadMoreButton() {
    if (tournamentsLength < 20) {
      return;
    }
    return (
      <div className="flex justify-center">
        <button className="bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm font-semibold" onClick={loadMoreTournaments}>{t("loadMore")}</button>
      </div>
    )
  }

  return (
    <section className="container mx-auto mt-10 p-4 flex flex-col items-center gap-6">
      {account.user?.role === "admin" ? (
        <div className="border border-gray-900 max-w-md p-6 rounded-md shadow-md w-full">
          <NewTournament />
        </div>
      ) : null}
      <div className="border border-gray-900 max-w-md p-6 rounded-md shadow-md w-full space-y-5">
        <h1 className="font-bold text-xl">{t("selecttournament")}</h1>
        {loading ? (
          <Loading />
        ) : previousTournaments.length > 0 ? (
          <ul className="flex flex-col gap-8 divide-y">
            {previousTournaments.map((tour) => (
              <li className="flex justify-between" key={Number(tour.id)}>
                <Link
                  href={`/tournament/${tour.id}`}
                  className="underline underline-offset-2"
                >
                  {tour.name}
                </Link>
                {getRemoveTournamentButton(tour)}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("notournamentsfound")}</p>
        )}
        {loadMoreButton()}
      </div>
    </section>
  );
}

function Loading() {
  return (
    <div className="flex row justify-center items-center gap-2">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
}
