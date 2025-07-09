<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <div class="gt-md">National Highway Authority of India</div>
        <div class="lt-md">NHAI</div>
        <q-img src="/nhai-logo.png" style="width: 40px" class="q-ma-sm"></q-img>
        <q-space />

        <q-toolbar-title class="gt-sm">Live Network Survey Vehicle</q-toolbar-title>
        <q-toolbar-title class="lt-md">Live NSV</q-toolbar-title>

        <q-space />
        <q-btn
          href="https://github.com/p4r4g/hackthon-nhai-2025"
          target="_blank"
          :label="$q.screen.gt.xs ? 'Github' : ''"
          icon="code"
        />
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-blue-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>
