"use server";

import { db } from "./database";
import { Tournaments } from "./types";

export async function getTournament(name: string) {
  try {
    return db
      .selectFrom("tournaments")
      .where("name", "=", name)
      .selectAll()
      .executeTakeFirst() as Promise<Tournaments | undefined>;
  } catch (error) {
    console.log(error);
    return "Error getting users";
  }
}

// Example usage
// // State to hold the fetched data
// const [data, setData] = useState<string>("");

// // Fetch data using useEffect
// useEffect(() => {
//   const fetchDataAsync = async () => {
//     try {
//       const result = await getTournament("Miekkailu");
//       setData(JSON.stringify(result));
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   fetchDataAsync();
// }, []); // Empty dependency array ensures this effect runs only once
// // State to hold the fetched data
// const [data, setData] = useState<string>("");

// // Fetch data using useEffect
// useEffect(() => {
//   const fetchDataAsync = async () => {
//     try {
//       const result = await getTournament("Miekkailu");
//       setData(JSON.stringify(result));
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   fetchDataAsync();
// }, []); // Empty dependency array ensures this effect runs only once
