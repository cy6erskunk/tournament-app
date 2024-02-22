import Navbar from "../components/navbar";
import ResultsTable from "../components/resultsTable";
import LeaderboardHome from "../components/leaderboardHome";

const Page = () => {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto p-2">
        <div className="flex flex-col md:flex-row gap-3 *:grow">
          <ResultsTable />
          <LeaderboardHome />
        </div>
      </section>
    </div>
  );
};

export default Page;
