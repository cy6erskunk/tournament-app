const Page = () => {
  return (
    <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0">
       <form className="border-2 border-gray-900 w-full sm:max-w-md mt-1 px-8 py-6 bg-white shadow-md overflow-hidden sm:rounded-lg justify-center">
      <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 pb-8">
              Lisää ottelija
            </h2>
            <div>
                  <input
                    id="name"
                    name="name"
                    type="name"
                    autoComplete="name"
                    required
                    className="mt-5 flex w-full justify-center rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                  />
                </div>
                <div>
              <div className="flex items-center justify-center">
              <button
                  type="submit"
                  className="mt-10 w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold leading-6 shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 mb-5 flex mr-1 text-white"
                >
                  Tallenna
                </button>
                <button
                  type="submit"
                  className="mt-10 flex w-full justify-center rounded-md px-3 text-sm font-semibold leading-6 text-bg-blue-500 shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 mb-5 border-2 border-gray-900 py-2 mr-1 text-black"
                >
                  Takaisin
                </button>

              </div>
            </div>   
    </form>
    </div>
  
  )
};

export default Page;
