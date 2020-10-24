import { DatabaseContext } from 'contexts/DatabaseContext';
import { Feature } from 'geojson';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.mapbox.css';
import 'leaflet.offline';
import 'leaflet/dist/leaflet.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { notifySuccess } from 'utils/NotificationUtils';
import './MapContainer.css';

export type MapControl = (map: any, ...args: any) => void;

export interface IMapContainerProps {
  classes?: any;
  mapId: string;
  geometryState: { geometry: any[]; setGeometry: (geometry: Feature[]) => void };
  extentState: { extent: any; setExtent: (extent: any) => void };
}

const MapContainer: React.FC<IMapContainerProps> = (props) => {
  const databaseContext = useContext(DatabaseContext);

  const mapRef = useRef(null);

  const [drawnItems, setDrawnItems] = useState(new L.FeatureGroup());

  const getESRIBaseLayer = () => {
    return L.tileLayer.offline(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 24,
        maxNativeZoom: 17,
        attribution:
          '&copy; <a href="https://www.esri.com/en-us/arcgis/products/location-services/services/basemaps">ESRI Basemap</a>'
      }
    );
  };

  const getBCGovBaseLayer = () => {
    return L.tileLayer('https://maps.gov.bc.ca/arcgis/rest/services/province/roads_wm/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 24,
      useCache: true,
      cacheMaxAge: 6.048e+8 // 1 week
    });
  };

  const addZoomControls = () => {
    const zoomControlOptions = { position: 'bottomright' };

    mapRef.current.addControl(L.control.zoom(zoomControlOptions));
  };

  const addDrawControls = () => {
    const drawControlOptions = new L.Control.Draw({
      position: 'topright',
      draw: {
        marker: false,
        circle: true
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: true
      }
    });

    mapRef.current.addControl(drawControlOptions);
  };

  const addLocateControls = () => {
    const locateControlOptions = {
      icon: 'bullseye',
      flyTo: true,
      iconElementTag: 'div'
    };

    mapRef.current.addControl(L.control.locate(locateControlOptions));
  };

  const addSaveTilesControl = (layerToSave: any) => {
    mapRef.current.addControl(
      L.control.savetiles(layerToSave, {
        zoomlevels: [13, 14, 15, 16, 17],
        confirm(layer, succescallback) {
          if (window.confirm(`Save ${layer._tilesforSave.length} tiles`)) {
            succescallback(notifySuccess(databaseContext, `Saved ${layer._tilesforSave.length} tiles`));
          }
        },
        confirmRemoval(layer, succescallback) {
          if (window.confirm('Remove all the stored tiles')) {
            succescallback(notifySuccess(databaseContext, `Removed tiles`));
          }
        },
        saveText: '<span title="Save me some basemap">&#128190;</span>',
        rmText: '<span title="Delete all stored basemap tiles">&#128465;</span>'
      })
    );
  };

  const setMapBounds = () => {
    if (props.extentState?.extent) {
      const extent = props.extentState.extent;
      const bounds = [
        [extent._northEast.lat, extent._northEast.lng],
        [extent._southWest.lat, extent._southWest.lng]
      ];

      mapRef.current.fitBounds(bounds);
    }
  };

  const addLayerControls = (baseLayerControlOptions: any) => {
    mapRef.current.addControl(L.control.layers(baseLayerControlOptions));
  };

  const initMap = () => {
    mapRef.current = L.map(props.mapId, { zoomControl: false }).setView([55, -128], 10);

    addZoomControls();

    addLocateControls();

    addDrawControls();

    const esriBaseLayer = getESRIBaseLayer();
    const bcBaseLayer = getBCGovBaseLayer();

    // Set initial base map
    esriBaseLayer.addTo(mapRef.current);

    addLayerControls({
      'Esri Imagery': esriBaseLayer,
      'BC Government': bcBaseLayer
    });

    addSaveTilesControl(esriBaseLayer);

    setMapBounds();

    mapRef.current.on('moveend', () => {
      props.extentState.setExtent(mapRef.current.getBounds());
    });

    mapRef.current.on('draw:created', (feature) => {
      let aGeo = feature.layer.toGeoJSON();

      if (feature.layerType === 'circle') {
        aGeo = { ...aGeo, properties: { ...aGeo.properties, radius: feature.layer.getRadius() } };
      }

      props.geometryState.setGeometry([aGeo]);
    });

    mapRef.current.on('draw:drawstart', function () {
      props.geometryState.setGeometry([]);
    });

    mapRef.current.on('draw:editstop', async function (layerGroup) {
      // The current feature isn't passed to this function, so grab it from the acetate layer
      let aGeo = drawnItems?.toGeoJSON()?.features[0];

      // If this is a circle feature... Grab the radius and store in the GeoJSON
      if (drawnItems.getLayers()[0]._mRadius) {
        const radius = drawnItems.getLayers()[0]?.getRadius();
        aGeo = { ...aGeo, properties: { ...aGeo.properties, radius: radius } };
      }

      // Save edited feature
      if (aGeo) {
        props.geometryState.setGeometry([aGeo]);
      }
    });

    mapRef.current.on('draw:deleted', function () {
      props.geometryState.setGeometry([]);
    });
  };

  const updateMapOnGeometryChange = () => {
    // Clear the drawn features
    setDrawnItems(drawnItems.clearLayers());

    // For each geometry, add a new layer to the drawn features
    props.geometryState.geometry.forEach((collection) => {
      const style = {
        // color: '#ff7800',
        weight: 4,
        opacity: 0.65
      };

      const markerStyle = {
        radius: 10,
        weight: 4,
        stroke: true
      };

      L.geoJSON(collection, {
        style: style,
        pointToLayer: (feature: any, latLng: any) => {
          if (feature.properties.radius) {
            return L.circle(latLng, { radius: feature.properties.radius });
          } else {
            return L.circleMarker(latLng, markerStyle);
          }
        },
        onEachFeature: function (feature: any, layer: any) {
          drawnItems.addLayer(layer);
        }
      });
    });

    // Update the drawn featres
    setDrawnItems(drawnItems);

    // Update the map with the new drawn feaures
    mapRef.current = mapRef.current.addLayer(drawnItems);
  };

  useEffect(() => {
    initMap();

    return () => {
      if (!mapRef.current) {
        return;
      }

      mapRef.current.remove();
    };
  }, [databaseContext]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!props.geometryState?.geometry) {
      return;
    }

    updateMapOnGeometryChange();
  }, [props.geometryState.geometry]);

  return <div id={props.mapId} className={props.classes.map} />;
};

export default MapContainer;
