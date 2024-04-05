import Image from "next/image";
import { useTranslations } from "next-intl";
import Languages from "@/components/languages";
import Link from "next/link";
import Login from "@/components/login";

export default function Home() {
  const t = useTranslations("Login");
  return (
    // Logo centered
    <div className="flex-1 justify-center px-6 py-12 lg:px-8 min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0">
      <Languages />
      <Link href="/select" className="font-bold">
        go to todays tournament
      </Link>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Image
          className="w-full mb-10"
          src="/pictures/HFMlogo.png"
          height={500}
          width={500}
          priority
          alt="Helsingin miekkailijat ry"
        />
      </div>
      <div className="border-2 border-gray-900 w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden rounded-lg justify-center">
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {/* <h2 className="mt-7 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 pb-8">
              Kirjaudu sisään
            </h2> */}
            <Login />
        </div>
      </div>
    </div>
  );
}
