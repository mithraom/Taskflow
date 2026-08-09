import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Workspace {
  _id: string;
  name: string;
}

interface Board {
  _id: string;
  title: string;
  workspace: string;
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Record<string, Board[]>>({});
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newBoardTitles, setNewBoardTitles] = useState<Record<string, string>>({});
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
    const socket: Socket = io("http://localhost:5000");

    socket.on("workspace:created", (workspace: Workspace) => {
      setWorkspaces((prev) => {
        if (prev.some((w) => w._id === workspace._id)) return prev;
        return [...prev, workspace];
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
          >
            Log Out
          </button>
        </div>

        <form onSubmit={handleCreateWorkspace} className="mb-8 flex gap-2">
          <input
            type="text"
            placeholder="New workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Create Workspace
          </button>
        </form>

        {workspaces.map((ws) => (
          <div key={ws._id} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4 group">
              <h2 className="text-xl font-semibold">{ws.name}</h2>
              <button
                onClick={(e) => handleDeleteWorkspace(ws._id, e)}
                className="text-gray-400 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete workspace"
              >
                Delete
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {(boards[ws._id] || []).map((board) => (
                <div
                  key={board._id}
                  onClick={() => navigate(`/board/${board._id}`)}
                  className="group relative border rounded p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  {board.title}
                  <button
                    onClick={(e) => handleDeleteBoard(board._id, e)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    title="Delete board"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
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
                className="flex-1 border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => handleCreateBoard(ws._id)}
                className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                Add Board
              </button>
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