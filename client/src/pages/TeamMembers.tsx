import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Member {
  _id: string;
  user: { _id: string; name: string; email: string };
  role: "OWNER" | "MEMBER";
}

const AVATAR_COLORS = [
  "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400",
  "bg-teal-400", "bg-blue-400", "bg-indigo-400", "bg-purple-400", "bg-pink-400",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function TeamMembers() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  const loadMembers = async () => {
    if (!workspaceId) return;
    const wsRes = await api.get(`/workspaces/${workspaceId}`);
    setWorkspaceName(wsRes.data.name);
    const membersRes = await api.get(`/workspaces/${workspaceId}/members`);
    setMembers(membersRes.data);
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const myRole = members.find((m) => m.user._id === user?.id)?.role;
  const isOwner = myRole === "OWNER";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !workspaceId) return;
    try {
      await api.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail });
      setStatus({ text: `✓ ${inviteEmail} added to the team`, ok: true });
      setInviteEmail("");
      loadMembers();
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ text: err.response?.data?.error || "Failed to invite", ok: false });
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!workspaceId) return;
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    loadMembers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-fuchsia-600 hover:underline font-medium mb-6 inline-block"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-extrabold text-gray-800 mb-1">
          Team — {workspaceName}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>

        {isOwner && (
          <form
            onSubmit={handleInvite}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 mb-6"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Invite a new member
            </p>
            {status && (
              <p
                className={`text-sm rounded-lg px-3 py-2 mb-3 border ${
                  status.ok
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}
              >
                {status.text}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="teammate@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:border-fuchsia-400 transition-colors"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white px-5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
              >
                Invite
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100">
          {members.map((m) => (
            <div key={m._id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${colorForName(
                    m.user.name
                  )} flex items-center justify-center text-sm font-bold text-white shadow-sm`}
                >
                  {m.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{m.user.name}</p>
                  <p className="text-gray-500 text-xs">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    m.role === "OWNER"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m.role}
                </span>
                {isOwner && m.role !== "OWNER" && (
                  <button
                    onClick={() => handleRemove(m.user._id, m.user.name)}
                    className="text-gray-300 hover:text-red-500 text-xs font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}