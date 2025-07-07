<template>
  <q-page class="flex flex-center" style="width: 100vw; height: 100vh">
    <MapComponent v-if="polylineCoordinates.length > 0" :polylines="polylineCoordinates" />
  </q-page>
</template>

<script setup>
import MapComponent from 'src/components/MapComponent.vue'
import { ref, onMounted } from 'vue'

const polylineCoordinates = ref([])

const csvDataString = `NH Number	Start Chainage 	End Chainage 	Length	Structure Details	Lane L1 Start Latitude	Lane L1 End Longitude	Lane L1 Start Latitude	Lane L1 End Longitude	Lane L2 Start Latitude	Lane L2 End Longitude	Lane L2 Start Latitude	Lane L2 End Longitude	Lane L3 Start Latitude	Lane L3 End Longitude	Lane L3 Start Latitude	Lane L3 End Longitude	Lane L4 Start Latitude	Lane L4 End Longitude	Lane L4 Start Latitude	Lane L4 End Longitude	Lane R1 Start Latitude	Lane R1 End Longitude	Lane R1 Start Latitude	Lane R1 End Longitude	Lane R2 Start Latitude	Lane R2 End Longitude	Lane R2 Start Latitude	Lane R2 End Longitude	Lane R3 Start Latitude	Lane R3 End Longitude	Lane R3 Start Latitude	Lane R3 End Longitude	Lane R4 Start Latitude	Lane R4 End Longitude	Lane R4 Start Latitude	Lane R4 End Longitude
NH148N	247310	247400	90		26.36114	76.25048	26.36034	76.25034	26.36111	76.25052	26.36031	76.25038	26.36114	76.25056	26.36034	76.25042	26.36115	76.25061	26.36035	76.25047	26.36011	76.25005	26.36091	76.25019	26.35999	76.24998	26.36079	76.25013	26.35978	76.24992	26.36058	76.25006	26.36007	76.24993	26.36088	76.25007
NH148N	247400	247500	100		26.36034	76.25034	26.35945	76.25018	26.36031	76.25038	26.35942	76.25022	26.36034	76.25042	26.35945	76.25026	26.36035	76.25047	26.35946	76.25031	26.35922	76.24989	26.36011	76.25005	26.3591	76.24982	26.35999	76.24998	26.35889	76.24975	26.35978	76.24992	26.35918	76.24976	26.36007	76.24993
NH148N	247500	247600	100		26.35945	76.25018	26.35857	76.25001	26.35942	76.25022	26.35853	76.25006	26.35945	76.25026	26.35857	76.25009	26.35946	76.25031	26.35857	76.25014	26.35833	76.24972	26.35922	76.24989	26.35821	76.24966	26.3591	76.24982	26.358	76.24959	26.35889	76.24975	26.35829	76.2496	26.35918	76.24976
NH148N	247600	247700	100		26.35857	76.25001	26.35768	76.24985	26.35853	76.25006	26.35764	76.24989	26.35857	76.25009	26.35768	76.24993	26.35857	76.25014	26.35768	76.24998	26.35744	76.24956	26.35833	76.24972	26.35732	76.2495	26.35821	76.24966	26.35711	76.24943	26.358	76.24959	26.3574	76.24944	26.35829	76.2496
NH148N	247700	247800	100		26.35768	76.24985	26.35679	76.24969	26.35764	76.24989	26.35676	76.24973	26.35768	76.24993	26.35679	76.24977	26.35768	76.24998	26.35679	76.24982	26.35655	76.2494	26.35744	76.24956	26.35643	76.24933	26.35732	76.2495	26.35622	76.24926	26.35711	76.24943	26.35651	76.24928	26.35740	76.24944
NH148N	247800	247900	100	Culvert	26.35679	76.24969	26.3559	76.24953	26.35676	76.24973	26.35587	76.24957	26.35679	76.24977	26.3559	76.24961	26.35679	76.24982	26.35591	76.24966	26.35566	76.24924	26.35655	76.2494	26.35554	76.24917	26.35643	76.24933	26.35533	76.2491	26.35622	76.24926	26.35562	76.24911	26.35651	76.24928
NH148N	247900	248000	100		26.3559	76.24953	26.35501	76.24937	26.35587	76.24957	26.35498	76.24941	26.3559	76.24961	26.35501	76.24944	26.35591	76.24966	26.35502	76.24949	26.35477	76.24908	26.35566	76.24924	26.35465	76.24901	26.35554	76.24917	26.35444	76.24894	26.35533	76.2491	26.35473	76.24896	26.35562	76.24911
NH148N	248000	248100	100		26.35501	76.24937	26.35412	76.24921	26.35498	76.24941	26.35409	76.24924	26.35501	76.24944	26.35412	76.24928	26.35502	76.24949	26.35413	76.24933	26.35387	76.24891	26.35477	76.24908	26.35376	76.24885	26.35465	76.24901	26.35355	76.24878	26.35444	76.24894	26.35384	76.24879	26.35473	76.24896
NH148N	248100	248200	100		26.35412	76.24921	26.35323	76.24905	26.35409	76.24924	26.3532	76.24908	26.35412	76.24928	26.35323	76.24912	26.35413	76.24933	26.35324	76.24917	26.35298	76.24875	26.35387	76.24891	26.35287	76.24869	26.35376	76.24885	26.35266	76.24862	26.35355	76.24878	26.35295	76.24863	26.35384	76.24879
`

onMounted(() => {
  const lines = csvDataString.trim().split('\n')
  const dataRows = lines.slice(1) // Skip header row

  const allLanesPolylines = []
  const laneIndices = [
    [5, 6, 7, 8], // L1: StartLat, EndLon, EndLat, StartLon
    [9, 10, 11, 12], // L2
    [13, 14, 15, 16], // L3
    [17, 18, 19, 20], // L4
    [21, 22, 23, 24], // R1
    [25, 26, 27, 28], // R2
    [29, 30, 31, 32], // R3
    [33, 34, 35, 36], // R4
  ]

  laneIndices.forEach((indices) => {
    const currentLaneCoordinates = []
    dataRows.forEach((rowString, rowIndex) => {
      const values = rowString.split('\t')

      const segmentStartLat = parseFloat(values[indices[0]])
      const segmentEndLon = parseFloat(values[indices[1]])
      const segmentEndLat = parseFloat(values[indices[2]])
      const segmentStartLon = parseFloat(values[indices[3]])

      // For the first segment of a lane, add the start point.
      // For subsequent segments, the end point of the previous segment is the start point.
      // So we only need to add the start point of the very first segment, and then all end points.
      if (rowIndex === 0) {
        currentLaneCoordinates.push([segmentStartLon, segmentStartLat])
      }
      currentLaneCoordinates.push([segmentEndLon, segmentEndLat])
    })
    if (currentLaneCoordinates.length > 0) {
      allLanesPolylines.push(currentLaneCoordinates)
    }
  })
  polylineCoordinates.value = allLanesPolylines
})
</script>
