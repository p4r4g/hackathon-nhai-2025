<template>
  <q-page class="flex flex-center" style="width: 100vw; height: 100vh">
    <MapComponent v-if="polylineCoordinates.length > 0" :polylines="polylineCoordinates" />
  </q-page>
</template>

<script setup>
import MapComponent from 'src/components/MapComponent.vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import mqtt from 'mqtt'
import { useMqttStore } from 'src/stores/mqtt-store'

const polylineCoordinates = ref([])
const mqttStore = useMqttStore()

watch(
  () => mqttStore.polylineData,
  (newData) => {
    if (newData) {
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
      mqttStore.addMqttData(parsedData)
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
