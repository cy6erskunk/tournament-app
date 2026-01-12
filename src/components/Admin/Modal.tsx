"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Reference counter to track multiple open modals
let modalCount = 0;

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      // Increment modal count and lock scroll on first modal
      modalCount++;
      if (modalCount === 1) {
        document.body.classList.add("overflow-hidden");
      }

      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);

      if (isOpen) {
        // Decrement modal count and unlock scroll when last modal closes
        modalCount--;
        if (modalCount === 0) {
          document.body.classList.remove("overflow-hidden");
        }
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="relative z-10">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                {title}
              </h3>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
