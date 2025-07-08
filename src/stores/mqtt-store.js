import { defineStore } from 'pinia'

export const useMqttStore = defineStore('mqtt', {
  state: () => ({
    // Initialize polylineData as an array of 8 empty arrays, one for each lane
    // L1, L2, L3, L4, R1, R2, R3, R4
    polylineData: Array(8)
      .fill(null)
      .map(() => []), // Initialize as an array of empty arrays for segments
  }),
  actions: {
    addMqttData(data) {
      const laneKeys = [
        {
          id: 0,
          prefix: 'L1',
          startLat: 'L1StartLatitude',
          startLon: 'L1StartLongitude',
          endLat: 'L1EndLatitude',
          endLon: 'L1EndLongitude',
        },
        {
          id: 1,
          prefix: 'L2',
          startLat: 'L2StartLatitude',
          startLon: 'L2StartLongitude',
          endLat: 'L2EndLatitude',
          endLon: 'L2EndLongitude',
        },
        {
          id: 2,
          prefix: 'L3',
          startLat: 'L3StartLatitude',
          startLon: 'L3StartLongitude',
          endLat: 'L3EndLatitude',
          endLon: 'L3EndLongitude',
        },
        {
          id: 3,
          prefix: 'L4',
          startLat: 'L4StartLatitude',
          startLon: 'L4StartLongitude',
          endLat: 'L4EndLatitude',
          endLon: 'L4EndLongitude',
        },
        {
          id: 4,
          prefix: 'R1',
          startLat: 'R1StartLatitude',
          startLon: 'R1StartLongitude',
          endLat: 'R1EndLatitude',
          endLon: 'R1EndLongitude',
        },
        {
          id: 5,
          prefix: 'R2',
          startLat: 'R2StartLatitude',
          startLon: 'R2StartLongitude',
          endLat: 'R2EndLatitude',
          endLon: 'R2EndLongitude',
        },
        {
          id: 6,
          prefix: 'R3',
          startLat: 'R3StartLatitude',
          startLon: 'R3StartLongitude',
          endLat: 'R3EndLatitude',
          endLon: 'R3EndLongitude',
        },
        {
          id: 7,
          prefix: 'R4',
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

        // Extract lane-specific data using the correct prefix
        const roughnessBI = data[`${lane.prefix}LaneRoughnessBI(inmm/km)`]
        const rutDepth = data[`${lane.prefix}RutDepth(inmm)`]
        const crackArea = data[`${lane.prefix}CrackArea(in%area)`]
        const ravellingArea = data[`${lane.prefix}Area(%area)`]

        if (startLat && startLon && endLat && endLon) {
          // Create a segment object with its coordinates and data
          const segment = {
            coords: [
              [startLon, startLat],
              [endLon, endLat],
            ],
            data: {
              roughnessBI: roughnessBI,
              rutDepth: rutDepth,
              crackArea: crackArea,
              ravellingArea: ravellingArea,
            },
          }
          // Add the segment to the respective lane's array
          this.polylineData[lane.id].push(segment)
        }
      })
    },
  },
  getters: {
    getPolylineCoordinates: (state) => state.polylineData,
  },
})
