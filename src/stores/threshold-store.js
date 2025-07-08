import { defineStore } from 'pinia'

export const useThresholdStore = defineStore('threshold', {
  state: () => ({
    roughnessThreshold: 2400,
    rutDepthThreshold: 5,
    crackingThreshold: 5,
    ravellingThreshold: 1,
  }),
  actions: {
    setThresholds({
      roughnessThreshold,
      rutDepthThreshold,
      crackingThreshold,
      ravellingThreshold,
    }) {
      this.roughnessThreshold = roughnessThreshold
      this.rutDepthThreshold = rutDepthThreshold
      this.crackingThreshold = crackingThreshold
      this.ravellingThreshold = ravellingThreshold
    },
  },
})
