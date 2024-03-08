import { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  closeModal: () => void;
}

export default function Modal({ children, isOpen, closeModal }: ModalProps) {
  return (
    <>
      {isOpen ? (
        <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-40 outline-none focus:outline-none mx-4">
          <div className="relative z-50 border-2 border-gray-900 w-full sm:max-w-xl px-4 py-12 bg-white shadow-md overflow-hidden rounded-lg justify-center">
            {children}
          </div>
          <div
            className="opacity-50 fixed inset-0 z-30 bg-black"
            onClick={closeModal}
          ></div>
        </div>
      ) : null}
    </>
  );
}
