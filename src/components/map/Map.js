import React, { useRef, useEffect, useState } from "react";
import { Box, Image } from "theme-ui";

import ProxyToken from "../token/ProxyToken";
import TokenMenu from "../token/TokenMenu";
import MapToken from "./MapToken";
import MapDrawing from "./MapDrawing";
import MapFog from "./MapFog";
import MapControls from "./MapControls";

import { omit } from "../../helpers/shared";
import useDataSource from "../../helpers/useDataSource";
import MapInteraction from "./MapInteraction";

import { mapSources as defaultMapSources } from "../../maps";

const mapTokenProxyClassName = "map-token__proxy";
const mapTokenMenuClassName = "map-token__menu";

function Map({
  map,
  mapState,
  tokens,
  onMapTokenStateChange,
  onMapTokenStateRemove,
  onMapChange,
  onMapStateChange,
  onMapDraw,
  onMapDrawUndo,
  onMapDrawRedo,
  onFogDraw,
  onFogDrawUndo,
  onFogDrawRedo,
  allowMapDrawing,
  allowFogDrawing,
  disabledTokens,
  loading,
}) {
  const mapSource = useDataSource(map, defaultMapSources);

  function handleProxyDragEnd(isOnMap, tokenState) {
    if (isOnMap && onMapTokenStateChange) {
      onMapTokenStateChange(tokenState);
    }

    if (!isOnMap && onMapTokenStateRemove) {
      onMapTokenStateRemove(tokenState);
    }
  }

  /**
   * Map drawing
   */

  const [selectedToolId, setSelectedToolId] = useState("pan");
  const [toolSettings, setToolSettings] = useState({
    fog: { type: "add", useEdgeSnapping: true, useGridSnapping: false },
    brush: {
      color: "darkGray",
      type: "stroke",
      useBlending: false,
    },
    shape: {
      color: "red",
      type: "rectangle",
      useBlending: true,
    },
  });

  function handleToolSettingChange(tool, change) {
    setToolSettings((prevSettings) => ({
      ...prevSettings,
      [tool]: {
        ...prevSettings[tool],
        ...change,
      },
    }));
  }

  function handleToolAction(action) {
    if (action === "eraseAll") {
      onMapDraw({
        type: "remove",
        shapeIds: mapShapes.map((s) => s.id),
        timestamp: Date.now(),
      });
    }
    if (action === "mapUndo") {
      onMapDrawUndo();
    }
    if (action === "mapRedo") {
      onMapDrawRedo();
    }
    if (action === "fogUndo") {
      onFogDrawUndo();
    }
    if (action === "fogRedo") {
      onFogDrawRedo();
    }
  }

  const [mapShapes, setMapShapes] = useState([]);
  function handleMapShapeAdd(shape) {
    onMapDraw({ type: "add", shapes: [shape] });
  }

  function handleMapShapeRemove(shapeId) {
    onMapDraw({ type: "remove", shapeIds: [shapeId] });
  }

  const [fogShapes, setFogShapes] = useState([]);
  function handleFogShapeAdd(shape) {
    onFogDraw({ type: "add", shapes: [shape] });
  }

  function handleFogShapeRemove(shapeId) {
    onFogDraw({ type: "remove", shapeIds: [shapeId] });
  }

  function handleFogShapeEdit(shape) {
    onFogDraw({ type: "edit", shapes: [shape] });
  }

  // Replay the draw actions and convert them to shapes for the map drawing
  useEffect(() => {
    if (!mapState) {
      return;
    }
    function actionsToShapes(actions, actionIndex) {
      let shapesById = {};
      for (let i = 0; i <= actionIndex; i++) {
        const action = actions[i];
        if (action.type === "add" || action.type === "edit") {
          for (let shape of action.shapes) {
            shapesById[shape.id] = shape;
          }
        }
        if (action.type === "remove") {
          shapesById = omit(shapesById, action.shapeIds);
        }
      }
      return Object.values(shapesById);
    }

    setMapShapes(
      actionsToShapes(mapState.mapDrawActions, mapState.mapDrawActionIndex)
    );
    setFogShapes(
      actionsToShapes(mapState.fogDrawActions, mapState.fogDrawActionIndex)
    );
  }, [mapState]);

  const disabledControls = [];
  if (!allowMapDrawing) {
    disabledControls.push("brush");
    disabledControls.push("shape");
    disabledControls.push("erase");
  }
  if (!map) {
    disabledControls.push("pan");
  }
  if (mapShapes.length === 0) {
    disabledControls.push("erase");
  }
  if (!allowFogDrawing) {
    disabledControls.push("fog");
  }

  const disabledSettings = { fog: [], brush: [], shape: [], erase: [] };
  if (!mapState || mapState.mapDrawActionIndex < 0) {
    disabledSettings.brush.push("undo");
    disabledSettings.shape.push("undo");
    disabledSettings.erase.push("undo");
  }
  if (
    !mapState ||
    mapState.mapDrawActionIndex === mapState.mapDrawActions.length - 1
  ) {
    disabledSettings.brush.push("redo");
    disabledSettings.shape.push("redo");
    disabledSettings.erase.push("redo");
  }
  if (fogShapes.length === 0) {
    disabledSettings.fog.push("undo");
  }
  if (
    !mapState ||
    mapState.fogDrawActionIndex === mapState.fogDrawActions.length - 1
  ) {
    disabledSettings.fog.push("redo");
  }

  /**
   * Member setup
   */

  const mapRef = useRef(null);

  const gridX = map && map.gridX;
  const gridY = map && map.gridY;
  const gridSizeNormalized = { x: 1 / gridX || 0, y: 1 / gridY || 0 };
  const tokenSizePercent = gridSizeNormalized.x * 100;
  const aspectRatio = (map && map.width / map.height) || 1;

  const mapImage = (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Image
        ref={mapRef}
        className="mapImage"
        sx={{
          width: "100%",
          userSelect: "none",
          touchAction: "none",
        }}
        src={mapSource}
      />
    </Box>
  );

  const mapTokens = (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
      }}
    >
      {mapState &&
        Object.values(mapState.tokens).map((tokenState) => (
          <MapToken
            key={tokenState.id}
            token={tokens.find((token) => token.id === tokenState.tokenId)}
            tokenState={tokenState}
            tokenSizePercent={tokenSizePercent}
            className={`${mapTokenProxyClassName} ${mapTokenMenuClassName}`}
          />
        ))}
    </Box>
  );

  const mapDrawing = (
    <MapDrawing
      width={map ? map.width : 0}
      height={map ? map.height : 0}
      selectedTool={selectedToolId !== "fog" ? selectedToolId : "none"}
      toolSettings={toolSettings[selectedToolId]}
      shapes={mapShapes}
      onShapeAdd={handleMapShapeAdd}
      onShapeRemove={handleMapShapeRemove}
      gridSize={gridSizeNormalized}
    />
  );

  const mapFog = (
    <MapFog
      width={map ? map.width : 0}
      height={map ? map.height : 0}
      isEditing={selectedToolId === "fog"}
      toolSettings={toolSettings["fog"]}
      shapes={fogShapes}
      onShapeAdd={handleFogShapeAdd}
      onShapeRemove={handleFogShapeRemove}
      onShapeEdit={handleFogShapeEdit}
      gridSize={gridSizeNormalized}
    />
  );

  const mapControls = (
    <MapControls
      onMapChange={onMapChange}
      onMapStateChange={onMapStateChange}
      currentMap={map}
      onSelectedToolChange={setSelectedToolId}
      selectedToolId={selectedToolId}
      toolSettings={toolSettings}
      onToolSettingChange={handleToolSettingChange}
      onToolAction={handleToolAction}
      disabledControls={disabledControls}
      disabledSettings={disabledSettings}
    />
  );
  return (
    <>
      <MapInteraction
        map={map}
        aspectRatio={aspectRatio}
        isEnabled={selectedToolId === "pan"}
        controls={mapControls}
        loading={loading}
      >
        {map && mapImage}
        {map && mapDrawing}
        {map && mapFog}
        {map && mapTokens}
      </MapInteraction>
      <ProxyToken
        tokenClassName={mapTokenProxyClassName}
        onProxyDragEnd={handleProxyDragEnd}
        tokens={mapState && mapState.tokens}
        disabledTokens={disabledTokens}
      />
      <TokenMenu
        tokenClassName={mapTokenMenuClassName}
        onTokenChange={onMapTokenStateChange}
        tokens={mapState && mapState.tokens}
        disabledTokens={disabledTokens}
      />
    </>
  );
}

export default Map;