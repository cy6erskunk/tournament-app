import Leaderboard from "../components/leaderboard";
import Navbar from "../components/navbar";

const Page = () => {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto p-4">
        <Leaderboard />
      </section>
    </div>
  );
};

export default Page;
