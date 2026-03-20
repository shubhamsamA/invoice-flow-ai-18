import { useRef, useState, useCallback } from "react";
import { 
  BuilderElement, BuilderElementType, 
  GRID_SIZE, snapToGrid, 
  DEFAULT_SIZES, DEFAULT_CONTENT 
} from "@/types/builder";
import { BuilderElementRenderer } from "./BuilderElementRenderer";
import { Trash2, Move, Lock, Unlock } from "lucide-react";

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

/**
 * The main canvas area where elements are positioned absolutely.
 * 
 * Drag-and-drop logic:
 * 1. New elements are dropped from the sidebar (onDrop reads "builder/component-type" from dataTransfer)
 * 2. Existing elements are repositioned via mousedown/mousemove/mouseup on the element header
 * 3. Elements are resized via a handle in the bottom-right corner
 * 4. All positions snap to a 16px grid for clean alignment
 */
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
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  // Handle drop from sidebar — creates a new element at the drop position
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("builder/component-type") as BuilderElementType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const defaults = DEFAULT_SIZES[type];
    const x = snapToGrid(e.clientX - rect.left - defaults.width / 2);
    const y = snapToGrid(e.clientY - rect.top - defaults.height / 2);

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

  // Begin dragging an existing element (move or resize)
  const startDrag = useCallback((
    e: React.MouseEvent,
    elementId: string,
    mode: "move" | "resize"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find((el) => el.id === elementId);
    if (!el || el.locked) return;

    setDragState({
      elementId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
    });

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - e.clientX;
      const dy = ev.clientY - e.clientY;

      if (mode === "move") {
        const newX = snapToGrid(el.x + dx);
        const newY = snapToGrid(el.y + dy);
        onUpdateElement(elementId, {
          x: Math.max(0, Math.min(newX, canvasWidth - el.width)),
          y: Math.max(0, Math.min(newY, canvasHeight - el.height)),
        });
      } else {
        const newW = snapToGrid(Math.max(80, el.width + dx));
        const newH = snapToGrid(Math.max(32, el.height + dy));
        onUpdateElement(elementId, {
          width: Math.min(newW, canvasWidth - el.x),
          height: Math.min(newH, canvasHeight - el.y),
        });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [elements, canvasWidth, canvasHeight, onUpdateElement]);

  return (
    <div className="flex-1 overflow-auto bg-[hsl(var(--surface-sunken))] p-8">
      <div
        ref={canvasRef}
        className="relative bg-white rounded-lg shadow-md mx-auto border"
        style={{ width: canvasWidth, height: canvasHeight }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDrop}
        onClick={() => onSelectElement(null)}
      >
        {/* Grid dots for alignment reference */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 0.5px, transparent 0.5px)",
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />

        {/* Render each element */}
        {elements.map((el) => {
          const isSelected = selectedId === el.id;
          return (
            <div
              key={el.id}
              className={`absolute group transition-shadow duration-150 ${
                isSelected
                  ? "ring-2 ring-primary shadow-lg z-20"
                  : "hover:ring-1 hover:ring-primary/40 z-10"
              } ${el.locked ? "opacity-80" : ""}`}
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
              {/* Move handle — drag to reposition */}
              {!el.locked && (
                <div
                  className="absolute -top-0.5 left-0 right-0 h-5 cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  onMouseDown={(e) => startDrag(e, el.id, "move")}
                >
                  <div className="bg-primary/90 rounded-b-md px-2 py-0.5">
                    <Move className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Element content */}
              <div className="w-full h-full overflow-hidden rounded-md border border-transparent group-hover:border-border/50 bg-white">
                <BuilderElementRenderer element={el} selected={isSelected} />
              </div>

              {/* Action buttons when selected */}
              {isSelected && (
                <div className="absolute -top-8 right-0 flex gap-1 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateElement(el.id, { locked: !el.locked });
                    }}
                    className="h-6 w-6 rounded bg-card border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    {el.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveElement(el.id);
                    }}
                    className="h-6 w-6 rounded bg-card border shadow-sm flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Resize handle — bottom-right corner */}
              {!el.locked && isSelected && (
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize z-30 shadow-sm"
                  onMouseDown={(e) => startDrag(e, el.id, "resize")}
                />
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Drag components from the sidebar</p>
              <p className="text-[10px] text-muted-foreground/60">They'll snap to a 16px grid automatically</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
