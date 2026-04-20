import { useRef, useState, useCallback } from "react";
import { 
  BuilderElement, BuilderElementType, 
  GRID_SIZE, snapToGrid, 
  DEFAULT_SIZES, DEFAULT_CONTENT 
} from "@/types/builder";
import { BuilderElementRenderer } from "./BuilderElementRenderer";
import { Trash2, Move, Lock, Unlock, Plus } from "lucide-react";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

const MIN_W = 80;
const MIN_H = 32;

interface AlignGuide {
  axis: "x" | "y";
  position: number;
  type: "center" | "edge";
}

interface Props {
  elements: BuilderElement[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void;
  onAddElement: (element: BuilderElement) => void;
  onRemoveElement: (id: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}

const SNAP_THRESHOLD = 6;

function computeAlignmentGuides(
  movingEl: BuilderElement,
  allElements: BuilderElement[],
  canvasWidth: number,
  canvasHeight: number,
): AlignGuide[] {
  const guides: AlignGuide[] = [];
  const mCx = movingEl.x + movingEl.width / 2;
  const mCy = movingEl.y + movingEl.height / 2;
  const mRight = movingEl.x + movingEl.width;
  const mBottom = movingEl.y + movingEl.height;

  const canvasCx = canvasWidth / 2;
  const canvasCy = canvasHeight / 2;
  if (Math.abs(mCx - canvasCx) < SNAP_THRESHOLD) guides.push({ axis: "x", position: canvasCx, type: "center" });
  if (Math.abs(mCy - canvasCy) < SNAP_THRESHOLD) guides.push({ axis: "y", position: canvasCy, type: "center" });

  for (const other of allElements) {
    if (other.id === movingEl.id) continue;
    const oCx = other.x + other.width / 2;
    const oCy = other.y + other.height / 2;
    const oRight = other.x + other.width;
    const oBottom = other.y + other.height;

    if (Math.abs(movingEl.x - other.x) < SNAP_THRESHOLD) guides.push({ axis: "x", position: other.x, type: "edge" });
    if (Math.abs(mRight - oRight) < SNAP_THRESHOLD) guides.push({ axis: "x", position: oRight, type: "edge" });
    if (Math.abs(mCx - oCx) < SNAP_THRESHOLD) guides.push({ axis: "x", position: oCx, type: "center" });
    if (Math.abs(movingEl.x - oRight) < SNAP_THRESHOLD) guides.push({ axis: "x", position: oRight, type: "edge" });
    if (Math.abs(mRight - other.x) < SNAP_THRESHOLD) guides.push({ axis: "x", position: other.x, type: "edge" });

    if (Math.abs(movingEl.y - other.y) < SNAP_THRESHOLD) guides.push({ axis: "y", position: other.y, type: "edge" });
    if (Math.abs(mBottom - oBottom) < SNAP_THRESHOLD) guides.push({ axis: "y", position: oBottom, type: "edge" });
    if (Math.abs(mCy - oCy) < SNAP_THRESHOLD) guides.push({ axis: "y", position: oCy, type: "center" });
    if (Math.abs(movingEl.y - oBottom) < SNAP_THRESHOLD) guides.push({ axis: "y", position: oBottom, type: "edge" });
    if (Math.abs(mBottom - other.y) < SNAP_THRESHOLD) guides.push({ axis: "y", position: other.y, type: "edge" });
  }

  const seen = new Set<string>();
  return guides.filter((g) => {
    const key = `${g.axis}-${g.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function BuilderCanvas({
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onRemoveElement,
  canvasWidth,
  canvasHeight,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    elementId: string;
    mode: "move" | "resize";
    handle?: ResizeHandle;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    shiftKey: boolean;
  } | null>(null);
  const [guides, setGuides] = useState<AlignGuide[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("builder/component-type") as BuilderElementType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const defaults = DEFAULT_SIZES[type];
    const x = snapToGrid((e.clientX - rect.left) - defaults.width / 2);
    const y = snapToGrid((e.clientY - rect.top) - defaults.height / 2);

    const newElement: BuilderElement = {
      id: crypto.randomUUID(),
      type,
      x: Math.max(0, Math.min(x, canvasWidth - defaults.width)),
      y: Math.max(0, Math.min(y, canvasHeight - defaults.height)),
      width: defaults.width,
      height: defaults.height,
      content: { ...DEFAULT_CONTENT[type] },
    };

    onAddElement(newElement);
    onSelectElement(newElement.id);
  }, [canvasWidth, canvasHeight, onAddElement, onSelectElement]);

  const startDrag = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    elementId: string,
    mode: "move" | "resize",
    handle?: ResizeHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find((el) => el.id === elementId);
    if (!el || el.locked) return;

    const isTouch = "touches" in e;
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;

    setDragState({
      elementId,
      mode,
      handle,
      startX,
      startY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
      shiftKey: false,
    });

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const clientX = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const clientY = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const shiftKey = "shiftKey" in ev ? ev.shiftKey : false;

      // Update shift key state in dragState
      if (dragState && dragState.shiftKey !== shiftKey) {
        setDragState({ ...dragState, shiftKey });
      }

      if (mode === "move") {
        let newX = snapToGrid(el.x + dx);
        let newY = snapToGrid(el.y + dy);
        newX = Math.max(0, Math.min(newX, canvasWidth - el.width));
        newY = Math.max(0, Math.min(newY, canvasHeight - el.height));

        const tempEl = { ...el, x: newX, y: newY };
        const newGuides = computeAlignmentGuides(tempEl, elements, canvasWidth, canvasHeight);
        setGuides(newGuides);

        for (const guide of newGuides) {
          if (guide.axis === "x") {
            const elCx = newX + el.width / 2;
            if (Math.abs(elCx - guide.position) < SNAP_THRESHOLD) {
              newX = guide.position - el.width / 2;
            } else if (Math.abs(newX - guide.position) < SNAP_THRESHOLD) {
              newX = guide.position;
            } else if (Math.abs(newX + el.width - guide.position) < SNAP_THRESHOLD) {
              newX = guide.position - el.width;
            }
          } else {
            const elCy = newY + el.height / 2;
            if (Math.abs(elCy - guide.position) < SNAP_THRESHOLD) {
              newY = guide.position - el.height / 2;
            } else if (Math.abs(newY - guide.position) < SNAP_THRESHOLD) {
              newY = guide.position;
            } else if (Math.abs(newY + el.height - guide.position) < SNAP_THRESHOLD) {
              newY = guide.position - el.height;
            }
          }
        }

        onUpdateElement(elementId, {
          x: Math.max(0, Math.min(newX, canvasWidth - el.width)),
          y: Math.max(0, Math.min(newY, canvasHeight - el.height)),
        });
      } else {
        const h = handle ?? "se";
        let newX = el.x;
        let newY = el.y;
        let newW = el.width;
        let newH = el.height;

        // East / West
        if (h.includes("e")) {
          newW = snapToGrid(Math.max(MIN_W, el.width + dx));
          newW = Math.min(newW, canvasWidth - el.x);
        } else if (h.includes("w")) {
          const proposedX = snapToGrid(el.x + dx);
          const clampedX = Math.max(0, Math.min(proposedX, el.x + el.width - MIN_W));
          newW = el.x + el.width - clampedX;
          newX = clampedX;
        }

        // North / South
        if (h.includes("s")) {
          newH = snapToGrid(Math.max(MIN_H, el.height + dy));
          newH = Math.min(newH, canvasHeight - el.y);
        } else if (h.includes("n")) {
          const proposedY = snapToGrid(el.y + dy);
          const clampedY = Math.max(0, Math.min(proposedY, el.y + el.height - MIN_H));
          newH = el.y + el.height - clampedY;
          newY = clampedY;
        }

        // Snap moving edges to alignment guides from other elements + canvas
        const tempEl = { ...el, x: newX, y: newY, width: newW, height: newH };
        const resizeGuides = computeAlignmentGuides(tempEl, elements, canvasWidth, canvasHeight);
        const activeGuides: AlignGuide[] = [];

        for (const guide of resizeGuides) {
          if (guide.axis === "x") {
            // Vertical guide — affects horizontal edges (w/e) only
            if (h.includes("e")) {
              const right = newX + newW;
              if (Math.abs(right - guide.position) < SNAP_THRESHOLD) {
                const snapped = Math.max(MIN_W, Math.min(guide.position - newX, canvasWidth - newX));
                newW = snapped;
                activeGuides.push(guide);
              }
            } else if (h.includes("w")) {
              if (Math.abs(newX - guide.position) < SNAP_THRESHOLD) {
                const right = el.x + el.width;
                const snappedX = Math.max(0, Math.min(guide.position, right - MIN_W));
                newW = right - snappedX;
                newX = snappedX;
                activeGuides.push(guide);
              }
            }
          } else {
            // Horizontal guide — affects vertical edges (n/s) only
            if (h.includes("s")) {
              const bottom = newY + newH;
              if (Math.abs(bottom - guide.position) < SNAP_THRESHOLD) {
                const snapped = Math.max(MIN_H, Math.min(guide.position - newY, canvasHeight - newY));
                newH = snapped;
                activeGuides.push(guide);
              }
            } else if (h.includes("n")) {
              if (Math.abs(newY - guide.position) < SNAP_THRESHOLD) {
                const bottom = el.y + el.height;
                const snappedY = Math.max(0, Math.min(guide.position, bottom - MIN_H));
                newH = bottom - snappedY;
                newY = snappedY;
                activeGuides.push(guide);
              }
            }
          }
        }

        setGuides(activeGuides);
        onUpdateElement(elementId, { x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleEnd = () => {
      setDragState(null);
      setGuides([]);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
  }, [elements, canvasWidth, canvasHeight, onUpdateElement]);

  return (
    <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-4">
      <div
        ref={canvasRef}
        className="relative bg-white rounded-lg shadow-md border"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          minWidth: canvasWidth,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDrop}
        onClick={() => onSelectElement(null)}
      >
        {/* Grid dots - more subtle and refined */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle, #000 0.5px, transparent 0.5px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />

        {/* Major Grid Lines (every 100px) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: `100px 100px`,
          }}
        />

        {/* Alignment guides */}
        {guides.map((guide, i) => (
          <div
            key={`guide-${i}`}
            className="absolute pointer-events-none z-50"
            style={
              guide.axis === "x"
                ? { left: guide.position, top: 0, width: 1, height: canvasHeight, background: "hsl(var(--primary))", opacity: 0.5, boxShadow: "0 0 4px hsl(var(--primary) / 0.3)" }
                : { left: 0, top: guide.position, width: canvasWidth, height: 1, background: "hsl(var(--primary))", opacity: 0.5, boxShadow: "0 0 4px hsl(var(--primary) / 0.3)" }
            }
          />
        ))}

        {/* Render each element */}
        {elements.map((el) => {
          const isSelected = selectedId === el.id;
          return (
            <div
              key={el.id}
              className={`absolute group transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-white shadow-2xl z-20"
                  : "hover:ring-1 hover:ring-primary/30 z-10"
              } ${el.locked ? "opacity-90" : ""}`}
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(el.id);
              }}
            >
              {/* Move handle — supports both mouse and touch */}
              {!el.locked && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-10 cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-30 touch-none"
                  onMouseDown={(e) => startDrag(e, el.id, "move")}
                  onTouchStart={(e) => startDrag(e, el.id, "move")}
                  style={{ touchAction: "none" }}
                >
                  <div className="bg-primary shadow-lg rounded-full px-2 py-1 flex items-center justify-center">
                    <Move className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Element content */}
              <div className="w-full h-full overflow-hidden rounded-sm border border-transparent group-hover:border-primary/10 bg-white shadow-sm">
                <BuilderElementRenderer element={el} selected={isSelected} />
              </div>

              {/* Action buttons */}
              {isSelected && (
                <div className="absolute -top-10 right-0 flex gap-1.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateElement(el.id, { locked: !el.locked });
                    }}
                    className="h-8 w-8 rounded-xl bg-white border shadow-xl flex items-center justify-center hover:bg-muted transition-all active:scale-95"
                  >
                    {el.locked ? <Lock className="h-3.5 w-3.5 text-primary" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveElement(el.id);
                    }}
                    className="h-8 w-8 rounded-xl bg-white border shadow-xl flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Resize handles — 4 corners + 4 edges, mouse + touch */}
              {!el.locked && isSelected && (
                <>
                  {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as ResizeHandle[]).map((h) => {
                    const isCorner = h.length === 2;
                    const pos: React.CSSProperties = {
                      cursor: HANDLE_CURSORS[h],
                      touchAction: "none",
                    };
                    // Position
                    if (h.includes("n")) pos.top = -6;
                    else if (h.includes("s")) pos.bottom = -6;
                    else { pos.top = "50%"; pos.transform = "translateY(-50%)"; }

                    if (h.includes("w")) pos.left = -6;
                    else if (h.includes("e")) pos.right = -6;
                    else {
                      pos.left = "50%";
                      pos.transform = (pos.transform ? pos.transform + " " : "") + "translateX(-50%)";
                    }

                    return (
                      <div
                        key={h}
                        role="button"
                        aria-label={`resize ${h}`}
                        className={`absolute z-30 bg-primary border-2 border-white shadow-md transition-transform hover:scale-110 ${
                          isCorner ? "w-3 h-3 rounded-full" : "w-2.5 h-2.5 rounded-sm"
                        }`}
                        style={pos}
                        onMouseDown={(e) => startDrag(e, el.id, "resize", h)}
                        onTouchStart={(e) => startDrag(e, el.id, "resize", h)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
              <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Plus className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold font-display uppercase tracking-widest text-muted-foreground">Empty Canvas</p>
                <p className="text-[10px] text-muted-foreground/60 font-serif italic">Drag components from the sidebar to start crafting</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}