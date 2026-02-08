"use client";

import { ReactNode } from "react";
import Image from "next/image";
import "../../node_modules/flag-icons/css/flag-icons.min.css";
import Languages from "./languages";
import { useTranslations } from "next-intl";
import { logout } from "@/helpers/logout";
import { useUserContext } from "@/context/UserContext";

interface NavbarProps {
  children?: ReactNode;
}

const Navbar = ({ children }: NavbarProps) => {
  const t = useTranslations("Logout");
  const account = useUserContext();

  return (
    <nav className="p-3 bg-blue-500 flex flex-row justify-between mb-5">
      <div className="lg:hidden flex justify-center grow max-w-[150px]">
        <Image
          className="w-full h-auto object-cover object-center"
          priority
          src="/pictures/HFMlogoonly.png"
          width={500}
          height={500}
          alt="Helsingin Miekkailijat ry logo"
        />
      </div>
      <div className="max-lg:hidden flex justify-center grow max-w-md">
        <Image
          className="w-full"
          priority
          src="/pictures/HFMlogowhite.png"
          width={500}
          height={500}
          alt="Helsingin Miekkailijat ry logo"
        />
      </div>
      <div className=" flex flex-col my-auto">
        <Languages />
        <div className="flex flex-col sm:flex-row pt-5 sm:pt-0">
          {children}
          <button
            type="button"
            onClick={async () => {
              account.setUser(null);
              await logout();
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full m-1 relative justify-center"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
