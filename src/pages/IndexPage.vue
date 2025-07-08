<template>
  <q-page class="flex" style="width: 100vw; height: 100vh">
    <div class="q-pa-md flex" style="flex-wrap: wrap; gap: 16px">
      <!-- Overall Statistics Box -->
      <q-card class="my-card" style="min-width: 280px; flex-grow: 1">
        <q-card-section>
          <div class="text-h6">Overall Statistics</div>
          <div class="text-subtitle2">
            Total Segments Received: {{ mqttStore.getTotalSegmentsReceived }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Left Lanes (L1-L4) Box -->
      <q-card class="my-card" style="min-width: 280px; flex-grow: 1">
        <q-card-section>
          <div class="text-h6">Left Lanes (L1-L4)</div>
          <div v-for="(lane, index) in leftLaneStats" :key="index" class="q-mb-sm">
            <div class="text-subtitle2">
              Lane {{ lanePrefixes[index] }} {{ lane.percentageWithinThreshold.toFixed(2) }}% ({{
                lane.segmentsWithinThreshold
              }}/{{ lane.totalSegments }})
            </div>
            <q-linear-progress
              :value="lane.percentageWithinThreshold / 100"
              :color="getProgressBarColor(lane.percentageWithinThreshold)"
              track-color="grey-3"
              class="q-mt-xs"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Right Lanes (R1-R4) Box -->
      <q-card class="my-card" style="min-width: 280px; flex-grow: 1">
        <q-card-section>
          <div class="text-h6">Right Lanes (R1-R4)</div>
          <div v-for="(lane, index) in rightLaneStats" :key="index" class="q-mb-sm">
            <div class="text-subtitle2">
              Lane {{ lanePrefixes[index + 4] }} {{ lane.percentageWithinThreshold.toFixed(2) }}%
              ({{ lane.segmentsWithinThreshold }}/{{ lane.totalSegments }})
            </div>
            <q-linear-progress
              :value="lane.percentageWithinThreshold / 100"
              :color="getProgressBarColor(lane.percentageWithinThreshold)"
              track-color="grey-3"
              class="q-mt-xs"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
    <MapComponent
      v-if="polylineCoordinates.length > 0"
      :polylines="polylineCoordinates"
    />
  </q-page>
</template>

<script setup>
import MapComponent from 'src/components/MapComponent.vue'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import mqtt from 'mqtt'
import { useMqttStore } from 'src/stores/mqtt-store'
import { useThresholdStore } from 'src/stores/threshold-store' // Import threshold store

const polylineCoordinates = ref([])
const mqttStore = useMqttStore()
const thresholdStore = useThresholdStore() // Initialize threshold store

// Remove local threshold refs, use store instead
// const roughnessLimit = ref(2400)
// const rutDepthLimit = ref(5)
// const crackingLimit = ref(5)
// const ravellingLimit = ref(1)

const lanePrefixes = ['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4']

const getProgressBarColor = (percentage) => {
  if (percentage > 80) {
  
    return 'green-6'
  } else if (percentage >= 60) {
    return 'yellow-8'
  } else {
    return 'red-6'
  }
}

// Computed properties for left and right lane stats
const leftLaneStats = computed(() => {
  return mqttStore.getLaneStats.slice(0, 4) // L1 to L4
})

const rightLaneStats = computed(() => {
  return mqttStore.getLaneStats.slice(4, 8) // R1 to R4
})

watch(
  () => mqttStore.polylineData,
  (newData) => {
    if (newData) {
      // The newData is already structured as an array of arrays of segments
      // No need to filter based on lane.coords here, as lane itself is an array of segments
      polylineCoordinates.value = newData
    }
  },
  { immediate: true },
)

onMounted(() => {
  var options = {
    host: '740a2425c86847e98484890c67f43046.s1.eu.hivemq.cloud',
    path: '/mqtt',
    port: 8884,
    protocol: 'wss',
    username: 'nhai_hackathon_sub',
    password: '8aEpyQT9YC97^Xus',
  }

  // MQTT setup
  const client = mqtt.connect(options)

  client.on('connect', () => {
    console.log('Connected to MQTT broker')
    client.subscribe('/nhai/nvsr/live', (err) => {
      if (!err) {
        console.log('Subscribed to polyline/update')
      } else {
        console.error('Subscription error:', err)
      }
    })
  })

  client.on('message', (topic, message) => {
    // console.log(`Received message from topic ${topic}: ${message.toString()}`)
    try {
      const parsedData = JSON.parse(message.toString())
      mqttStore.addMqttData(parsedData, {
        roughnessThreshold: thresholdStore.roughnessThreshold,
        rutDepthThreshold: thresholdStore.rutDepthThreshold,
        crackingThreshold: thresholdStore.crackingThreshold,
        ravellingThreshold: thresholdStore.ravellingThreshold,
      })
    } catch (e) {
      console.error('Failed to parse MQTT message:', e)
    }
  })

  client.on('error', (err) => {
    console.error('MQTT error:', err)
  })

  onUnmounted(() => {
    if (client) {
      client.end()
      console.log('Disconnected from MQTT broker')
    }
  })
})
</script>
