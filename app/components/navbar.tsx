import Image from "next/image";
import "../../node_modules/flag-icons/css/flag-icons.min.css";

const Navbar = () => {
  return (
    <nav className="p-3 bg-blue-500 flex flex-nowrap justify-between">
      <Image
        src="/pictures/HFMlogo.png"
        width={500}
        height={500}
        alt="Helsingin Miekkailijat ry logo"
      />
      <div className=" flex flex-row justify-between my-auto">
        <div className="my-auto pr-5">
          <button className="bg-white hover:bg-blue-700 font-bold py-2 px-4 border-2 border-white rounded-full text-blue-500 m-2">
            Empty table
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border-2 border-white rounded-full">
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
