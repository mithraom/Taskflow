import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      setName(res.data.name);
      setEmail(res.data.email);
    });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await api.put("/auth/me", { name, email });
      localStorage.setItem(
        "user",
        JSON.stringify({ id: res.data._id, name: res.data.name, email: res.data.email })
      );
      setProfileMsg({ text: "Profile updated successfully", ok: true });
    } catch (err: any) {
      setProfileMsg({ text: err.response?.data?.error || "Failed to update profile", ok: false });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setSavingPassword(true);
    try {
      await api.put("/auth/me/password", { currentPassword, newPassword });
      setPasswordMsg({ text: "Password changed successfully", ok: true });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg({ text: err.response?.data?.error || "Failed to change password", ok: false });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-fuchsia-600 hover:underline font-medium"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors font-medium shadow-sm"
          >
            Log Out
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">{user?.name}</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Profile Information</h2>
          <form onSubmit={handleProfileSave}>
            {profileMsg && (
              <p
                className={`text-sm rounded-lg px-3 py-2 mb-4 border ${
                  profileMsg.ok
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}
              >
                {profileMsg.text}
              </p>
            )}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-fuchsia-400 transition-colors"
              />
            </div>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-fuchsia-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            {passwordMsg && (
              <p
                className={`text-sm rounded-lg px-3 py-2 mb-4 border ${
                  passwordMsg.ok
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}
              >
                {passwordMsg.text}
              </p>
            )}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}