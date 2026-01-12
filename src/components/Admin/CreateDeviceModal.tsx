"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

interface CreateDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDeviceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDeviceModalProps) {
  const t = useTranslations("Admin.devices");
  const [deviceToken, setDeviceToken] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken, submitterName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create device");
      }

      setDeviceToken("");
      setSubmitterName("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDeviceToken("");
    setSubmitterName("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("createDevice")}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="deviceToken"
              className="block text-sm font-medium text-gray-700"
            >
              {t("deviceToken")}
            </label>
            <input
              type="text"
              id="deviceToken"
              value={deviceToken}
              onChange={(e) => setDeviceToken(e.target.value)}
              required
              placeholder="e.g., DEVICE_abc123xyz"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("deviceTokenHelp")}
            </p>
          </div>

          <div>
            <label
              htmlFor="submitterName"
              className="block text-sm font-medium text-gray-700"
            >
              {t("submitterName")}
            </label>
            <input
              type="text"
              id="submitterName"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              required
              placeholder="e.g., Tablet 1, Phone Scanner"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("submitterNameHelp")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {loading ? t("creating") : t("create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
