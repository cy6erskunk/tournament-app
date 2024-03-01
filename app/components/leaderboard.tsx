import { TrophyIcon } from "@heroicons/react/24/solid";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import Link from "next/link";

const Leaderboard = () => {
  const t = useTranslations("Leaderboard");
  return (
    <>
      <div className="flex flex-row gap-3">
        <Link href="/home">
          <ArrowLeftEndOnRectangleIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-500" />
        </Link>
        <h1 className="py-3">{t("title")}</h1>
      </div>
      <div className="overflow-auto max-h-[500px] border-2 rounded-md shadow-md border-slate-500 text-xs md:text-base">
        <table className="w-full">
          <thead>
            <tr className="text-white *:py-2 *:md:py-4 *:bg-slate-500 *:w-20">
              <th>{t("name")}</th>
              <th
                title={`${t("hoverWins")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("wins")}
              </th>
              <th
                title={`${t("hoverWin%")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("win%")}
              </th>
              <th
                title={`${t("hoverHitsGiven")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("hitsGiven")}
              </th>
              <th
                title={`${t("hoverHitsReceived")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("hitsReceived")}
              </th>
              <th
                title={`${t("hoverAO-VO")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("AO-VO")}
              </th>
              <th>{t("position")}</th>
            </tr>
          </thead>
          <tbody>
            {/* Hard data until logic implemented */}
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player1</td>
              <td>1</td>
              <td>100%</td>
              <td>10</td>
              <td>0</td>
              <td>10</td>
              <td className="flex flex-row justify-center">
                <p className="relative">1</p>
                <TrophyIcon className="w-4 h-4 md:w-6 md:h-6 text-yellow-400 absolute ml-6 md:ml-10" />
              </td>
            </tr>
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player2</td>
              <td>0</td>
              <td>0%</td>
              <td>0</td>
              <td>10</td>
              <td>-10</td>
              <td className="flex flex-row justify-center">
                <p className="relative">2</p>
                <TrophyIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-700 absolute ml-6 md:ml-10" />
              </td>
            </tr>
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player3</td>
              <td>0</td>
              <td>0%</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td className="flex flex-row justify-center">
                <p className="relative">3</p>
                <TrophyIcon className="w-4 h-4 md:w-6 md:h-6 text-amber-950 absolute ml-6 md:ml-10" />
              </td>
            </tr>
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player3</td>
              <td>0</td>
              <td>0%</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td className="flex flex-row justify-center">4</td>
            </tr>
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player3</td>
              <td>0</td>
              <td>0%</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td className="flex flex-row justify-center">5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Leaderboard;
