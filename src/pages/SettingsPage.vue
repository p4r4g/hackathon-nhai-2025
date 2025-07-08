<template>
  <q-page class="q-pa-md">
    <q-card>
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
          <q-btn type="submit" color="primary" label="Save" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useThresholdStore } from '../stores/threshold-store'

const store = useThresholdStore()
const roughnessThreshold = ref(store.roughnessThreshold)
const rutDepthThreshold = ref(store.rutDepthThreshold)
const crackingThreshold = ref(store.crackingThreshold)
const ravellingThreshold = ref(store.ravellingThreshold)

function saveSettings() {
  store.setThresholds({
    roughnessThreshold: roughnessThreshold.value,
    rutDepthThreshold: rutDepthThreshold.value,
    crackingThreshold: crackingThreshold.value,
    ravellingThreshold: ravellingThreshold.value,
  })
}
</script>
