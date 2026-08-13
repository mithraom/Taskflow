import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import CardModal from "../components/CardModal";

interface List {
  _id: string;
  title: string;
  position: number;
}

interface Card {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  position: number;
  list: string;
}

const AVATAR_COLORS = [
  "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400",
  "bg-teal-400", "bg-blue-400", "bg-indigo-400", "bg-purple-400", "bg-pink-400",
];

const LIST_BAR_COLORS = [
  "bg-rose-400", "bg-orange-400", "bg-amber-400", "bg-lime-400",
  "bg-teal-400", "bg-sky-400", "bg-indigo-400", "bg-fuchsia-400",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function barColorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return LIST_BAR_COLORS[Math.abs(hash) % LIST_BAR_COLORS.length];
}

function PresenceBar({ viewers }: { viewers: string[] }) {
  if (viewers.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2">
      {viewers.slice(0, 5).map((name, i) => (
        <div
          key={i}
          title={name}
          className={`w-8 h-8 rounded-full ${colorForName(name)} border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      ))}
      {viewers.length > 5 && (
        <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700">
          +{viewers.length - 5}
        </div>
      )}
    </div>
  );
}

function SortableCard({
  card,
  onDelete,
  onOpen,
  isHighlighted,
}: {
  card: Card;
  onDelete: (id: string) => void;
  onOpen: (card: Card) => void;
  isHighlighted: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      className={`group/card relative bg-white border-2 rounded-lg p-2.5 pr-6 text-sm shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isHighlighted ? "ring-4 ring-fuchsia-300 border-fuchsia-400 bg-fuchsia-50" : "border-transparent hover:border-indigo-300"
      }`}
    >
      {card.title}
      {card.dueDate && (
        <span className="block text-[10px] text-gray-400 mt-1 font-medium">
          📅 {new Date(card.dueDate).toLocaleDateString()}
        </span>
      )}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(card._id);
        }}
        className="absolute top-2 right-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity text-xs"
        title="Delete card"
      >
        ✕
      </button>
    </div>
  );
}

function DroppableList({
  list,
  cards,
  newCardTitle,
  onCardTitleChange,
  onCreateCard,
  onDeleteCard,
  onDeleteList,
  onOpenCard,
  highlightedIds,
}: {
  list: List;
  cards: Card[];
  newCardTitle: string;
  onCardTitleChange: (value: string) => void;
  onCreateCard: () => void;
  onDeleteCard: (id: string) => void;
  onDeleteList: () => void;
  onOpenCard: (card: Card) => void;
  highlightedIds: Set<string>;
}) {
  const { setNodeRef } = useSortable({
    id: list._id,
    data: { type: "list-drop-zone", listId: list._id },
  });

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-3 w-72 flex-shrink-0 group/list overflow-hidden">
      <div className={`h-1.5 -m-3 mb-3 ${barColorFor(list._id)}`}></div>
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-gray-700 text-sm tracking-wide uppercase">{list.title}</h3>
        <button
          onClick={onDeleteList}
          className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover/list:opacity-100 transition-opacity font-medium"
          title="Delete list"
        >
          Delete
        </button>
      </div>

      <div ref={setNodeRef} className="space-y-2 mb-3 min-h-[20px]">
        <SortableContext
          items={cards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard
              key={card._id}
              card={card}
              onDelete={onDeleteCard}
              onOpen={onOpenCard}
              isHighlighted={highlightedIds.has(card._id)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Add a card"
          value={newCardTitle}
          onChange={(e) => onCardTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCreateCard();
          }}
          className="flex-1 border-2 border-gray-200 p-1.5 rounded-lg text-sm bg-white focus:outline-none focus:border-fuchsia-400 transition-colors"
        />
        <button
          onClick={onCreateCard}
          className="bg-gray-100 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [cardsByList, setCardsByList] = useState<Record<string, Card[]>>({});
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [viewers, setViewers] = useState<string[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const flashHighlight = (cardId: string) => {
    setHighlightedIds((prev) => new Set(prev).add(cardId));
    if (highlightTimers.current[cardId]) clearTimeout(highlightTimers.current[cardId]);
    highlightTimers.current[cardId] = setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 1200);
  };

  const loadBoardData = useCallback(async () => {
    if (!boardId) return;
    const listsRes = await api.get(`/lists/board/${boardId}`);
    setLists(listsRes.data);

    const cardsMap: Record<string, Card[]> = {};
    for (const list of listsRes.data) {
      const cardsRes = await api.get(`/cards/list/${list._id}`);
      cardsMap[list._id] = cardsRes.data;
    }
    setCardsByList(cardsMap);
  }, [boardId]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  useEffect(() => {
    if (!boardId) return;

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join-board", { boardId, userName: user?.name || "Guest" });
    });

    newSocket.on("presence:update", (names: string[]) => {
      setViewers(names);
    });

    newSocket.on("card:created", (card: Card) => {
      setCardsByList((prev) => {
        const existing = prev[card.list] || [];
        if (existing.some((c) => c._id === card._id)) return prev;
        return { ...prev, [card.list]: [...existing, card] };
      });
      flashHighlight(card._id);
    });

    newSocket.on("card:updated", (updatedCard: Card) => {
      setCardsByList((prev) => {
        const next = { ...prev };
        for (const listId in next) {
          next[listId] = next[listId].filter((c) => c._id !== updatedCard._id);
        }
        next[updatedCard.list] = [...(next[updatedCard.list] || []), updatedCard].sort(
          (a, b) => a.position - b.position
        );
        return next;
      });
      flashHighlight(updatedCard._id);
    });

    newSocket.on("card:deleted", ({ id }: { id: string }) => {
      setCardsByList((prev) => {
        const next = { ...prev };
        for (const listId in next) {
          next[listId] = next[listId].filter((c) => c._id !== id);
        }
        return next;
      });
    });

    newSocket.on("list:created", (list: List) => {
      setLists((prev) => {
        if (prev.some((l) => l._id === list._id)) return prev;
        return [...prev, list];
      });
      setCardsByList((prev) => ({ ...prev, [list._id]: prev[list._id] || [] }));
    });

    newSocket.on("list:updated", (updatedList: List) => {
      setLists((prev) => prev.map((l) => (l._id === updatedList._id ? updatedList : l)));
    });

    newSocket.on("list:deleted", ({ id }: { id: string }) => {
      setLists((prev) => prev.filter((l) => l._id !== id));
      setCardsByList((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    return () => {
      newSocket.emit("leave-board", boardId);
      newSocket.disconnect();
    };
  }, [boardId, user?.name]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !boardId) return;
    await api.post("/lists", { title: newListTitle, boardId, position: lists.length });
    setNewListTitle("");
  };

  const handleCreateCard = async (listId: string) => {
    const title = newCardTitles[listId];
    if (!title || !title.trim() || !boardId) return;
    await api.post("/cards", {
      title,
      listId,
      boardId,
      position: (cardsByList[listId] || []).length,
    });
    setNewCardTitles((prev) => ({ ...prev, [listId]: "" }));
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!boardId) return;
    await api.delete(`/cards/${cardId}?boardId=${boardId}`);
    setCardsByList((prev) => {
      const next = { ...prev };
      for (const listId in next) {
        next[listId] = next[listId].filter((c) => c._id !== cardId);
      }
      return next;
    });
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Delete this list and all its cards?") || !boardId) return;
    await api.delete(`/lists/${listId}?boardId=${boardId}`);
    setLists((prev) => prev.filter((l) => l._id !== listId));
  };

  const findListIdForCard = (cardId: string): string | null => {
    for (const listId in cardsByList) {
      if (cardsByList[listId].some((c) => c._id === cardId)) return listId;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const listId = findListIdForCard(cardId);
    if (listId) {
      const card = cardsByList[listId].find((c) => c._id === cardId);
      setActiveCard(card || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !boardId) return;

    const activeCardId = active.id as string;
    const sourceListId = findListIdForCard(activeCardId);
    if (!sourceListId) return;

    const overData = over.data.current;
    const overId = over.id as string;

    let targetListId: string;
    if (overData?.type === "card") {
      targetListId = findListIdForCard(overId) || sourceListId;
    } else {
      targetListId = overId;
    }

    if (!cardsByList[targetListId]) return;

    if (sourceListId === targetListId) {
      const items = cardsByList[sourceListId];
      const oldIndex = items.findIndex((c) => c._id === activeCardId);
      const newIndex = items.findIndex((c) => c._id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      setCardsByList((prev) => ({ ...prev, [sourceListId]: reordered }));

      const movedCard = reordered[newIndex];
      await api.put(`/cards/${movedCard._id}`, {
        position: newIndex,
        boardId,
      });
    } else {
      const sourceItems = [...cardsByList[sourceListId]];
      const targetItems = [...cardsByList[targetListId]];

      const movingIndex = sourceItems.findIndex((c) => c._id === activeCardId);
      const [movingCard] = sourceItems.splice(movingIndex, 1);

      let insertIndex = targetItems.findIndex((c) => c._id === overId);
      if (insertIndex === -1) insertIndex = targetItems.length;

      const updatedCard = { ...movingCard, list: targetListId };
      targetItems.splice(insertIndex, 0, updatedCard);

      setCardsByList((prev) => ({
        ...prev,
        [sourceListId]: sourceItems,
        [targetListId]: targetItems,
      }));

      await api.put(`/cards/${movingCard._id}`, {
        listId: targetListId,
        position: insertIndex,
        boardId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-indigo-600 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white font-semibold hover:underline bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur"
          >
            ← Dashboard
          </button>
          {socket?.connected && (
            <span className="text-xs bg-white/90 text-green-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>
        <PresenceBar viewers={viewers} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists
            .sort((a, b) => a.position - b.position)
            .map((list) => (
              <DroppableList
                key={list._id}
                list={list}
                cards={(cardsByList[list._id] || []).sort((a, b) => a.position - b.position)}
                newCardTitle={newCardTitles[list._id] || ""}
                onCardTitleChange={(value) =>
                  setNewCardTitles((prev) => ({ ...prev, [list._id]: value }))
                }
                onCreateCard={() => handleCreateCard(list._id)}
                onDeleteCard={handleDeleteCard}
                onDeleteList={() => handleDeleteList(list._id)}
                onOpenCard={setSelectedCard}
                highlightedIds={highlightedIds}
              />
            ))}

          <form onSubmit={handleCreateList} className="w-72 flex-shrink-0">
            <input
              type="text"
              placeholder="+ Add another list"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              className="w-full border-2 border-white/40 p-2.5 rounded-xl bg-white/20 backdrop-blur text-white placeholder-white/80 font-medium focus:outline-none focus:border-white transition-colors"
            />
          </form>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="bg-white border-2 border-fuchsia-400 rounded-lg p-2.5 text-sm shadow-2xl w-64">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedCard && boardId && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
          onUpdated={loadBoardData}
        />
      )}
    </div>
  );
}