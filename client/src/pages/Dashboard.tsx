import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SearchBar from "../components/SearchBar";

interface Workspace {
  _id: string;
  name: string;
}

interface Board {
  _id: string;
  title: string;
  workspace: string;
}

const BOARD_GRADIENTS = [
  "from-pink-500 to-rose-500",
  "from-orange-400 to-amber-500",
  "from-lime-400 to-green-500",
  "from-teal-400 to-cyan-500",
  "from-sky-400 to-blue-500",
  "from-indigo-400 to-violet-500",
  "from-fuchsia-500 to-purple-600",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return BOARD_GRADIENTS[Math.abs(hash) % BOARD_GRADIENTS.length];
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Record<string, Board[]>>({});
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newBoardTitles, setNewBoardTitles] = useState<Record<string, string>>({});
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadWorkspaces = async () => {
    const res = await api.get("/workspaces");
    setWorkspaces(res.data);
    for (const ws of res.data) {
      const boardsRes = await api.get(`/boards/workspace/${ws._id}`);
      setBoards((prev) => ({ ...prev, [ws._id]: boardsRes.data }));
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_API_URL);

    socket.on("workspace:created", (workspace: Workspace) => {
      setWorkspaces((prev) => {
        if (prev.some((w) => w._id === workspace._id)) return prev;
        return [...prev, workspace];
      });
    });

    socket.on("workspace:updated", (workspace: Workspace) => {
      setWorkspaces((prev) => {
        const exists = prev.some((w) => w._id === workspace._id);
        if (!exists) return [...prev, workspace];
        return prev.map((w) => (w._id === workspace._id ? workspace : w));
      });
    });

    socket.on("workspace:deleted", ({ id }: { id: string }) => {
      setWorkspaces((prev) => prev.filter((w) => w._id !== id));
      setBoards((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on("board:created", (board: Board) => {
      setBoards((prev) => {
        const existing = prev[board.workspace] || [];
        if (existing.some((b) => b._id === board._id)) return prev;
        return { ...prev, [board.workspace]: [...existing, board] };
      });
    });

    socket.on("board:deleted", ({ id }: { id: string }) => {
      setBoards((prev) => {
        const next = { ...prev };
        for (const wsId in next) {
          next[wsId] = next[wsId].filter((b) => b._id !== id);
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await api.post("/workspaces", { name: newWorkspaceName });
    setNewWorkspaceName("");
  };

  const handleCreateBoard = async (workspaceId: string) => {
    const title = newBoardTitles[workspaceId];
    if (!title || !title.trim()) return;
    await api.post("/boards", { title, workspaceId });
    setNewBoardTitles((prev) => ({ ...prev, [workspaceId]: "" }));
  };

  const handleDeleteWorkspace = async (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this workspace? This cannot be undone.")) return;
    await api.delete(`/workspaces/${workspaceId}`);
  };

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this board?")) return;
    await api.delete(`/boards/${boardId}`);
  };

  const handleInvite = async (workspaceId: string) => {
    const email = inviteEmails[workspaceId];
    if (!email || !email.trim()) return;
    try {
      await api.post(`/workspaces/${workspaceId}/invite`, { email });
      setInviteStatus((prev) => ({ ...prev, [workspaceId]: `✓ ${email} added` }));
      setInviteEmails((prev) => ({ ...prev, [workspaceId]: "" }));
      setTimeout(() => {
        setInviteStatus((prev) => ({ ...prev, [workspaceId]: "" }));
      }, 3000);
    } catch (err: any) {
      setInviteStatus((prev) => ({
        ...prev,
        [workspaceId]: err.response?.data?.error || "Failed to invite",
      }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center text-lg shadow-md">
              📋
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800">
              Welcome, <span className="text-fuchsia-600">{user?.name}</span>
            </h1>
          </div>

          <SearchBar />

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/profile")}
              className="bg-white border-2 border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors font-medium shadow-sm"
            >
              Log Out
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateWorkspace} className="mb-8 flex gap-2">
          <input
            type="text"
            placeholder="New workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="flex-1 border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:border-fuchsia-400 transition-colors"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white px-5 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold shadow-md"
          >
            Create Workspace
          </button>
        </form>

        {workspaces.map((ws) => (
          <div key={ws._id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-4 group">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-gradient-to-b from-fuchsia-500 to-orange-400 rounded-full"></span>
                {ws.name}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/workspace/${ws._id}/team`)}
                  className="text-gray-500 hover:text-fuchsia-600 text-sm font-medium transition-colors"
                >
                  Team
                </button>
                <button
                  onClick={(e) => handleDeleteWorkspace(ws._id, e)}
                  className="text-gray-400 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                  title="Delete workspace"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {(boards[ws._id] || []).map((board) => (
                <div
                  key={board._id}
                  onClick={() => navigate(`/board/${board._id}`)}
                  className={`group relative rounded-xl p-5 h-24 cursor-pointer bg-gradient-to-br ${gradientFor(
                    board._id
                  )} text-white font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all flex items-end`}
                >
                  {board.title}
                  <button
                    onClick={(e) => handleDeleteBoard(board._id, e)}
                    className="absolute top-2 right-2 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-black/20 rounded-full w-6 h-6 flex items-center justify-center"
                    title="Delete board"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-1">
              <input
                type="text"
                placeholder="New board title"
                value={newBoardTitles[ws._id] || ""}
                onChange={(e) =>
                  setNewBoardTitles((prev) => ({ ...prev, [ws._id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBoard(ws._id);
                }}
                className="flex-1 border-2 border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:border-fuchsia-400 transition-colors"
              />
              <button
                onClick={() => handleCreateBoard(ws._id)}
                className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                Add Board
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Invite a collaborator
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="teammate@email.com"
                  value={inviteEmails[ws._id] || ""}
                  onChange={(e) =>
                    setInviteEmails((prev) => ({ ...prev, [ws._id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInvite(ws._id);
                  }}
                  className="flex-1 border-2 border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:border-teal-400 transition-colors"
                />
                <button
                  onClick={() => handleInvite(ws._id)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 transition-colors font-medium"
                >
                  Invite
                </button>
              </div>
              {inviteStatus[ws._id] && (
                <p
                  className={`text-xs mt-1.5 ${
                    inviteStatus[ws._id].startsWith("✓") ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {inviteStatus[ws._id]}
                </p>
              )}
            </div>
          </div>
        ))}

        {workspaces.length === 0 && (
          <p className="text-gray-500 text-center mt-12">
            No workspaces yet — create one above to get started.
          </p>
        )}
      </div>
    </div>
  );
}