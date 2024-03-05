"use client";

import "../../node_modules/flag-icons/css/flag-icons.min.css";
import { useParams, useRouter, usePathname } from "next/navigation";

const Languages = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  function changeLanguage(language: string) {
    if (params.locale === language) return;
    router.push(pathname.replace(`/${params.locale}`, `/${language}`));
  }

  return (
    <div className="flex flex-row gap-5 absolute top-0 right-0 p-3 pr-4">
      <button onClick={() => changeLanguage("fi")}>
        <span className="fi fi-fi"></span>
      </button>
      <button onClick={() => changeLanguage("se")}>
        <span className="fi fi-se"></span>
      </button>
      <button onClick={() => changeLanguage("en")}>
        <span className="fi fi-gb"></span>
      </button>
      <button onClick={() => changeLanguage("ee")}>
        <span className="fi fi-ee"></span>
      </button>
    </div>
  );
};
export default Languages;
