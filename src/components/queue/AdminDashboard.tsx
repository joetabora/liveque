"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useQueue } from "@/hooks/useQueue";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { IronQueueLogo } from "@/components/IronQueueLogo";
import { useToast } from "@/components/ui/Toast";
import {
  addToQueue,
  updateQueueItem,
  startService,
  completeService,
  callNext,
  skipItem,
  removeItem,
  clearQueue,
  reorderQueue,
} from "@/lib/queue-operations";
import type { QueueItem } from "@/lib/types";

const inputClass =
  "w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all";

interface AdminDashboardProps {
  slug: string;
  tenantId: string | null;
  displayPath?: string;
  portraitDisplayPath?: string;
  useLegacy?: boolean;
  embedded?: boolean;
}

export default function AdminDashboard({
  slug,
  tenantId,
  displayPath,
  portraitDisplayPath,
  useLegacy = false,
  embedded = false,
}: AdminDashboardProps) {
  const { waiting, serving, loading } = useQueue({ tenantId, useLegacy });
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [hereToSee, setHereToSee] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHereToSee, setEditHereToSee] = useState("");

  const displayUrl = displayPath ?? `/${slug}/display/main?kiosk=1`;
  const portraitDisplayUrl =
    portraitDisplayPath ?? `/${slug}/display/portrait?kiosk=1`;

  const displayLinks = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <a
        href={displayUrl}
        target="_blank"
        className="text-gray-500 hover:text-brand-primary transition-colors underline underline-offset-4"
      >
        Landscape display →
      </a>
      <a
        href={portraitDisplayUrl}
        target="_blank"
        className="text-gray-500 hover:text-brand-primary transition-colors underline underline-offset-4"
      >
        Portrait display →
      </a>
    </div>
  );

  const startEdit = useCallback((item: QueueItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditHereToSee(item.hereToSee ?? "");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditHereToSee("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editName.trim()) return;
    setActionLoading(`edit-${editingId}`);
    try {
      await updateQueueItem(slug, editingId, {
        name: editName.trim(),
        hereToSee: editHereToSee.trim() || undefined,
      });
      cancelEdit();
    } catch (err) {
      console.error("Failed to update:", err);
      toast("Failed to save changes", "error");
    } finally {
      setActionLoading(null);
    }
  }, [editingId, editName, editHereToSee, cancelEdit, slug, toast]);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) return;
    setAddLoading(true);
    try {
      await addToQueue(slug, {
        name: name.trim(),
        hereToSee: hereToSee.trim() || undefined,
      });
      setName("");
      setHereToSee("");
    } catch (err) {
      console.error("Failed to add to queue:", err);
      const message =
        err instanceof Error ? err.message : "Failed to add customer";
      toast(message, "error");
    } finally {
      setAddLoading(false);
    }
  }, [name, hereToSee, slug, toast]);

  const handleAction = useCallback(
    async (id: string, action: () => Promise<unknown>) => {
      setActionLoading(id);
      try {
        await action();
      } catch (err) {
        console.error("Action failed:", err);
        toast("Action failed", "error");
      } finally {
        setActionLoading(null);
      }
    },
    [toast]
  );

  const handleCallNext = useCallback(async () => {
    setActionLoading("call-next");
    try {
      await callNext(slug);
    } catch (err) {
      toast("Call next failed", "error");
    } finally {
      setActionLoading(null);
    }
  }, [slug, toast]);

  const handleClearQueue = useCallback(async () => {
    setShowClearConfirm(false);
    setActionLoading("clear");
    try {
      await clearQueue(slug);
    } catch (err) {
      toast("Failed to clear queue", "error");
    } finally {
      setActionLoading(null);
    }
  }, [slug, toast]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(waiting);
      const [reordered] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reordered);

      const updates = items.map((item, index) => ({
        id: item.id,
        position: index + 1,
      }));

      reorderQueue(slug, updates).catch(() => toast("Reorder failed", "error"));
    },
    [waiting, slug, toast]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-iron-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 uppercase tracking-widest text-sm">
            Loading Dashboard
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-iron-black"}>
      {!embedded && (
      <header className="sticky top-0 z-40 bg-iron-black/90 backdrop-blur-md border-b border-iron-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <IronQueueLogo size="sm" />
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Badge variant="orange">{waiting.length} waiting</Badge>
            {displayLinks}
          </div>
        </div>
      </header>
      )}

      <main className={embedded ? "space-y-8" : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8"}>
        {embedded && displayLinks}
        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            onClick={handleCallNext}
            loading={actionLoading === "call-next"}
            disabled={waiting.length === 0}
            className="flex-1 sm:flex-none min-w-[200px]"
          >
            Call Next
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => setShowClearConfirm(true)}
            disabled={waiting.length === 0 && !serving}
            className="flex-1 sm:flex-none"
          >
            Clear Queue
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Panel animate={false}>
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-gray-300">
                Add Customer
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdd();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Name / Ticket #
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John or #042"
                    className={`${inputClass} text-lg`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Here to see
                  </label>
                  <input
                    type="text"
                    value={hereToSee}
                    onChange={(e) => setHereToSee(e.target.value)}
                    placeholder="e.g. Mike, Sales desk"
                    className={`${inputClass} text-lg`}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  loading={addLoading}
                  disabled={!name.trim()}
                  className="w-full"
                >
                  Add to Queue
                </Button>
              </form>
            </Panel>

            <Panel glow={!!serving} animate={false}>
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-gray-300">
                Now Serving
              </h2>
              <AnimatePresence mode="wait">
                {serving ? (
                  <motion.div
                    key={serving.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {editingId === serving.id ? (
                      <form
                        className="space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEdit();
                        }}
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`${inputClass} text-lg`}
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editHereToSee}
                          onChange={(e) => setEditHereToSee(e.target.value)}
                          placeholder="e.g. Mike, Sales desk"
                          className={inputClass}
                        />
                        <div className="flex gap-2 pt-1">
                          <Button type="submit" size="md" className="flex-1" loading={actionLoading === `edit-${serving.id}`} disabled={!editName.trim()}>
                            Save
                          </Button>
                          <Button type="button" variant="ghost" size="md" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="text-center py-4">
                          <h3 className="text-4xl font-black text-brand-primary text-glow-brand">
                            {serving.name}
                          </h3>
                          {serving.hereToSee && (
                            <p className="mt-2 text-lg text-gray-400">
                              Here to see{" "}
                              <span className="text-white font-semibold">{serving.hereToSee}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            onClick={() => handleAction(serving.id, () => completeService(slug, serving.id))}
                            loading={actionLoading === serving.id}
                          >
                            Complete Service
                          </Button>
                          <Button variant="ghost" size="md" className="w-full" onClick={() => startEdit(serving)}>
                            Edit
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-gray-600">
                    <p className="text-lg">No one being served</p>
                    <p className="text-sm mt-1">Press Call Next to begin</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </div>

          <div className="lg:col-span-2">
            <Panel animate={false} className="min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-300">
                  Waiting Queue
                </h2>
                <span className="text-sm text-gray-500">
                  {editingId ? "Finish editing to reorder" : "Drag to reorder"}
                </span>
              </div>

              {waiting.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <p className="text-lg font-medium">Queue is empty</p>
                  <p className="text-sm mt-1">Add a customer to get started</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="queue">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                        {waiting.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!!editingId}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 rounded-xl border transition-all ${
                                  editingId === item.id || snapshot.isDragging
                                    ? "bg-iron-dark border-brand-primary/40 shadow-xl glow-brand"
                                    : "bg-iron-dark/50 border-iron-border/50 hover:border-iron-border"
                                }`}
                              >
                                {editingId === item.id ? (
                                  <form
                                    className="space-y-3"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleSaveEdit();
                                    }}
                                  >
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} autoFocus />
                                    <input type="text" value={editHereToSee} onChange={(e) => setEditHereToSee(e.target.value)} placeholder="e.g. Mike, Sales desk" className={inputClass} />
                                    <div className="flex justify-end gap-2">
                                      <Button type="submit" size="sm" loading={actionLoading === `edit-${item.id}`} disabled={!editName.trim()}>Save</Button>
                                      <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div {...provided.dragHandleProps} className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1">⋮⋮</div>
                                    <span className="text-lg font-black text-gray-600 w-8 text-center">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-lg font-bold text-white truncate">{item.name}</h3>
                                      {item.hereToSee && (
                                        <p className="text-sm text-gray-500 truncate">Here to see <span className="text-gray-300">{item.hereToSee}</span></p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                      <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>Edit</Button>
                                      <Button size="sm" onClick={() => handleAction(item.id, () => startService(slug, item.id))} loading={actionLoading === item.id}>Serve</Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleAction(`skip-${item.id}`, () => skipItem(slug, item.id))} loading={actionLoading === `skip-${item.id}`}>Skip</Button>
                                      <Button variant="danger" size="sm" onClick={() => handleAction(`rm-${item.id}`, () => removeItem(slug, item.id))} loading={actionLoading === `rm-${item.id}`}>✕</Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Panel>
          </div>
        </div>
      </main>

      <ConfirmModal
        open={showClearConfirm}
        title="Clear Entire Queue"
        message="This will remove all customers from the queue, including whoever is currently being served. This action cannot be undone."
        confirmLabel="Clear Everything"
        onConfirm={handleClearQueue}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
