import { useTranslations } from "next-intl";

type AddplayerProps = {
  closeModal: () => void;
};

// todo: fix warning message when clicking 'Takaisin'
// message: Form submission canceled because the form is not connected
const Addplayer = ({ closeModal }: AddplayerProps) => {
  const t = useTranslations("NewPlayer");
  const submitForm = (formData: FormData) => {
    const newPlayer = formData.get("name");
    console.log(newPlayer);
  };
  return (
    <form action={submitForm} className="space-y-10">
      <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title")}
      </h2>
      <input
        id="name"
        name="name"
        type="text"
        required
        placeholder={t("name")}
        className="flex w-full justify-center rounded-md border-0 py-1.5 px-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
      />
      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
        <button
          type="submit"
          className="bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
        >
          {t("submit")}
        </button>
        <button
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-sm"
        >
          {t("back")}
        </button>
      </div>
    </form>
  );
};

export default Addplayer;
