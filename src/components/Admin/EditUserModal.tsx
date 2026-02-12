"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserInfo } from "@/database/getUsers";
import Modal from "./Modal";
import Button from "../Button";

interface EditUserModalProps {
  user: UserInfo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const t = useTranslations("Admin.users");
  const [role, setRole] = useState<"user" | "admin">(user.role as "user" | "admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"role" | "password">("role");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body =
        activeTab === "role" ? { role } : { password };

      const response = await fetch(`/api/admin/users/${user.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      setPassword("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRole(user.role as "user" | "admin");
    setPassword("");
    setError(null);
    setActiveTab("role");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("editUser")}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-700">
            {t("editingUser")}: <strong>{user.username}</strong>
          </p>
        </div>

        <div className="border-b border-gray-200 mb-4" role="tablist">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              role="tab"
              id="role-tab"
              aria-selected={activeTab === "role"}
              aria-controls="role-panel"
              onClick={() => setActiveTab("role")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "role"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("changeRole")}
            </button>
            <button
              type="button"
              role="tab"
              id="password-tab"
              aria-selected={activeTab === "password"}
              aria-controls="password-panel"
              onClick={() => setActiveTab("password")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("changePassword")}
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {activeTab === "role" ? (
            <div role="tabpanel" id="role-panel" aria-labelledby="role-tab">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                {t("role")}
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ) : (
            <div role="tabpanel" id="password-panel" aria-labelledby="password-tab">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {t("newPassword")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={handleClose} disabled={loading} variant="admin-cancel">
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={loading || (activeTab === "password" && !password)}
            variant="admin-primary"
          >
            {loading ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
