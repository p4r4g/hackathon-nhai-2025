<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <div>National Highway Authority of India</div>
        <q-img src="/nhai-logo.png" style="width: 40px" class="q-ma-sm"></q-img>
        <q-space />

        <q-toolbar-title>Live Network Survey Vehicle</q-toolbar-title>
        <q-space />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Home',
    caption: 'Dashboard',
    icon: 'home',
    link: '/',
  },
  {
    title: 'Settings',
    caption: 'Threshold Settings',
    icon: 'settings',
    link: '/settings',
  },
  {
    title: 'Github',
    caption: 'Source Code',
    icon: 'code',
    link: 'https://github.com/p4r4g/hackathon-nhai-2025',
    isExternal: true,
  },
  {
    title: 'Start Small Sample',
    caption: 'Feed NHAI NSV Data',
    icon: 'play_arrow',
    link: 'https://n8n.barangale.in/webhook/feed_nhai_nsv_data_smallset',
    isExternal: true,
  },
  {
    title: 'Start Large Sample',
    caption: 'Feed NHAI NSV Data (Large)',
    icon: 'play_arrow',
    link: 'https://n8n.barangale.in/webhook/feed_nhai_nsv_data',
    isExternal: true,
  },
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
