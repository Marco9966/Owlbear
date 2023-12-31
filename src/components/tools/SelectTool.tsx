import { useState, useEffect, useRef } from "react";
import { Group } from "react-konva";
import Konva from "konva";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useInteractionEmitter,
  MapDragEvent,
  leftMouseButton,
} from "../../contexts/MapInteractionContext";
import { useMapStage } from "../../contexts/MapStageContext";

import {
  getDefaultShapeData,
  getUpdatedShapeData,
  simplifyPoints,
} from "../../helpers/drawing";
import Vector2 from "../../helpers/Vector2";
import {
  getRelativePointerPosition,
  scaleAndFlattenPoints,
} from "../../helpers/konva";
import { Intersection } from "../../helpers/token";

import {
  Selection as SelectionType,
  SelectionItem,
  SelectToolSettings,
} from "../../types/Select";
import { RectData } from "../../types/Drawing";
import { Map } from "../../types/Map";
import { useGridCellNormalizedSize } from "../../contexts/GridContext";
import Selection from "../konva/Selection";
import { SelectionItemsChangeEventHandler } from "../../types/Events";
import { getSelectionPoints } from "../../helpers/selection";

type MapSelectProps = {
  active: boolean;
  toolSettings: SelectToolSettings;
  onSelectionItemsChange: SelectionItemsChangeEventHandler;
  selection: SelectionType | null;
  onSelectionChange: React.Dispatch<React.SetStateAction<SelectionType | null>>;
  onSelectionMenuOpen: (open: boolean) => void;
  onSelectionDragStart: () => void;
  onSelectionDragEnd: () => void;
  disabledTokens: Record<string, boolean>;
  disabledNotes: Record<string, boolean>;
  map: Map;
};

function SelectTool({
  active,
  toolSettings,
  onSelectionItemsChange,
  selection,
  onSelectionChange,
  onSelectionMenuOpen,
  onSelectionDragStart,
  onSelectionDragEnd,
  disabledTokens,
  disabledNotes,
  map,
}: MapSelectProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const interactionEmitter = useInteractionEmitter();

  const gridCellNormalizedSize = useGridCellNormalizedSize();

  const mapStageRef = useMapStage();
  const [isBrushDown, setIsBrushDown] = useState(false);

  // Use a ref here to prevent case where brush down event
  // would fire before React state was refreshed
  const preventSelectionRef = useRef(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    const mapStage = mapStageRef.current;
    const mapImage = mapStage?.findOne("#mapImage");

    function getBrushPosition() {
      if (!mapImage) {
        return;
      }
      let position = getRelativePointerPosition(mapImage);
      if (!position) {
        return;
      }
      return Vector2.divide(position, {
        x: mapImage.width(),
        y: mapImage.height(),
      });
    }

    function handleBrushDown(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (!brushPosition || preventSelectionRef.current) {
        return;
      }
      if (toolSettings.type === "path") {
        onSelectionChange({
          type: "path",
          items: [],
          data: { points: [brushPosition] },
          x: 0,
          y: 0,
        });
      } else {
        onSelectionChange({
          type: "rectangle",
          items: [],
          data: getDefaultShapeData("rectangle", brushPosition) as RectData,
          x: 0,
          y: 0,
        });
      }
      setIsBrushDown(true);
    }

    function handleBrushMove(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      const brushPosition = getBrushPosition();
      if (!brushPosition || preventSelectionRef.current) {
        return;
      }
      if (isBrushDown && selection && mapImage) {
        if (selection.type === "path") {
          onSelectionChange((prevSelection) => {
            if (prevSelection?.type !== "path") {
              return prevSelection;
            }
            const prevPoints = prevSelection.data.points;
            if (
              Vector2.compare(
                prevPoints[prevPoints.length - 1],
                brushPosition,
                0.001
              )
            ) {
              return prevSelection;
            }
            const simplified = simplifyPoints(
              [...prevPoints, brushPosition],
              1 / 1000 / stageScale
            );
            return {
              ...prevSelection,
              data: { points: simplified },
            };
          });
        } else {
          onSelectionChange((prevSelection) => {
            if (prevSelection?.type !== "rectangle") {
              return prevSelection;
            }
            return {
              ...prevSelection,
              data: getUpdatedShapeData(
                "rectangle",
                prevSelection.data,
                brushPosition,
                gridCellNormalizedSize,
                mapWidth,
                mapHeight
              ) as RectData,
            };
          });
        }
      }
    }

    function handleBrushUp(props: MapDragEvent) {
      if (!leftMouseButton(props)) {
        return;
      }
      if (preventSelectionRef.current) {
        return;
      }
      if (selection && mapStage) {
        const tokensGroups = mapStage.find<Konva.Group>("#tokens");
        const notesGroups = mapStage.find<Konva.Group>("#notes");
        const points = getSelectionPoints(selection);
        const intersection = new Intersection(
          {
            type: "path",
            points: scaleAndFlattenPoints(points, {
              x: mapWidth,
              y: mapHeight,
            }),
          },
          { x: selection.x, y: selection.y },
          { x: 0, y: 0 },
          0
        );

        let intersectingItems: SelectionItem[] = [];

        for (let tokensGroup of tokensGroups) {
          const tokens = tokensGroup.children;
          if (tokens) {
            for (let token of tokens) {
              if (
                token.id() &&
                !(token.id() in disabledTokens) &&
                intersection.intersects(token.position())
              ) {
                intersectingItems.push({ type: "token", id: token.id() });
              }
            }
          }
        }

        for (let notesGroup of notesGroups) {
          const notes = notesGroup.children;
          if (notes) {
            for (let note of notes) {
              if (
                note.id() &&
                !(note.id() in disabledNotes) &&
                intersection.intersects(note.position())
              ) {
                intersectingItems.push({ type: "note", id: note.id() });
              }
            }
          }
        }

        if (intersectingItems.length > 0) {
          onSelectionChange((prevSelection) => {
            if (!prevSelection) {
              return prevSelection;
            }
            return { ...prevSelection, items: intersectingItems };
          });
          onSelectionMenuOpen(true);
        } else {
          onSelectionChange(null);
        }
      } else {
        onSelectionChange(null);
      }

      setIsBrushDown(false);
    }

    function handlePointerClick(event: Konva.KonvaEventObject<MouseEvent>) {
      if (event.target.id() === "selection") {
        onSelectionMenuOpen(true);
      } else {
        onSelectionChange(null);
        onSelectionMenuOpen(false);
      }
    }

    interactionEmitter?.on("dragStart", handleBrushDown);
    interactionEmitter?.on("drag", handleBrushMove);
    interactionEmitter?.on("dragEnd", handleBrushUp);
    mapStage?.on("click tap", handlePointerClick);

    return () => {
      interactionEmitter?.off("dragStart", handleBrushDown);
      interactionEmitter?.off("drag", handleBrushMove);
      interactionEmitter?.off("dragEnd", handleBrushUp);
      mapStage?.off("click tap", handlePointerClick);
    };
  });

  return (
    <Group>
      {selection && (
        <Selection
          selection={selection}
          onSelectionChange={onSelectionChange}
          onSelectionItemsChange={onSelectionItemsChange}
          onPreventSelectionChange={(prevent: boolean) =>
            (preventSelectionRef.current = prevent)
          }
          onSelectionDragStart={onSelectionDragStart}
          onSelectionDragEnd={onSelectionDragEnd}
          map={map}
        />
      )}
    </Group>
  );
}

export default SelectTool;
