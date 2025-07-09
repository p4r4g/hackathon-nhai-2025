<template>
  <q-page class="lg:q-pa-md full-width">
    <div class="row q-gutter-md items-stretch q-mx-sm">
      <!-- Overall Statistics Box -->

      <div class="full-width">
        <div
          class="q-gutter-sm lg:q-pa-md items-stretch"
          :class="$q.screen.lt.sm ? 'column' : 'row'"
        >
          <!-- Shrinked column for settings button -->
          <div
            class="col-auto flex flex-center q-gutter-sm q-pa-md"
            :style="{ backgroundColor: 'oklch(96.8% 0.007 247.896)' }"
          >
            <div class="column items-end">
              <div class="row q-gutter-sm items-center q-mb-md">
                <q-toggle v-model="showVideo" label="Live Feed" color="blue" />
                <q-btn
                  color="primary"
                  icon="settings"
                  @click="showSettings = true"
                  label="Settings"
                />
              </div>
              <div class="row q-gutter-sm items-center">
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
          <!-- Card 1 -->
          <div class="col">
            <q-card
              class="my-card q-pa-xs full-width fit self-stretch"
              :style="{ backgroundColor: 'oklch(96.8% 0.007 247.896)' }"
            >
              <q-card-section class="q-pa-sm">
                <div class="text-h6">
                  Overall Statistics
                  <span class="text-subtitle2">[ QoS: {{ mqttStore.getQos }} ]</span>
                </div>
                <div class="text-subtitle2">
                  Total Segments Received: {{ mqttStore.getTotalSegmentsReceived }}
                </div>
                <div class="text-subtitle2">
                  Message Delivery Rate: {{ mqttStore.getDeliveryRate.toFixed(2) }}%
                </div>

                <div class="q-mb-xs row items-center no-wrap" style="gap: 6px">
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">
                    All Lanes
                  </span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px">
                    {{
                      overallTotalStats.totalSegments === 0
                        ? 'N/A'
                        : overallTotalStats.percentageWithinThreshold.toFixed(2) + '%'
                    }}
                    ({{ overallTotalStats.segmentsWithinThreshold }}/{{
                      overallTotalStats.totalSegments
                    }})
                  </span>
                  <q-linear-progress
                    :value="
                      overallTotalStats.totalSegments === 0
                        ? 0
                        : overallTotalStats.percentageWithinThreshold / 100
                    "
                    :color="getProgressBarColor(overallTotalStats.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
                <div class="q-mb-xs row items-center no-wrap" style="gap: 6px">
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">
                    Left Lanes
                  </span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px">
                    {{
                      overallLeftLaneStats.totalSegments === 0
                        ? 'N/A'
                        : overallLeftLaneStats.percentageWithinThreshold.toFixed(2) + '%'
                    }}
                    ({{ overallLeftLaneStats.segmentsWithinThreshold }}/{{
                      overallLeftLaneStats.totalSegments
                    }})
                  </span>
                  <q-linear-progress
                    :value="
                      overallLeftLaneStats.totalSegments === 0
                        ? 0
                        : overallLeftLaneStats.percentageWithinThreshold / 100
                    "
                    :color="getProgressBarColor(overallLeftLaneStats.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
                <div class="q-mb-xs row items-center no-wrap" style="gap: 6px">
                  <span class="text-caption" style="font-size: 12px; min-width: 38px">
                    Right Lanes
                  </span>
                  <span class="text-caption" style="font-size: 12px; min-width: 60px">
                    {{
                      overallRightLaneStats.totalSegments === 0
                        ? 'N/A'
                        : overallRightLaneStats.percentageWithinThreshold.toFixed(2) + '%'
                    }}
                    ({{ overallRightLaneStats.segmentsWithinThreshold }}/{{
                      overallRightLaneStats.totalSegments
                    }})
                  </span>
                  <q-linear-progress
                    :value="
                      overallRightLaneStats.totalSegments === 0
                        ? 0
                        : overallRightLaneStats.percentageWithinThreshold / 100
                    "
                    :color="getProgressBarColor(overallRightLaneStats.percentageWithinThreshold)"
                    track-color="grey-3"
                    style="height: 8px; min-width: 60px; flex: 1"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Card 2 -->
          <div class="col">
            <q-card
              class="my-card q-pa-xs full-width fit self-stretch"
              :style="{ backgroundColor: 'oklch(96.8% 0.007 247.896)' }"
            >
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
            <q-card
              class="my-card q-pa-xs full-width fit self-stretch"
              :style="{ backgroundColor: 'oklch(96.8% 0.007 247.896)' }"
            >
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
        </div>
      </div>
    </div>
    <div
      v-if="showVideoOverlay && showVideo && mqttStore.isConnected"
      class="video-overlay"
      :class="{ 'fullscreen-video': isFullscreen }"
      @click="toggleFullscreen"
      :style="{
        height: $q.screen.lt.sm ? '20%' : '41%',
        width: $q.screen.lt.sm ? '34%' : '18%',
      }"
    >
      <video ref="videoPlayer" class="full-width full-height" autoplay loop muted>
        <source src="/sample_30sec.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>

    <div class="q-pa-sm">
      <MapComponent
        v-if="mqttStore.getPolylineCoordinates.length > 0"
        :polylines="mqttStore.getPolylineCoordinates"
      />
    </div>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import MapComponent from 'src/components/MapComponent.vue'
import { useMqttStore } from 'src/stores/mqtt-store'
import { useThresholdStore } from 'src/stores/threshold-store'

const $q = useQuasar()

const showVideo = ref(false)
const showVideoOverlay = ref(true)
const isFullscreen = ref(false)
const videoPlayer = ref(null)

const mqttStore = useMqttStore()
const thresholdStore = useThresholdStore()

const showSettings = ref(false)

const roughnessThreshold = ref(thresholdStore.roughnessThreshold)
const rutDepthThreshold = ref(thresholdStore.rutDepthThreshold)
const crackingThreshold = ref(thresholdStore.crackingThreshold)
const ravellingThreshold = ref(thresholdStore.ravellingThreshold)

const overallLeftLaneStats = computed(() => {
  const totalSegments = leftLaneStats.value.reduce((sum, lane) => sum + lane.totalSegments, 0)
  const segmentsWithinThreshold = leftLaneStats.value.reduce(
    (sum, lane) => sum + lane.segmentsWithinThreshold,
    0,
  )
  const percentageWithinThreshold =
    totalSegments === 0 ? 0 : (segmentsWithinThreshold / totalSegments) * 100
  return { totalSegments, segmentsWithinThreshold, percentageWithinThreshold }
})

const overallRightLaneStats = computed(() => {
  const totalSegments = rightLaneStats.value.reduce((sum, lane) => sum + lane.totalSegments, 0)
  const segmentsWithinThreshold = rightLaneStats.value.reduce(
    (sum, lane) => sum + lane.segmentsWithinThreshold,
    0,
  )
  const percentageWithinThreshold =
    totalSegments === 0 ? 0 : (segmentsWithinThreshold / totalSegments) * 100
  return { totalSegments, segmentsWithinThreshold, percentageWithinThreshold }
})

const overallTotalStats = computed(() => {
  const totalSegments = mqttStore.getLaneStats.reduce((sum, lane) => sum + lane.totalSegments, 0)
  const segmentsWithinThreshold = mqttStore.getLaneStats.reduce(
    (sum, lane) => sum + lane.segmentsWithinThreshold,
    0,
  )
  const percentageWithinThreshold =
    totalSegments === 0 ? 0 : (segmentsWithinThreshold / totalSegments) * 100
  return { totalSegments, segmentsWithinThreshold, percentageWithinThreshold }
})

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

watch(
  () => mqttStore.isConnected,
  (newVal) => {
    if (!newVal && videoPlayer.value) {
      videoPlayer.value.pause()
    }
  },
)

function toggleFullscreen() {
  if (videoPlayer.value) {
    if (isFullscreen.value) {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        /* Safari, Chrome and Opera */
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        /* IE/Edge */
        document.msExitFullscreen()
      }
    } else {
      if (videoPlayer.value.requestFullscreen) {
        videoPlayer.value.requestFullscreen()
      } else if (videoPlayer.value.webkitRequestFullscreen) {
        /* Safari, Chrome and Opera */
        videoPlayer.value.webkitRequestFullscreen()
      } else if (videoPlayer.value.msRequestFullscreen) {
        /* IE/Edge */
        videoPlayer.value.msRequestFullscreen()
      }
    }
    isFullscreen.value = !isFullscreen.value
  }
}
</script>

<style scoped>
.video-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 310px; /* Default for larger screens */
  height: 400px; /* Default for larger screens (16:9 aspect ratio) */
  z-index: 1000;
  background-color: black;
  cursor: pointer;
  transition: all 0.3s ease;
}

@media (max-width: 600px) {
  .video-overlay {
    width: 90vw; /* Adjust for mobile screens */
    height: calc(90vw * 9 / 16); /* Maintain aspect ratio */
    bottom: 10px;
    right: 10px;
  }
}

.fullscreen-video {
  width: 100vw !important;
  height: 100vh !important;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
