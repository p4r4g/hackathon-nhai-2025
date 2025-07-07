<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import 'ol/ol.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point' // Import Point for the blinking dot
import { Style, Stroke, Circle, Fill } from 'ol/style' // Import Circle and Fill for dot style
import { fromLonLat } from 'ol/proj'

export default {
  name: 'MapComponent',
  props: {
    polylines: {
      type: Array,
      required: true,
      // Example: [[[lon1, lat1], [lon2, lat2]], [[lon3, lat3], [lon4, lat4]]]
    },
  },
  data() {
    return {
      map: null,
      blinkingDotLayer: null,
      blinkingDotFeature: null,
      blinkingInterval: null,
    }
  },
  mounted() {
    this.initMap()
  },
  watch: {
    polylines: {
      handler() {
        this.updatePolylines()
      },
      deep: true,
    },
  },
  methods: {
    initMap() {
      const tileLayer = new TileLayer({
        source: new OSM(),
        opacity: 0.3, // Dim the base map
      })

      this.map = new Map({
        target: this.$refs.mapContainer,
        layers: [tileLayer],
        view: new View({
          center: [0, 0], // Initial center, will be adjusted by fit
          zoom: 2, // Initial zoom level
        }),
      })

      this.updatePolylines()
    },
    updatePolylines() {
      if (!this.map) return

      // Remove existing vector layers
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer instanceof VectorLayer)
        .forEach((layer) => {
          if (layer !== this.blinkingDotLayer) {
            // Don't remove the blinking dot layer
            this.map.removeLayer(layer)
          }
        })

      // Remove existing blinking dot layer if it exists
      if (this.blinkingDotLayer) {
        this.map.removeLayer(this.blinkingDotLayer)
        this.blinkingDotLayer = null
      }
      if (this.blinkingInterval) {
        clearInterval(this.blinkingInterval)
        this.blinkingInterval = null
      }

      const allFeatures = []
      const colors = ['blue', 'red', 'green', 'purple', 'orange', 'brown', 'pink', 'cyan'] // Colors for 8 lanes

      if (!this.polylines || this.polylines.length === 0) {
        return
      }

      this.polylines.forEach((polylineCoords, index) => {
        if (polylineCoords.length > 0) {
          const polylineFeature = new Feature({
            geometry: new LineString(polylineCoords.map((coord) => fromLonLat(coord))),
          })
          allFeatures.push(polylineFeature)

          const vectorSource = new VectorSource({
            features: [polylineFeature],
          })

          const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: new Style({
              stroke: new Stroke({
                color: colors[index % colors.length], // Assign a color
                width: 3,
                opacity: 1,
              }),
            }),
          })
          this.map.addLayer(vectorLayer)
        }
      })

      if (allFeatures.length > 0 && this.polylines.length > 0) {
        // Get the last coordinate of the L1 lane (polylines[0])
        const l1Polyline = this.polylines[0]
        if (l1Polyline && l1Polyline.length > 0) {
          const lastCoord = l1Polyline[l1Polyline.length - 1]
          const transformedCoord = fromLonLat(lastCoord)

          this.blinkingDotFeature = new Feature({
            geometry: new Point(transformedCoord),
          })

          const dotStyle = new Style({
            image: new Circle({
              radius: 12, // Increased radius for prominence
              fill: new Fill({ color: 'rgba(255, 255, 0, 1)' }), // Yellow dot for contrast
              stroke: new Stroke({ color: 'black', width: 3 }), // Black stroke for better contrast
            }),
          })

          this.blinkingDotLayer = new VectorLayer({
            source: new VectorSource({
              features: [this.blinkingDotFeature],
            }),
            style: dotStyle,
          })

          this.map.addLayer(this.blinkingDotLayer)

          // Start blinking animation
          let opacity = 1
          let increasing = false
          this.blinkingInterval = setInterval(() => {
            if (increasing) {
              opacity += 0.2 // Faster opacity change
              if (opacity >= 1) {
                opacity = 1
                increasing = false
              }
            } else {
              opacity -= 0.2 // Faster opacity change
              if (opacity <= 0.1) {
                // Lower minimum opacity for more prominent blink
                opacity = 0.1
                increasing = true
              }
            }
            dotStyle.getImage().getFill().setColor(`rgba(255, 255, 0, ${opacity})`) // Yellow color
            this.blinkingDotLayer.changed() // Important to re-render the layer
          }, 100) // Blinking speed remains the same, but opacity change is faster
        }
      }

      if (allFeatures.length > 0) {
        const extent = allFeatures[0].getGeometry().getExtent()
        allFeatures.forEach((feature) => {
          extent[0] = Math.min(extent[0], feature.getGeometry().getExtent()[0])
          extent[1] = Math.min(extent[1], feature.getGeometry().getExtent()[1])
          extent[2] = Math.max(extent[2], feature.getGeometry().getExtent()[2])
          extent[3] = Math.max(extent[3], feature.getGeometry().getExtent()[3])
        })

        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000,
        })
      }
    },
  },
  beforeUnmount() {
    if (this.blinkingInterval) {
      clearInterval(this.blinkingInterval)
    }
    if (this.map) {
      this.map.setTarget(undefined)
      this.map = null
    }
  },
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh; /* Take 100% of viewport height */
  background: #f0f0f0;
}
</style>
