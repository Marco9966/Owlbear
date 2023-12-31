import { useRef } from "react";
import { Group, Circle, Rect } from "react-konva";
import Konva from "konva";

import {
  useDebouncedStageScale,
  useMapWidth,
  useMapHeight,
  useSetPreventMapInteraction,
} from "../../contexts/MapInteractionContext";
import { useKeyboard } from "../../contexts/KeyboardContext";

import Vector2 from "../../helpers/Vector2";

import shortcuts from "../../shortcuts";
import { Map } from "../../types/Map";
import { GridInset } from "../../types/Grid";

type MapGridEditorProps = {
  map: Map;
  onGridChange: (inset: GridInset) => void;
};

function MapGridEditor({ map, onGridChange }: MapGridEditorProps) {
  const stageScale = useDebouncedStageScale();
  const mapWidth = useMapWidth();
  const mapHeight = useMapHeight();
  const setPreventMapInteraction = useSetPreventMapInteraction();

  const mapSize = { x: mapWidth, y: mapHeight };

  function getHandlePositions() {
    const topLeft = Vector2.multiply(map.grid.inset.topLeft, mapSize);
    const bottomRight = Vector2.multiply(map.grid.inset.bottomRight, mapSize);

    const size = Vector2.subtract(bottomRight, topLeft);
    const offset = Vector2.multiply(topLeft, -1);

    return {
      topLeft,
      topRight: { x: bottomRight.x, y: topLeft.y },
      bottomRight,
      bottomLeft: { x: topLeft.x, y: bottomRight.y },
      size,
      offset,
    };
  }
  const handlePositions = getHandlePositions();

  const handlePreviousPositionRef = useRef<Vector2>();

  function handleScaleCircleDragStart(
    event: Konva.KonvaEventObject<MouseEvent>
  ) {
    const handle = event.target;
    const position = getHandleNormalizedPosition(handle);
    handlePreviousPositionRef.current = position;
  }

  function handleScaleCircleDragMove(
    event: Konva.KonvaEventObject<MouseEvent>
  ) {
    const handle = event.target;
    onGridChange(getHandleInset(handle));
    handlePreviousPositionRef.current = getHandleNormalizedPosition(handle);
  }

  function handleScaleCircleDragEnd(event: Konva.KonvaEventObject<MouseEvent>) {
    onGridChange(getHandleInset(event.target));
    setPreventMapInteraction(false);
  }

  function handleInteractivePointerDown() {
    setPreventMapInteraction(true);
  }

  function handleInteractivePointerUp() {
    setPreventMapInteraction(false);
  }

  function getHandleInset(handle: Konva.Node): GridInset {
    const name = handle.name();

    // Find distance and direction of dragging
    const previousPosition = handlePreviousPositionRef.current;
    if (!previousPosition) {
      return map.grid.inset;
    }
    const position = getHandleNormalizedPosition(handle);
    const distance = Vector2.distance(previousPosition, position);
    const direction = Vector2.normalize(
      Vector2.subtract(position, previousPosition)
    );

    const inset = {
      topLeft: { ...map.grid.inset.topLeft },
      bottomRight: { ...map.grid.inset.bottomRight },
    };

    if (direction.x === 0 && direction.y === 0) {
      return inset;
    }

    // Scale the grid direction by the distance dragged and the
    // dot product between the drag direction and the grid direction
    // This drags the handle while keeping the aspect ratio
    if (name === "topLeft") {
      // Top left to bottom right
      const gridDirection = Vector2.normalize(
        Vector2.subtract(inset.topLeft, inset.bottomRight)
      );
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: newPosition,
        bottomRight: inset.bottomRight,
      };
    } else if (name === "topRight") {
      // Top right to bottom left
      const gridDirection = Vector2.normalize(
        Vector2.subtract(
          { x: inset.bottomRight.x, y: inset.topLeft.y },
          { x: inset.topLeft.x, y: inset.bottomRight.y }
        )
      );
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: { x: inset.topLeft.x, y: newPosition.y },
        bottomRight: { x: newPosition.x, y: inset.bottomRight.y },
      };
    } else if (name === "bottomRight") {
      // Bottom right to top left
      const gridDirection = Vector2.normalize(
        Vector2.subtract(inset.bottomRight, inset.topLeft)
      );
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: inset.topLeft,
        bottomRight: newPosition,
      };
    } else if (name === "bottomLeft") {
      // Bottom left to top right
      const gridDirection = Vector2.normalize(
        Vector2.subtract(
          { x: inset.topLeft.x, y: inset.bottomRight.y },
          { x: inset.bottomRight.x, y: inset.topLeft.y }
        )
      );
      const dot = Vector2.dot(direction, gridDirection);
      const offset = Vector2.multiply(gridDirection, distance * dot);
      const newPosition = Vector2.add(previousPosition, offset);
      return {
        topLeft: { x: newPosition.x, y: inset.topLeft.y },
        bottomRight: { x: inset.bottomRight.x, y: newPosition.y },
      };
    } else if (name === "center") {
      const offset = Vector2.subtract(position, previousPosition);
      return {
        topLeft: Vector2.add(inset.topLeft, offset),
        bottomRight: Vector2.add(inset.bottomRight, offset),
      };
    } else {
      return inset;
    }
  }

  function nudgeGrid(direction: Vector2, scale: number) {
    const inset = map.grid.inset;
    const gridSizeNormalized = Vector2.divide(
      Vector2.subtract(inset.bottomRight, inset.topLeft),
      map.grid.size
    );
    const offset = Vector2.multiply(
      Vector2.multiply(direction, gridSizeNormalized),
      Math.min(scale / (stageScale * stageScale), 1)
    );
    onGridChange({
      topLeft: Vector2.add(inset.topLeft, offset),
      bottomRight: Vector2.add(inset.bottomRight, offset),
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    const nudgeAmount = event.shiftKey ? 2 : 0.5;
    if (shortcuts.gridNudgeUp(event)) {
      // Stop arrow up/down scrolling if overflowing
      event.preventDefault();
      nudgeGrid({ x: 0, y: -1 }, nudgeAmount);
    }
    if (shortcuts.gridNudgeLeft(event)) {
      nudgeGrid({ x: -1, y: 0 }, nudgeAmount);
    }
    if (shortcuts.gridNudgeRight(event)) {
      nudgeGrid({ x: 1, y: 0 }, nudgeAmount);
    }
    if (shortcuts.gridNudgeDown(event)) {
      event.preventDefault();
      nudgeGrid({ x: 0, y: 1 }, nudgeAmount);
    }
  }

  useKeyboard(handleKeyDown);

  function getHandleNormalizedPosition(handle: Konva.Node) {
    return Vector2.divide({ x: handle.x(), y: handle.y() }, mapSize);
  }

  const editCircleRadius = Math.max(
    (Math.min(mapWidth, mapHeight) / 30) * Math.max(1 / stageScale, 1),
    1
  );

  const editCircleProps = {
    radius: editCircleRadius,
    fill: "rgba(0, 0, 0, 0.5)",
    stroke: "white",
    strokeWidth: editCircleRadius / 5,
    draggable: true,
    onDragStart: handleScaleCircleDragStart,
    onDragMove: handleScaleCircleDragMove,
    onDragEnd: handleScaleCircleDragEnd,
    onMouseDown: handleInteractivePointerDown,
    onMouseUp: handleInteractivePointerUp,
    onTouchStart: handleInteractivePointerDown,
    onTouchEnd: handleInteractivePointerUp,
  };

  const editRectProps = {
    fill: "transparent",
    stroke: "rgba(255, 255, 255, 0.75)",
    strokeWidth: editCircleRadius / 10,
  };

  return (
    <Group>
      <Rect
        width={handlePositions.size.x}
        height={handlePositions.size.y}
        offset={handlePositions.offset}
        {...editRectProps}
      />
      <Circle
        x={handlePositions.topLeft.x}
        y={handlePositions.topLeft.y}
        name="topLeft"
        {...editCircleProps}
      />
      <Circle
        x={handlePositions.topRight.x}
        y={handlePositions.topRight.y}
        name="topRight"
        {...editCircleProps}
      />
      <Circle
        x={handlePositions.bottomRight.x}
        y={handlePositions.bottomRight.y}
        name="bottomRight"
        {...editCircleProps}
      />
      <Circle
        x={handlePositions.bottomLeft.x}
        y={handlePositions.bottomLeft.y}
        name="bottomLeft"
        {...editCircleProps}
      />
      <Circle
        x={(handlePositions.topLeft.x + handlePositions.bottomRight.x) / 2}
        y={(handlePositions.topLeft.y + handlePositions.bottomRight.y) / 2}
        name="center"
        {...editCircleProps}
        radius={editCircleRadius / 1.5}
      />
    </Group>
  );
}

export default MapGridEditor;
