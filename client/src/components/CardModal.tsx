import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Card {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  list: string;
}

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; email: string };
  createdAt: string;
}

interface CardModalProps {
  card: Card;
  boardId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function CardModal({ card, boardId, onClose, onUpdated }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.slice(0, 10) : "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/comments/card/${card._id}`).then((res) => setComments(res.data));
  }, [card._id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/cards/${card._id}`, {
        title,
        description,
        dueDate: dueDate || undefined,
        boardId,
      });
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const res = await api.post("/comments", {
      content: newComment,
      cardId: card._id,
      boardId,
    });
    setComments((prev) => [...prev, res.data]);
    setNewComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.delete(`/comments/${commentId}?boardId=${boardId}`);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold text-gray-800 w-full border-none focus:outline-none focus:ring-2 focus:ring-fuchsia-300 rounded-lg px-2 py-1 -ml-2"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl ml-4 flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-fuchsia-400 transition-colors resize-none"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-2 border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:border-fuchsia-400 transition-colors"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white px-5 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 mb-6"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              Comments ({comments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c._id} className="bg-gray-50 rounded-xl p-3 group relative">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-semibold text-gray-700">{c.author?.name}</p>
                    {c.author?._id === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No comments yet</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment();
                }}
                placeholder="Write a comment..."
                className="flex-1 border-2 border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:border-fuchsia-400 transition-colors"
              />
              <button
                onClick={handleAddComment}
                className="bg-gray-800 text-white px-4 rounded-xl text-sm hover:bg-gray-900 transition-colors font-medium"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}