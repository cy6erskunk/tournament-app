"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserInfo } from "@/database/getUsers";
import Modal from "./Modal";
import Button from "../Button";

interface DeleteUserModalProps {
  user: UserInfo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: DeleteUserModalProps) {
  const t = useTranslations("Admin.users");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.username}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t("deleteUser")}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-gray-700">
          {t("deleteConfirmation")}{" "}
          <strong className="text-gray-900">{user.username}</strong>?
        </p>
        <p className="text-sm text-red-600 mt-2">
          {t("deleteWarning")}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" onClick={handleClose} disabled={loading} variant="admin-cancel">
          {t("cancel")}
        </Button>
        <Button type="button" onClick={handleDelete} disabled={loading} variant="danger">
          {loading ? t("deleting") : t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
