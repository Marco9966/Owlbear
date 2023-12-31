import React, { useEffect, useState } from "react";
import { Flex, Box, Label, Input, Checkbox } from "theme-ui";

import { isEmpty } from "../../helpers/shared";
import { getGridUpdatedInset } from "../../helpers/grid";

import { useDataURL } from "../../contexts/AssetsContext";
import { mapSources as defaultMapSources } from "../../maps";

import Divider from "../Divider";
import Select from "../Select";
import { Map, MapQuality } from "../../types/Map";
import { EditFlag, MapState } from "../../types/MapState";
import {
  MapSettingsChangeEventHandler,
  MapStateSettingsChangeEventHandler,
} from "../../types/Events";
import { Grid, GridMeasurementType, GridType } from "../../types/Grid";

type QualityTypeSetting = { value: MapQuality; label: string };
const qualitySettings: QualityTypeSetting[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "ultra", label: "Ultra High" },
  { value: "original", label: "Original" },
];

type GridTypeSetting = { value: GridType; label: string };
const gridTypeSettings: GridTypeSetting[] = [
  { value: "square", label: "Square" },
  { value: "hexVertical", label: "Hex Vertical" },
  { value: "hexHorizontal", label: "Hex Horizontal" },
];

type GridMeasurementTypeSetting = { value: GridMeasurementType; label: string };
const gridSquareMeasurementTypeSettings: GridMeasurementTypeSetting[] = [
  { value: "chebyshev", label: "Chessboard (D&D 5e)" },
  { value: "alternating", label: "Alternating Diagonal (D&D 3.5e)" },
  { value: "euclidean", label: "Euclidean" },
  { value: "manhattan", label: "Manhattan" },
];

const gridHexMeasurementTypeSettings: GridMeasurementTypeSetting[] = [
  { value: "manhattan", label: "Manhattan" },
  { value: "euclidean", label: "Euclidean" },
];

type MapSettingsProps = {
  map: Map;
  mapState: MapState;
  onSettingsChange: MapSettingsChangeEventHandler;
  onStateSettingsChange: MapStateSettingsChangeEventHandler;
};

function MapSettings({
  map,
  mapState,
  onSettingsChange,
  onStateSettingsChange,
}: MapSettingsProps) {
  function handleFlagChange(
    event: React.ChangeEvent<HTMLInputElement>,
    flag: EditFlag
  ) {
    if (event.target.checked) {
      onStateSettingsChange({ editFlags: [...mapState.editFlags, flag] });
    } else {
      onStateSettingsChange({
        editFlags: mapState.editFlags.filter((f) => f !== flag),
      });
    }
  }

  function handleGridSizeXChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.target.value) || 0;
    let grid = {
      ...map.grid,
      size: {
        ...map.grid.size,
        x: value,
      },
    };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange({ grid });
  }

  function handleGridSizeYChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.target.value) || 0;
    let grid = {
      ...map.grid,
      size: {
        ...map.grid.size,
        y: value,
      },
    };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange({ grid });
  }

  function handleGridTypeChange(option: GridTypeSetting | null) {
    if (!option) {
      return;
    }
    const type = option.value;
    let grid: Grid = {
      ...map.grid,
      type,
      measurement: {
        ...map.grid.measurement,
        type: type === "square" ? "chebyshev" : "manhattan",
      },
    };
    grid.inset = getGridUpdatedInset(grid, map.width, map.height);
    onSettingsChange({ grid });
  }

  function handleGridMeasurementTypeChange(
    option: GridMeasurementTypeSetting | null
  ) {
    if (!option) {
      return;
    }
    const grid = {
      ...map.grid,
      measurement: {
        ...map.grid.measurement,
        type: option.value,
      },
    };
    onSettingsChange({ grid });
  }

  function handleQualityChange(option: QualityTypeSetting | null) {
    if (!option) {
      return;
    }
    onSettingsChange({ quality: option.value });
  }

  function handleGridMeasurementScaleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const grid = {
      ...map.grid,
      measurement: {
        ...map.grid.measurement,
        scale: event.target.value,
      },
    };
    onSettingsChange({ grid });
  }

  const mapURL = useDataURL(map, defaultMapSources);
  const [mapSize, setMapSize] = useState(0);
  useEffect(() => {
    async function updateMapSize() {
      if (mapURL) {
        const response = await fetch(mapURL);
        const blob = await response.blob();
        let size = blob.size;
        size /= 1000000; // Bytes to Megabytes
        setMapSize(parseFloat(size.toFixed(2)));
      } else {
        setMapSize(0);
      }
    }
    updateMapSize();
  }, [mapURL]);

  const mapEmpty = !map || isEmpty(map);
  const mapStateEmpty = !mapState || isEmpty(mapState);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex>
        <Box mt={2} mr={1} sx={{ flexGrow: 1 }}>
          <Label htmlFor="gridX">Columns</Label>
          <Input
            type="number"
            name="gridX"
            value={`${(map && map.grid.size.x) || 0}`}
            onChange={handleGridSizeXChange}
            disabled={mapEmpty}
            min={1}
            my={1}
          />
        </Box>
        <Box mt={2} ml={1} sx={{ flexGrow: 1 }}>
          <Label htmlFor="gridY">Rows</Label>
          <Input
            type="number"
            name="gridY"
            value={`${(map && map.grid.size.y) || 0}`}
            onChange={handleGridSizeYChange}
            disabled={mapEmpty}
            min={1}
            my={1}
          />
        </Box>
      </Flex>
      <Box mt={2} sx={{ flexGrow: 1 }}>
        <Label htmlFor="name">Name</Label>
        <Input
          name="name"
          value={(map && map.name) || ""}
          onChange={(e) => onSettingsChange({ name: e.target.value })}
          disabled={mapEmpty}
          my={1}
        />
      </Box>
      <Flex
        mt={2}
        mb={mapEmpty || map.type === "default" ? 2 : 0}
        sx={{ flexDirection: "column" }}
      >
        <Flex sx={{ alignItems: "flex-end" }}>
          <Box sx={{ width: "50%" }}>
            <Label>Grid Type</Label>
            <Select
              isDisabled={mapEmpty}
              options={gridTypeSettings}
              value={
                mapEmpty
                  ? undefined
                  : gridTypeSettings.find((s) => s.value === map.grid.type)
              }
              onChange={handleGridTypeChange as any}
              isSearchable={false}
            />
          </Box>
          <Flex sx={{ flexGrow: 1, flexDirection: "column" }} ml={2}>
            <Label>
              <Checkbox
                checked={!mapEmpty && map.showGrid}
                disabled={mapEmpty}
                onChange={(e) =>
                  onSettingsChange({ showGrid: e.target.checked })
                }
              />
              Draw Grid
            </Label>
            <Label>
              <Checkbox
                checked={!mapEmpty && map.snapToGrid}
                disabled={mapEmpty}
                onChange={(e) =>
                  onSettingsChange({ snapToGrid: e.target.checked })
                }
              />
              Snap to Grid
            </Label>
          </Flex>
        </Flex>
        <Flex sx={{ alignItems: "flex-end" }}>
          <Box my={2} sx={{ width: "50%" }}>
            <Label>Grid Measurement</Label>
            <Select
              isDisabled={mapEmpty}
              options={
                map && map.grid.type === "square"
                  ? gridSquareMeasurementTypeSettings
                  : gridHexMeasurementTypeSettings
              }
              value={
                mapEmpty
                  ? undefined
                  : gridSquareMeasurementTypeSettings.find(
                      (s) => s.value === map.grid.measurement.type
                    )
              }
              onChange={handleGridMeasurementTypeChange as any}
              isSearchable={false}
            />
          </Box>
          <Box m={2} mr={0} sx={{ flexGrow: 1 }}>
            <Label htmlFor="gridMeasurementScale">Grid Scale</Label>
            <Input
              name="gridMeasurementScale"
              value={`${map && map.grid.measurement.scale}`}
              onChange={handleGridMeasurementScaleChange}
              disabled={mapEmpty}
              min={1}
              my={1}
              autoComplete="off"
            />
          </Box>
        </Flex>
      </Flex>
      {!mapEmpty && map.type !== "default" && (
        <Flex my={2} sx={{ alignItems: "center" }}>
          <Box mb={1} sx={{ width: "50%" }}>
            <Label>Quality</Label>
            <Select
              options={qualitySettings}
              value={
                mapEmpty
                  ? undefined
                  : qualitySettings.find((s) => s.value === map.quality)
              }
              isDisabled={mapEmpty}
              onChange={handleQualityChange as any}
              isOptionDisabled={
                ((option: QualityTypeSetting) =>
                  mapEmpty ||
                  (option.value !== "original" &&
                    !map.resolutions[option.value])) as any
              }
              isSearchable={false}
            />
          </Box>
          <Label sx={{ width: "50%" }} ml={2}>
            Size: {mapSize > 0 && `${mapSize}MB`}
          </Label>
        </Flex>
      )}
      <Divider fill />
      <Box my={2} sx={{ flexGrow: 1 }}>
        <Label>Allow Others to Edit</Label>
        <Flex my={1}>
          <Label>
            <Checkbox
              checked={!mapStateEmpty && mapState.editFlags.includes("fog")}
              disabled={mapStateEmpty}
              onChange={(e) => handleFlagChange(e, "fog")}
            />
            Fog
          </Label>
          <Label>
            <Checkbox
              checked={!mapStateEmpty && mapState.editFlags.includes("drawing")}
              disabled={mapStateEmpty}
              onChange={(e) => handleFlagChange(e, "drawing")}
            />
            Drawings
          </Label>
          <Label>
            <Checkbox
              checked={!mapStateEmpty && mapState.editFlags.includes("tokens")}
              disabled={mapStateEmpty}
              onChange={(e) => handleFlagChange(e, "tokens")}
            />
            Tokens
          </Label>
          <Label>
            <Checkbox
              checked={!mapStateEmpty && mapState.editFlags.includes("notes")}
              disabled={mapStateEmpty}
              onChange={(e) => handleFlagChange(e, "notes")}
            />
            Notes
          </Label>
        </Flex>
      </Box>
    </Flex>
  );
}

export default MapSettings;
