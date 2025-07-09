<template>
  <q-page class="q-pa-md">
    <q-row class="q-gutter-md items-stretch" style="width: 100%">
      <!-- Overall Statistics Box -->
      <q-col xs="12" md="auto" class="flex" style="max-width: 260px; min-width: 220px">
        <q-card class="my-card q-pa-xs full-width">
          <q-card-section class="q-pa-sm">
            <div class="text-h6">Overall Statistics</div>
            <div class="text-subtitle2">
              Total Segments Received: {{ mqttStore.getTotalSegmentsReceived }}
            </div>
          </q-card-section>
        </q-card>
      </q-col>

      <!-- Left Lanes (L1-L4) Split into Two Columns -->
      <q-col xs="12" md="auto" class="flex" style="max-width: 260px; min-width: 220px">
        <q-card class="my-card q-pa-xs full-width">
          <q-card-section class="q-pa-sm">
            <div class="text-h6">Left Lanes (L1-L4)</div>
            <q-row>
              <q-col cols="6">
                <div
                  v-for="(lane, index) in leftLaneStats.slice(0, 2)"
                  :key="'l1l2-' + index"
                  class="q-mb-xs row items-center no-wrap"
                  style="gap: 6px"
                >
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">{{
                    lanePrefixes[index]
                  }}</span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px"
                    >{{ lane.percentageWithinThreshold.toFixed(2) }}% ({{
                      lane.segmentsWithinThreshold
                    }}/{{ lane.totalSegments }})</span
                  >
                  <q-linear-progress
                    :value="lane.percentageWithinThreshold / 100"
                    :color="getProgressBarColor(lane.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
              </q-col>
              <q-col cols="6">
                <div
                  v-for="(lane, index) in leftLaneStats.slice(2, 4)"
                  :key="'l3l4-' + index"
                  class="q-mb-xs row items-center no-wrap"
                  style="gap: 6px"
                >
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">{{
                    lanePrefixes[index + 2]
                  }}</span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px"
                    >{{ lane.percentageWithinThreshold.toFixed(2) }}% ({{
                      lane.segmentsWithinThreshold
                    }}/{{ lane.totalSegments }})</span
                  >
                  <q-linear-progress
                    :value="lane.percentageWithinThreshold / 100"
                    :color="getProgressBarColor(lane.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
              </q-col>
            </q-row>
          </q-card-section>
        </q-card>
      </q-col>

      <!-- Right Lanes (R1-R4) Box -->
      <q-col md="auto" class="flex" style="max-width: 260px; min-width: 220px">
        <q-card class="my-card q-pa-xs full-width">
          <q-card-section class="q-pa-sm">
            <div class="text-h6">Right Lanes (R1-R4)</div>
            <div
              v-for="(lane, index) in rightLaneStats"
              :key="index"
              class="col-grow"
              style="gap: 0px"
            >
              <span class="text-caption" style="font-size: 12px; min-width: 38px">{{
                lanePrefixes[index + 4]
              }}</span>
              <span class="text-caption" style="font-size: 12px; min-width: 60px"
                >{{ lane.percentageWithinThreshold.toFixed(2) }}% ({{
                  lane.segmentsWithinThreshold
                }}/{{ lane.totalSegments }})</span
              >
              <q-linear-progress
                :value="lane.percentageWithinThreshold / 100"
                :color="getProgressBarColor(lane.percentageWithinThreshold)"
                track-color="grey-3"
                style="height: 8px; min-width: 60px; flex: 1"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-col>

      <!-- Settings Button -->
      <q-col xs="12" md="auto" class="flex flex-center" style="min-width: 180px">
        <q-btn
          color="primary"
          icon="settings"
          label="Threshold Settings"
          @click="showSettings = true"
          class="q-mb-md"
        />
      </q-col>
    </q-row>
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
  mqttStore.connectMqtt()
})

onUnmounted(() => {
  mqttStore.disconnectMqtt()
})
</script>
