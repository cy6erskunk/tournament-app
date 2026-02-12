"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DeviceInfo } from "@/database/getDevices";
import Modal from "./Modal";
import Button from "../Button";

interface DeleteDeviceModalProps {
  device: DeviceInfo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteDeviceModal({
  device,
  isOpen,
  onClose,
  onSuccess,
}: DeleteDeviceModalProps) {
  const t = useTranslations("Admin.devices");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/devices/${encodeURIComponent(device.device_token)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete device");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("deleteDevice")}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-gray-700">
          {t("deleteConfirmation")}{" "}
          <strong className="text-gray-900 font-mono text-xs">
            {device.device_token}
          </strong>{" "}
          ({device.submitter_name})?
        </p>
        <p className="text-sm text-red-600 mt-2">{t("deleteWarning")}</p>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={handleClose} disabled={loading} variant="admin-cancel">
          {t("cancel")}
        </Button>
        <Button onClick={handleDelete} disabled={loading} variant="danger">
          {loading ? t("deleting") : t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
