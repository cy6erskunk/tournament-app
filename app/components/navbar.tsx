import Image from "next/image";
import "../../node_modules/flag-icons/css/flag-icons.min.css";

const Navbar = () => {
  return (
    <nav className="p-3 bg-blue-500 flex flex-row justify-between">
      <div className="lg:hidden w-1/2 md:w-1/4">
        <Image
          className="w-full"
          src="/pictures/HFMlogoonly.png"
          width={500}
          height={500}
          alt="Helsingin Miekkailijat ry logo"
        />
      </div>
      <div className="max-lg:hidden lg:w-1/2 xl:w-1/3">
        <Image
          className="w-full"
          src="/pictures/HFMlogowhite.png"
          width={500}
          height={500}
          alt="Helsingin Miekkailijat ry logo"
        />
      </div>
      <div className=" flex flex-row justify-between my-auto">
        <div className="my-auto pr-5 flex flex-col md:flex-row text-xs">
          <button className="bg-white hover:bg-blue-700 text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full text-blue-500 m-1">
            Empty table
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full m-1">
            Log out
          </button>
        </div>
        <div className="flex flex-col justify-end gap-5">
          <button className="">
            <span className="fi fi-fi"></span>
          </button>
          <button>
            <span className="fi fi-se"></span>
          </button>
          <button className="">
            <span className="fi fi-gb"></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
