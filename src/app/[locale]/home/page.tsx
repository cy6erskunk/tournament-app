import Navbar from "@/components/navbar";
import HomePageButtons from "@/components/homePageButtons";
import { TournamentContextProvider } from "@/context/TournamentContext";
import HomePageInfo from "@/components/HomePageInfo";

const Page = async () => {
  return (
    <>
      <Navbar />
      {/*Style later when everything figured out, desktop view looks bad  */}
      <TournamentContextProvider>
        <HomePageButtons />
        <HomePageInfo />
      </TournamentContextProvider>
    </>
  );
};

export default Page;
