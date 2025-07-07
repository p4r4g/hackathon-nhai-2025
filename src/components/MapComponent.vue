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
      polylineVectorLayer: null, // New: Layer for all polylines
      polylineVectorSource: null, // New: Source for all polylines
      userInteractedWithZoom: false, // New: Track if user has manually zoomed
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
          center: fromLonLat([78.9629, 20.5937]), // Center of India
          zoom: 5, // Initial zoom level for India
        }),
      })

      // Initialize a single vector source and layer for all polylines
      this.polylineVectorSource = new VectorSource()
      this.polylineVectorLayer = new VectorLayer({
        source: this.polylineVectorSource,
        style: (feature) => {
          // Define a style function to apply different colors based on feature properties or index
          const colors = ['blue', 'red', 'green', 'purple', 'orange', 'brown', 'pink', 'cyan']
          const index = feature.get('index') || 0 // Get index from feature properties
          return new Style({
            stroke: new Stroke({
              color: colors[index % colors.length],
              width: 3,
              opacity: 1,
            }),
          })
        },
      })
      this.map.addLayer(this.polylineVectorLayer)

      this.updatePolylines()
      this.initBlinkingDot() // Initialize blinking dot here

      // Add a listener for zoom changes
      this.map.getView().on('change:resolution', () => {
        this.userInteractedWithZoom = true
      })
    },
    initBlinkingDot() {
      if (!this.map || this.blinkingDotFeature) return // Only initialize once

      this.blinkingDotFeature = new Feature({
        geometry: new Point([0, 0]), // Initial dummy coordinate
      })

      const dotStyle = new Style({
        image: new Circle({
          radius: 15,
          fill: new Fill({ color: 'rgba(255, 0, 0, 1)' }),
          stroke: new Stroke({ color: 'white', width: 3 }),
        }),
      })

      this.blinkingDotLayer = new VectorLayer({
        source: new VectorSource({
          features: [this.blinkingDotFeature],
        }),
        style: dotStyle,
      })
      this.map.addLayer(this.blinkingDotLayer)

      let opacity = 1
      let increasing = false
      this.blinkingInterval = setInterval(() => {
        if (increasing) {
          opacity += 0.1
          if (opacity >= 1) {
            opacity = 1
            increasing = false
          }
        } else {
          opacity -= 0.1
          if (opacity <= 0.2) {
            opacity = 0.2
            increasing = true
          }
        }
        dotStyle.getImage().getFill().setColor(`rgba(255, 0, 0, ${opacity})`)
        this.blinkingDotLayer.changed()
      }, 150)
    },
    updatePolylines() {
      if (!this.map) return

      // Clear all features from the single polyline vector source
      this.polylineVectorSource.clear()

      const allFeatures = []

      if (!this.polylines || this.polylines.length === 0) {
        // If no polylines, hide the dot and reset zoom to India
        if (this.blinkingDotFeature) {
          this.blinkingDotFeature.getGeometry().setCoordinates([0, 0]) // Move off-screen or to a default
          this.blinkingDotLayer.changed()
        }
        // Reset to India view if no polylines are available
        this.map.getView().setCenter(fromLonLat([78.9629, 20.5937]))
        this.map.getView().setZoom(5)
        this.userInteractedWithZoom = false // Reset flag
        return
      }

      this.polylines.forEach((polylineCoords, index) => {
        if (polylineCoords.length > 0) {
          const polylineFeature = new Feature({
            geometry: new LineString(polylineCoords.map((coord) => fromLonLat(coord))),
          })
          polylineFeature.set('index', index) // Set index for styling
          allFeatures.push(polylineFeature)
        }
      })
      this.polylineVectorSource.addFeatures(allFeatures)

      // Update blinking dot position
      const l1Polyline = this.polylines[0] // L1 lane is the first polyline
      if (l1Polyline && l1Polyline.length > 0 && this.blinkingDotFeature) {
        const lastCoord = l1Polyline[l1Polyline.length - 1]
        const transformedCoord = fromLonLat(lastCoord)
        // console.log('Blinking dot position:', transformedCoord, l1Polyline.length, l1Polyline)
        this.blinkingDotFeature.getGeometry().setCoordinates(transformedCoord)
        this.blinkingDotLayer.changed()
      } else if (this.blinkingDotFeature) {
        // this.blinkingDotFeature.getGeometry().setCoordinates([0, 0]) // Hide if L1 is empty
        // this.blinkingDotLayer.changed()
      }

      if (allFeatures.length > 0) {
        const extent = allFeatures[0].getGeometry().getExtent()
        allFeatures.forEach((feature) => {
          extent[0] = Math.min(extent[0], feature.getGeometry().getExtent()[0])
          extent[1] = Math.min(extent[1], feature.getGeometry().getExtent()[1])
          extent[2] = Math.max(extent[2], feature.getGeometry().getExtent()[2])
          extent[3] = Math.max(extent[3], feature.getGeometry().getExtent()[3])
        })

        // Only fit to extent if the user hasn't manually interacted with the zoom
        if (!this.userInteractedWithZoom) {
          this.map.getView().fit(extent, {
            padding: [300, 300, 300, 300], // Increased padding to zoom out further
            duration: 1000,
          })
        }
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
    if (this.polylineVectorSource) {
      this.polylineVectorSource.clear()
      this.polylineVectorSource = null
    }
    if (this.polylineVectorLayer) {
      this.map.removeLayer(this.polylineVectorLayer)
      this.polylineVectorLayer = null
    }
    if (this.blinkingDotLayer) {
      this.map.removeLayer(this.blinkingDotLayer)
      this.blinkingDotLayer = null
    }
    if (this.blinkingDotFeature) {
      this.blinkingDotFeature = null
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
