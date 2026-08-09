import { useState, useEffect, useCallback } from "react";
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

interface List {
  _id: string;
  title: string;
  position: number;
}

interface Card {
  _id: string;
  title: string;
  description?: string;
  position: number;
  list: string;
}

function SortableCard({
  card,
  onDelete,
}: {
  card: Card;
  onDelete: (id: string) => void;
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
      className="group/card relative bg-gray-50 border rounded p-2 pr-6 text-sm hover:border-blue-400 transition-colors cursor-grab active:cursor-grabbing"
    >
      {card.title}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(card._id)}
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
}: {
  list: List;
  cards: Card[];
  newCardTitle: string;
  onCardTitleChange: (value: string) => void;
  onCreateCard: () => void;
  onDeleteCard: (id: string) => void;
  onDeleteList: () => void;
}) {
  const { setNodeRef } = useSortable({
    id: list._id,
    data: { type: "list-drop-zone", listId: list._id },
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-72 flex-shrink-0 group/list">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">{list.title}</h3>
        <button
          onClick={onDeleteList}
          className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover/list:opacity-100 transition-opacity"
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
            <SortableCard key={card._id} card={card} onDelete={onDeleteCard} />
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
          className="flex-1 border p-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={onCreateCard}
          className="bg-gray-200 px-2 rounded text-sm hover:bg-gray-300 transition-colors"
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
  const [lists, setLists] = useState<List[]>([]);
  const [cardsByList, setCardsByList] = useState<Record<string, Card[]>>({});
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
      newSocket.emit("join-board", boardId);
    });

    newSocket.on("card:created", (card: Card) => {
      setCardsByList((prev) => {
        const existing = prev[card.list] || [];
        if (existing.some((c) => c._id === card._id)) return prev;
        return { ...prev, [card.list]: [...existing, card] };
      });
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
  }, [boardId]);

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
        {socket?.connected && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Live
          </span>
        )}
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
              />
            ))}

          <form onSubmit={handleCreateList} className="w-72 flex-shrink-0">
            <input
              type="text"
              placeholder="+ Add another list"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              className="w-full border p-2 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </form>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="bg-white border-2 border-blue-400 rounded p-2 text-sm shadow-lg w-64">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}