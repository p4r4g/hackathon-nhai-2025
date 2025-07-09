import { defineStore } from 'pinia'
import mqtt from 'mqtt'
import { useThresholdStore } from './threshold-store'

export const useMqttStore = defineStore('mqtt', {
  state: () => ({
    polylineData: Array(8)
      .fill(null)
      .map(() => []),
    totalSegmentsReceived: 0,
    laneStats: Array(8)
      .fill(null)
      .map(() => ({
        totalSegments: 0,
        segmentsWithinThreshold: 0,
        percentageWithinThreshold: 0,
      })),
    mqttClient: null,
    isConnected: false,
  }),
  actions: {
    clearStore() {
      this.polylineData = Array(8)
        .fill(null)
        .map(() => [])
      this.totalSegmentsReceived = 0
      this.laneStats = Array(8)
        .fill(null)
        .map(() => ({
          totalSegments: 0,
          segmentsWithinThreshold: 0,
          percentageWithinThreshold: 0,
        }))
    },
    connectMqtt(vehicleType) {
      if (this.mqttClient) {
        this.disconnectMqtt() // Disconnect existing client if any
      }

      let host = ''
      let username = ''
      let password = ''
      let topic = ''

      if (vehicleType === 'small_feed') {
        // call url https://n8n.barangale.in/webhook/feed_nhai_nsv_data_smallset
        host = '740a2425c86847e98484890c67f43046.s1.eu.hivemq.cloud'
        username = 'nhai_hackathon_sub'
        password = '8aEpyQT9YC97^Xus'
        topic = '/nhai/nvsr/live'
      } else if (vehicleType === 'large_feed') {
        host = '740a2425c86847e98484890c67f43046.s1.eu.hivemq.cloud' // Assuming same host for now
        username = 'nhai_hackathon_sub' // Assuming same username for now
        password = '8aEpyQT9YC97^Xus' // Assuming same password for now
        topic = '/nhai/nvsr/live' // Assuming same topic for now, adjust if needed
      } else {
        console.error('Invalid vehicle type:', vehicleType)
        return
      }

      const options = {
        host: host,
        path: '/mqtt',
        port: 8884,
        protocol: 'wss',
        username: username,
        password: password,
      }

      this.mqttClient = mqtt.connect(options)
      this.mqttClient.on('connect', () => {
        this.isConnected = true
        this.clearStore() // Reset buffer on connect
        this.mqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`Subscribed to ${topic}`)
          } else {
            console.error('Subscription error:', err)
          }
        })
      })
      this.mqttClient.on('message', (topic, message) => {
        try {
          const parsedData = JSON.parse(message.toString())
          const thresholds = useThresholdStore()
          this.addMqttData(parsedData, {
            roughnessThreshold: thresholds.roughnessThreshold,
            rutDepthThreshold: thresholds.rutDepthThreshold,
            crackingThreshold: thresholds.crackingThreshold,
            ravellingThreshold: thresholds.ravellingThreshold,
          })
        } catch (e) {
          console.error('Failed to parse MQTT message:', e)
        }
      })
      this.mqttClient.on('error', (err) => {
        console.error('MQTT error:', err)
      })
    },
    disconnectMqtt() {
      if (this.mqttClient) {
        this.mqttClient.end()
        this.mqttClient = null
        this.isConnected = false
        console.log('Disconnected from MQTT broker')
      }
    },
    addMqttData(data, thresholds) {
      this.totalSegmentsReceived++ // Increment total messages received
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

          // Update lane statistics
          this.laneStats[lane.id].totalSegments++
          let withinThreshold = true
          if (
            segment.data.roughnessBI > thresholds.roughnessThreshold ||
            segment.data.rutDepth > thresholds.rutDepthThreshold ||
            segment.data.crackArea > thresholds.crackingThreshold ||
            segment.data.ravellingArea > thresholds.ravellingThreshold
          ) {
            withinThreshold = false
          }

          if (withinThreshold) {
            this.laneStats[lane.id].segmentsWithinThreshold++
          }

          this.laneStats[lane.id].percentageWithinThreshold =
            (this.laneStats[lane.id].segmentsWithinThreshold /
              this.laneStats[lane.id].totalSegments) *
            100
        }
      })
    },
  },
  getters: {
    getPolylineCoordinates: (state) => state.polylineData,
    getLaneStats: (state) => state.laneStats,
    getTotalSegmentsReceived: (state) => state.totalSegmentsReceived,
  },
})
