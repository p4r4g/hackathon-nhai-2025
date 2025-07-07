import { defineStore } from 'pinia'

export const useMqttStore = defineStore('mqtt', {
  state: () => ({
    // Initialize polylineData as an array of 8 empty arrays, one for each lane
    // L1, L2, L3, L4, R1, R2, R3, R4
    polylineData: Array(8)
      .fill(null)
      .map(() => []),
  }),
  actions: {
    addMqttData(data) {
      const laneKeys = [
        {
          id: 0,
          startLat: 'L1StartLatitude',
          startLon: 'L1StartLongitude',
          endLat: 'L1EndLatitude',
          endLon: 'L1EndLongitude',
        },
        {
          id: 1,
          startLat: 'L2StartLatitude',
          startLon: 'L2StartLongitude',
          endLat: 'L2EndLatitude',
          endLon: 'L2EndLongitude',
        },
        {
          id: 2,
          startLat: 'L3StartLatitude',
          startLon: 'L3StartLongitude',
          endLat: 'L3EndLatitude',
          endLon: 'L3EndLongitude',
        },
        {
          id: 3,
          startLat: 'L4StartLatitude',
          startLon: 'L4StartLongitude',
          endLat: 'L4EndLatitude',
          endLon: 'L4EndLongitude',
        },
        {
          id: 4,
          startLat: 'R1StartLatitude',
          startLon: 'R1StartLongitude',
          endLat: 'R1EndLatitude',
          endLon: 'R1EndLongitude',
        },
        {
          id: 5,
          startLat: 'R2StartLatitude',
          startLon: 'R2StartLongitude',
          endLat: 'R2EndLatitude',
          endLon: 'R2EndLongitude',
        },
        {
          id: 6,
          startLat: 'R3StartLatitude',
          startLon: 'R3StartLongitude',
          endLat: 'R3EndLatitude',
          endLon: 'R3EndLongitude',
        },
        {
          id: 7,
          startLat: 'R4StartLatitude',
          startLon: 'R4StartLongitude',
          endLat: 'R4EndLatitude',
          endLon: 'R4EndLongitude',
        },
      ]

      laneKeys.forEach((lane) => {
        const startLat = data[lane.startLat]
        const startLon = data[lane.startLon]
        const endLat = data[lane.endLat]
        const endLon = data[lane.endLon]

        if (startLat && startLon && endLat && endLon) {
          // If this is the first segment for this lane, add both start and end
          if (this.polylineData[lane.id].length === 0) {
            this.polylineData[lane.id].push([startLon, startLat])
          }
          // Always add the end point
          this.polylineData[lane.id].push([endLon, endLat])
        }
      })
    },
  },
  getters: {
    getPolylineCoordinates: (state) => state.polylineData,
  },
})
