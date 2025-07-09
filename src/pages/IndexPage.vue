<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-md items-stretch" style="width: 100%">
      <!-- Overall Statistics Box -->

      <div class="q-pa-sm full-width">
        <div class="row q-gutter-lg items-stretch">
          <!-- Card 1 -->
          <div class="col">
            <q-card class="my-card q-pa-xs full-width fit self-stretch">
              <q-card-section class="q-pa-sm">
                <div class="text-h6">Overall Statistics</div>
                <div class="text-subtitle2">
                  Total Segments Received: {{ mqttStore.getTotalSegmentsReceived }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Card 2 -->
          <div class="col">
            <q-card class="my-card q-pa-xs full-width fit self-stretch">
              <q-card-section class="q-pa-sm">
                <div class="text-h6">Left Lanes (L1–L4)</div>
                <div
                  v-for="(lane, index) in leftLaneStats"
                  :key="index"
                  class="q-mb-xs row items-center no-wrap"
                  style="gap: 6px"
                >
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">
                    {{ lanePrefixes[index] }}
                  </span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px">
                    {{ lane.percentageWithinThreshold.toFixed(2) }}% ({{
                      lane.segmentsWithinThreshold
                    }}/{{ lane.totalSegments }})
                  </span>
                  <q-linear-progress
                    :value="lane.percentageWithinThreshold / 100"
                    :color="getProgressBarColor(lane.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Card 3 -->
          <div class="col">
            <q-card class="my-card q-pa-xs full-width fit self-stretch">
              <q-card-section class="q-pa-sm">
                <div class="text-h6">Right Lanes (R1–R4)</div>
                <div
                  v-for="(lane, index) in rightLaneStats"
                  :key="index"
                  class="q-mb-xs row items-center no-wrap"
                  style="gap: 6px"
                >
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">
                    {{ lanePrefixes[index + 4] }}
                  </span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px">
                    {{ lane.percentageWithinThreshold.toFixed(2) }}% ({{
                      lane.segmentsWithinThreshold
                    }}/{{ lane.totalSegments }})
                  </span>
                  <q-linear-progress
                    :value="lane.percentageWithinThreshold / 100"
                    :color="getProgressBarColor(lane.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Shrinked column for settings button -->
          <div class="col-auto flex flex-center q-gutter-sm">
            <div class="column items-end">
              <q-btn
                class="q-mb-md"
                color="primary"
                icon="settings"
                @click="showSettings = true"
                label="Settings"
              />
              <div class="row">
                <q-select
                  v-model="selectedVehicle"
                  :options="vehicleOptions"
                  label="Select Vehicle"
                  emit-value
                  map-options
                  style="min-width: 200px"
                />
                <q-btn
                  color="positive"
                  label="Connect"
                  @click="connectVehicle"
                  :target="'_blank'"
                  :href="`https://n8n.barangale.in/webhook/feed_nhai_nsv_data_${selectedVehicle}`"
                  :disable="!selectedVehicle || mqttStore.isConnected"
                />
                <q-btn
                  color="negative"
                  label="Disconnect"
                  @click="disconnectVehicle"
                  :disable="!mqttStore.isConnected"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <MapComponent
      v-if="mqttStore.getPolylineCoordinates.length > 0"
      :polylines="mqttStore.getPolylineCoordinates"
    />
    <q-dialog v-model="showSettings" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Threshold Settings</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveSettings">
            <q-input
              v-model.number="roughnessThreshold"
              label="Roughness Threshold"
              type="number"
              :min="0"
              class="q-mb-md"
            />
            <q-input
              v-model.number="rutDepthThreshold"
              label="Rut Depth Threshold"
              type="number"
              :min="0"
              class="q-mb-md"
            />
            <q-input
              v-model.number="crackingThreshold"
              label="Cracking Threshold"
              type="number"
              :min="0"
              class="q-mb-md"
            />
            <q-input
              v-model.number="ravellingThreshold"
              label="Ravelling Threshold"
              type="number"
              :min="0"
              class="q-mb-md"
            />
            <div class="row q-gutter-sm q-mt-md">
              <q-btn type="submit" color="primary" label="Save" />
              <q-btn flat label="Cancel" color="grey" v-close-popup />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import MapComponent from 'src/components/MapComponent.vue'
import { useMqttStore } from 'src/stores/mqtt-store'
import { useThresholdStore } from 'src/stores/threshold-store'

const mqttStore = useMqttStore()
const thresholdStore = useThresholdStore()

const showSettings = ref(false)
const roughnessThreshold = ref(thresholdStore.roughnessThreshold)
const rutDepthThreshold = ref(thresholdStore.rutDepthThreshold)
const crackingThreshold = ref(thresholdStore.crackingThreshold)
const ravellingThreshold = ref(thresholdStore.ravellingThreshold)

const selectedVehicle = ref(null)
const vehicleOptions = [
  { label: 'GJ01AA1111 (small feed)', value: 'small_feed' },
  { label: 'GJ01BB2222 (large feed)', value: 'large_feed' },
]

const connectVehicle = () => {
  if (selectedVehicle.value) {
    mqttStore.connectMqtt(selectedVehicle.value)
  }
}

const disconnectVehicle = () => {
  mqttStore.disconnectMqtt()
}

function saveSettings() {
  thresholdStore.setThresholds({
    roughnessThreshold: roughnessThreshold.value,
    rutDepthThreshold: rutDepthThreshold.value,
    crackingThreshold: crackingThreshold.value,
    ravellingThreshold: ravellingThreshold.value,
  })
  showSettings.value = false
}

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

const leftLaneStats = computed(() => mqttStore.getLaneStats.slice(0, 4))
const rightLaneStats = computed(() => mqttStore.getLaneStats.slice(4, 8))

onMounted(() => {
  // No automatic connection on mount, user will connect manually
})

onUnmounted(() => {
  mqttStore.disconnectMqtt()
})
</script>
