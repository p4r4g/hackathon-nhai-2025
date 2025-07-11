<template>
  <div ref="mapContainer" class="map-container"></div>
  <div ref="popup" class="ol-popup">
    <a href="#" class="ol-popup-closer" @click.prevent="closePopup"></a>
    <div v-html="popupContent"></div>
  </div>
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
import Overlay from 'ol/Overlay' // Import Overlay for popups
import { useThresholdStore } from '../stores/threshold-store'
import { useMqttStore } from '../stores/mqtt-store' // Import mqtt-store

export default {
  name: 'MapComponent',
  props: {
    polylines: {
      type: Array,
      required: true,
    },
    // Remove threshold props, use store instead
  },
  data() {
    return {
      map: null,
      mapView: null, // Add mapView to data
      blinkingDotLayer: null,
      blinkingDotFeature: null,
      blinkingInterval: null,
      polylineVectorLayer: null, // New: Layer for all polylines
      polylineVectorSource: null, // New: Source for all polylines
      userInteractedWithZoom: false, // New: Track if user has manually zoomed
      popup: null, // OpenLayers Overlay for the popup
      popupContent: '', // Content to display in the popup
      isPopupOpen: false, // Track popup visibility
      thresholdStore: null,
      mqttStore: null, // Add mqttStore to data
      mapViewChangeListener: null, // Store reference to the change:resolution listener
    }
  },
  mounted() {
    this.thresholdStore = useThresholdStore()
    this.mqttStore = useMqttStore() // Initialize mqttStore
    this.initMap()
  },
  computed: {
    roughnessThreshold() {
      return this.thresholdStore?.roughnessThreshold ?? 2400
    },
    rutDepthThreshold() {
      return this.thresholdStore?.rutDepthThreshold ?? 5
    },
    crackingThreshold() {
      return this.thresholdStore?.crackingThreshold ?? 5
    },
    ravellingThreshold() {
      return this.thresholdStore?.ravellingThreshold ?? 1
    },
  },
  watch: {
    polylines: {
      handler() {
        this.updatePolylines()
      },
      deep: true,
    },
    'mqttStore.isConnected': {
      handler(newVal) {
        if (newVal) {
          // When connected, reset zoom to 5
          this.mapView.setZoom(10)
          this.userInteractedWithZoom = false // Reset flag to allow initial auto-zoom
        }
      },
      immediate: true, // Run handler immediately on component mount
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
        view: (this.mapView = new View({
          center: fromLonLat([78.9629, 20.5937]), // Center of India
          zoom: 5, // Initial zoom level for India
        })),
      })

      // Initialize a single vector source and layer for all polylines
      this.polylineVectorSource = new VectorSource()
      this.polylineVectorLayer = new VectorLayer({
        source: this.polylineVectorSource,
        style: (feature) => this.getPolylineStyle(feature),
      })
      this.map.addLayer(this.polylineVectorLayer)

      this.updatePolylines()
      this.initBlinkingDot() // Initialize blinking dot here

      // Add a listener for zoom changes
      this.mapViewChangeListener = () => {
        this.userInteractedWithZoom = true
        // Force redraw by re-setting the style function
        this.polylineVectorLayer.setStyle((feature) => this.getPolylineStyle(feature))
      }
      this.mapView.on('change:resolution', this.mapViewChangeListener)

      // Add click event listener for feature info
      this.map.on('click', this.handleMapClick)

      // Initialize popup overlay
      this.popup = new Overlay({
        element: this.$refs.popup,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      })
      this.map.addOverlay(this.popup)
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
        this.mapView.setCenter(fromLonLat([78.9629, 20.5937]))
        this.mapView.setZoom(5)
        this.userInteractedWithZoom = false // Reset flag
        return
      }

      this.polylines.forEach((laneSegments, laneIndex) => {
        laneSegments.forEach((segment, segmentIndex) => {
          if (segment.coords && segment.coords.length > 0) {
            const polylineFeature = new Feature({
              geometry: new LineString(segment.coords.map((coord) => fromLonLat(coord))),
            })
            polylineFeature.set('laneIndex', laneIndex) // Set lane index for potential future use
            polylineFeature.set('segmentIndex', segmentIndex) // Set segment index for potential future use
            polylineFeature.set('data', segment.data) // Set data for styling
            allFeatures.push(polylineFeature)
          }
        })
      })
      this.polylineVectorSource.addFeatures(allFeatures)

      // Update blinking dot position based on the last segment of the first lane
      const l1LaneSegments = this.polylines[0]
      if (l1LaneSegments && l1LaneSegments.length > 0 && this.blinkingDotFeature) {
        const lastSegment = l1LaneSegments[l1LaneSegments.length - 1]
        if (lastSegment.coords && lastSegment.coords.length > 1) {
          const lastCoord = lastSegment.coords[lastSegment.coords.length - 1]
          const transformedCoord = fromLonLat(lastCoord)
          this.blinkingDotFeature.getGeometry().setCoordinates(transformedCoord)
          this.blinkingDotLayer.changed()
          if (this.isPopupOpen === false) {
            this.mapView.setCenter(transformedCoord) // Center the map on the blinking dot
          }
        }
      } // Added missing closing brace for the if statement on line 208

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
          this.mapView.fit(extent, {
            padding: [300, 300, 300, 300], // Increased padding to zoom out further
            duration: 1000,
          })

          // Ensure the zoom level does not go below 5
          if (this.mapView.getZoom() < 5) {
            this.mapView.setZoom(5)
          }
        }
      }
    },
    handleMapClick(event) {
      this.userInteractedWithZoom = true // Disable auto-centering on click
      let featureFound = false
      this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const data = feature.get('data')
        if (data) {
          featureFound = true
          console.log('Clicked feature data:', data) // Log to validate
          const laneIndex = feature.get('laneIndex')
          const lanePrefixes = ['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4']
          const laneName = lanePrefixes[laneIndex] || 'Unknown Lane'

          // Determine the background color based on the segment's condition
          let popupBackgroundColor = 'white' // Default to white
          if (
            data.roughnessBI > this.roughnessThreshold ||
            data.rutDepth > this.rutDepthThreshold ||
            data.crackArea > this.crackingThreshold ||
            data.ravellingArea > this.ravellingThreshold
          ) {
            popupBackgroundColor = '#ffe0b2' // Light orange for segments exceeding threshold
          } else {
            popupBackgroundColor = '#e0ffe0' // Light green for segments within threshold
          }

          // Apply the background color to the popup element
          this.$refs.popup.style.backgroundColor = popupBackgroundColor

          let content = `<div class="popup-header"><b>Lane: ${laneName}</b></div><div class="popup-content">`
          const thresholdMap = {
            roughnessBI: 'roughnessThreshold',
            rutDepth: 'rutDepthThreshold',
            crackArea: 'crackingThreshold',
            ravellingArea: 'ravellingThreshold',
          }

          for (const key in data) {
            let value = data[key]
            const thresholdPropName = thresholdMap[key]
            let threshold = thresholdPropName ? this[thresholdPropName] : undefined
            let displayValue = value

            console.log(
              `Key: ${key}, Value: ${value}, Threshold: ${threshold}, Exceeds: ${value > threshold}`,
            )

            let lineContent = `${key}: ${displayValue}`
            if (threshold !== undefined) {
              lineContent += ` (Threshold: ${threshold})`
            }

            if (threshold !== undefined && value > threshold) {
              content += `<span class="red-text">${lineContent}</span><br>`
            } else {
              content += `${lineContent}<br>`
            }
            console.log(`Current content for ${key}: ${content}`)
          }
          this.popupContent =
            content +
            `<video width="320" height="240" controls><source src="/sample_30sec.mp4" type="video/mp4">Your browser does not support the video tag.</video>`
          this.popup.setPosition(event.coordinate)
          this.isPopupOpen = true // Set popup open flag
          console.log('Popup opened. isPopupOpen:', this.isPopupOpen)
          console.log('Popup position set to:', event.coordinate)
          if (this.$refs.popup) {
            console.log('Popup element display style:', this.$refs.popup.style.display)
          }
        }
      })

      if (!featureFound) {
        // If no feature was clicked, close the popup
        this.popup.setPosition(undefined)
        this.isPopupOpen = false // Set popup closed flag
        console.log(
          'No feature clicked, popup position set to undefined. isPopupOpen:',
          this.isPopupOpen,
        )
      }
    },
    closePopup() {
      this.popup.setPosition(undefined)
      console.log('Popup closed by user. isPopupOpen:', this.isPopupOpen)
      this.userInteractedWithZoom = false // Re-enable auto-centering when popup is closed
      this.isPopupOpen = false // Set popup closed flag
      return false // Prevent default link behavior
    },
    getPolylineStyle(feature) {
      const laneData = feature.get('data')
      let color = 'lightblue' // Default to green (below threshold)

      if (laneData) {
        // Check roughness
        if (laneData.roughnessBI > this.roughnessThreshold) {
          color = 'orange'
        }
        // Check rut depth
        if (laneData.rutDepth > this.rutDepthThreshold) {
          color = 'orange'
        }
        // Check cracking
        if (laneData.crackArea > this.crackingThreshold) {
          color = 'orange'
        }
        // Check ravelling
        if (laneData.ravellingArea > this.ravellingThreshold) {
          color = 'orange'
        }
      }

      // Calculate width based on zoom level
      const zoom = this.mapView ? this.mapView.getZoom() : 5 // Default zoom if not initialized
      let width = 3 // Base width
      if (zoom > 10) {
        width = 15
      } else if (zoom > 7) {
        width = 10
      } else {
        width = 5
      }

      return new Style({
        stroke: new Stroke({
          color: color,
          width: width,
          opacity: 1,
        }),
      })
    },
  },
  beforeUnmount() {
    if (this.blinkingInterval) {
      clearInterval(this.blinkingInterval)
      this.blinkingInterval = null
    }
    if (this.map) {
      this.map.un('click', this.handleMapClick)
      if (this.polylineVectorLayer) {
        this.map.removeLayer(this.polylineVectorLayer)
      }
      if (this.blinkingDotLayer) {
        this.map.removeLayer(this.blinkingDotLayer)
      }
      if (this.popup) {
        this.map.removeOverlay(this.popup)
        if (typeof this.popup.dispose === 'function') {
          this.popup.dispose()
        }
        this.popup = null
      }
      this.map.setTarget(undefined)
      this.map = null
    }
    if (this.mapView) {
      if (this.mapViewChangeListener) {
        this.mapView.un('change:resolution', this.mapViewChangeListener)
        this.mapViewChangeListener = null
      }
      this.mapView = null
    }
    if (this.polylineVectorSource) {
      this.polylineVectorSource.clear()
      this.polylineVectorSource = null
    }
    if (this.polylineVectorLayer) {
      if (typeof this.polylineVectorLayer.dispose === 'function') {
        this.polylineVectorLayer.dispose()
      }
      this.polylineVectorLayer = null
    }
    if (this.blinkingDotLayer) {
      if (typeof this.blinkingDotLayer.dispose === 'function') {
        this.blinkingDotLayer.dispose()
      }
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
  height: 100vh; /* Default for PC */
  background: #f0f0f0;
}

@media (max-width: 599px) {
  .map-container {
    height: 600px; /* Custom height for mobile */
  }
}

.ol-popup {
  position: absolute;
  background-color: white;
  -webkit-filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}
.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: ' ';
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.ol-popup-closer:after {
  content: '✖';
}

.red-text {
  color: red;
  font-weight: bold;
}
</style>

<style>
.popup-header {
  background-color: #f0f0f0;
  padding: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  font-size: 1.1em;
  color: #333;
}

.popup-content {
  padding: 5px 0;
  line-height: 1.6;
}

.popup-content b {
  color: #555;
}

.popup-content span.red-text {
  color: #d9534f; /* A slightly darker red for better readability */
  font-weight: bold;
}

.ol-popup video {
  margin-top: 15px;
  border-radius: 5px;
  width: 100%; /* Make video responsive within popup */
  height: auto;
}
</style>
