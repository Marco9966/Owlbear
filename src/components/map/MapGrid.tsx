import { useEffect, useState } from "react";
import useImage from "use-image";

import { useDataURL } from "../../contexts/AssetsContext";

import { mapSources as defaultMapSources } from "../../maps";

import { getImageLightness } from "../../helpers/image";

import Grid from "../konva/Grid";
import { Map } from "../../types/Map";

function MapGrid({ map }: { map: Map }) {
  let mapSourceMap = map;
  const mapURL = useDataURL(
    mapSourceMap,
    defaultMapSources,
    undefined,
    map.type === "file"
  );

  const [mapImage, mapLoadingStatus] = useImage(mapURL || "");

  const [isImageLight, setIsImageLight] = useState(true);

  // When the map changes find the average lightness of its pixels
  useEffect(() => {
    if (mapLoadingStatus === "loaded" && mapImage) {
      setIsImageLight(getImageLightness(mapImage));
    }
  }, [mapImage, mapLoadingStatus]);

  return <Grid stroke={isImageLight ? "black" : "white"} />;
}

export default MapGrid;
