'use client';

import { useEffect, useState } from "react";
import { auth } from "@/app/auth/firebase";
import {
  updateEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

const passwordRequirements = [
  {
    label: "At least 8 characters",
    isValid: (value: string) => value.length >= 8,
  },
  {
    label: "At least 1 capital letter",
    isValid: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "At least 1 special character",
    isValid: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export default function Settings() {
  const user = auth.currentUser;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Helper: reauthenticate user when Firebase requires recent login
  async function reauthenticateUser(password: string) {
    if (!user || !user.email) throw new Error("No user logged in");

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  }

  const passwordIsValid =
    newPassword.length === 0 ||
    passwordRequirements.every((req) => req.isValid(newPassword));

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      // Update username
      if (username !== user.displayName) {
        await updateProfile(user, { displayName: username });
      }

      // Update email
      if (email !== user.email) {
        try {
          await updateEmail(user, email);
        } catch (err) {
          if (err instanceof FirebaseError) {
            if (err.code === "auth/requires-recent-login") {
              const password = prompt("Please enter your current password to continue:");
              if (!password) throw new Error("Reauthentication cancelled.");
              await reauthenticateUser(password);
              await updateEmail(user, email);
            } else {
              throw err;
            }
          }
        }
      }

      // Update password
      if (newPassword.trim().length > 0) {
        if (!passwordIsValid) {
          setMessage("Password does not meet requirements.");
          setSaving(false);
          return;
        }

        try {
          await updatePassword(user, newPassword);
        } catch (err) {
          if (err instanceof FirebaseError) {
            if (err.code === "auth/requires-recent-login") {
              const password = prompt("Please enter your current password to continue:");
              if (!password) throw new Error("Reauthentication cancelled.");
              await reauthenticateUser(password);
              await updateEmail(user, email);
            } else {
              throw err;
            }
          }
        }
      }

      setMessage("Settings updated successfully.");
    } catch (err) {
      if (err instanceof FirebaseError) { 
        setMessage(err.message);
      }
      else {
        setMessage("Failed to update settings.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;

    setDeleting(true);
    setMessage("");

    try {
      const password = prompt("Please enter your password to confirm account deletion:");
      if (!password) throw new Error("Account deletion cancelled.");

      await reauthenticateUser(password);
      await deleteUser(user);

      window.location.href = "/signup";
    } catch (err) {
      if (err instanceof FirebaseError) { 
        setMessage(err.message);
      }
      else {
        setMessage("Failed to delete account.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account details.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {message && <p className="text-sm text-blue-600">{message}</p>}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Password Requirements */}
          {newPassword.length > 0 && (
            <ul className="mt-3 space-y-1">
              {passwordRequirements.map((req) => {
                const valid = req.isValid(newPassword);
                return (
                  <li
                    key={req.label}
                    className={`text-sm flex items-center gap-2 ${
                      valid ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span>{valid ? "✔" : "✖"}</span>
                    {req.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => {
              setUsername(user?.displayName || "");
              setEmail(user?.email || "");
              setNewPassword("");
            }}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-3">
          Once you delete your account, there is no going back.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}