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
import {
  addToQueue,
  startService,
  completeService,
  callNext,
  skipItem,
  removeItem,
  clearQueue,
  reorderQueue,
} from "@/lib/queue-operations";
import { SERVICE_TYPES } from "@/lib/types";

export default function AdminClient() {
  const { waiting, serving, loading } = useQueue();
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) return;
    setAddLoading(true);
    try {
      await addToQueue({
        name: name.trim(),
        serviceType: serviceType || undefined,
      });
      setName("");
      setServiceType("");
    } finally {
      setAddLoading(false);
    }
  }, [name, serviceType]);

  const handleAction = useCallback(
    async (id: string, action: () => Promise<unknown>) => {
      setActionLoading(id);
      try {
        await action();
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  const handleCallNext = useCallback(async () => {
    setActionLoading("call-next");
    try {
      await callNext();
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleClearQueue = useCallback(async () => {
    setShowClearConfirm(false);
    setActionLoading("clear");
    try {
      await clearQueue();
    } finally {
      setActionLoading(null);
    }
  }, []);

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

      reorderQueue(updates);
    },
    [waiting]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-iron-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-harley-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 uppercase tracking-widest text-sm">
            Loading Dashboard
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-iron-black/90 backdrop-blur-md border-b border-iron-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <IronQueueLogo size="sm" />
          <div className="flex items-center gap-3">
            <Badge variant="orange">{waiting.length} waiting</Badge>
            <a
              href="/display"
              target="_blank"
              className="text-sm text-gray-500 hover:text-harley-orange transition-colors underline underline-offset-4"
            >
              Open Display →
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Global Actions */}
        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            onClick={handleCallNext}
            loading={actionLoading === "call-next"}
            disabled={waiting.length === 0}
            className="flex-1 sm:flex-none min-w-[200px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
          {/* Add Customer Panel */}
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
                    className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-3 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-harley-orange/50 focus:ring-1 focus:ring-harley-orange/30 transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-harley-orange/50 focus:ring-1 focus:ring-harley-orange/30 transition-all cursor-pointer"
                  >
                    <option value="">Select service (optional)</option>
                    {SERVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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

            {/* Now Serving Panel */}
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
                    <div className="text-center py-4">
                      <h3 className="text-4xl font-black text-harley-orange text-glow-orange">
                        {serving.name}
                      </h3>
                      {serving.serviceType && (
                        <p className="text-sm text-gray-400 mt-2 uppercase tracking-wider">
                          {serving.serviceType}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full mt-4"
                      onClick={() =>
                        handleAction(serving.id, () =>
                          completeService(serving.id)
                        )
                      }
                      loading={actionLoading === serving.id}
                    >
                      ✓ Complete Service
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-600"
                  >
                    <p className="text-lg">No one being served</p>
                    <p className="text-sm mt-1">Press &quot;Call Next&quot; to begin</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </div>

          {/* Queue List */}
          <div className="lg:col-span-2">
            <Panel animate={false} className="min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-300">
                  Waiting Queue
                </h2>
                <span className="text-sm text-gray-500">
                  Drag to reorder
                </span>
              </div>

              {waiting.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <svg
                    className="w-16 h-16 mb-4 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium">Queue is empty</p>
                  <p className="text-sm mt-1">Add a customer to get started</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="queue">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3"
                      >
                        {waiting.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  flex items-center gap-4 p-4 rounded-xl border transition-all
                                  ${
                                    snapshot.isDragging
                                      ? "bg-iron-dark border-harley-orange/40 shadow-xl glow-orange"
                                      : "bg-iron-dark/50 border-iron-border/50 hover:border-iron-border"
                                  }
                                `}
                              >
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                                  </svg>
                                </div>

                                {/* Position number */}
                                <span className="text-lg font-black text-gray-600 w-8 text-center">
                                  {index + 1}
                                </span>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-bold text-white truncate">
                                    {item.name}
                                  </h3>
                                  {item.serviceType && (
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                                      {item.serviceType}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleAction(item.id, () =>
                                        startService(item.id)
                                      )
                                    }
                                    loading={actionLoading === item.id}
                                  >
                                    Serve
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleAction(
                                        `skip-${item.id}`,
                                        () => skipItem(item.id)
                                      )
                                    }
                                    loading={actionLoading === `skip-${item.id}`}
                                    title="Move to bottom"
                                  >
                                    Skip
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      handleAction(
                                        `rm-${item.id}`,
                                        () => removeItem(item.id)
                                      )
                                    }
                                    loading={actionLoading === `rm-${item.id}`}
                                    title="Remove from queue"
                                  >
                                    ✕
                                  </Button>
                                </div>
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
