import SelectTournament from "@/components/selectTournament";
import { getSession } from "@/helpers/getsession";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import AdminNavLink from "@/components/AdminNavLink";

export default async function Page() {
  const session = await getSession();
  if (!session.success) {
    redirect("/");
  }

  return (
    <>
      <Navbar>
        <AdminNavLink />
      </Navbar>
      <SelectTournament />
    </>
  );
}
