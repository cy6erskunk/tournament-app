import Image from "next/image";
import "../../node_modules/flag-icons/css/flag-icons.min.css";

const Navbar = () => {
  return (
    <nav className="p-3 bg-blue-500 flex flex-row justify-between mb-5">
      <div className="lg:hidden flex justify-center grow max-w-[150px]">
        <Image
          className="w-full"
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
        {/* <button className="bg-white hover:bg-blue-700 text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full text-blue-500 m-1">
            Empty table
          </button> */}
        <div className="flex flex-ro gap-5 absolute top-0 right-0 p-3 pr-4">
          <button>
            <span className="fi fi-fi"></span>
          </button>
          <button>
            <span className="fi fi-se"></span>
          </button>
          <button>
            <span className="fi fi-gb"></span>
          </button>
        </div>
        <button className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full m-1 relative justify-center">
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
