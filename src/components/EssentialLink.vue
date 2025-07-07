<template>
  <q-item
    clickable
    :tag="props.handler ? 'div' : props.isExternal ? 'a' : 'router-link'"
    :target="props.isExternal ? '_blank' : '_self'"
    :href="props.isExternal ? props.link : undefined"
    :to="!props.isExternal ? props.link : undefined"
    @click="props.handler ? props.handler() : null"
  >
    <q-item-section v-if="props.icon" avatar>
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.title }}</q-item-label>
      <q-item-label caption>{{ props.caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },

  caption: {
    type: String,
    default: '',
  },

  link: {
    type: String,
    default: '#',
  },

  icon: {
    type: String,
    default: '',
  },
  isExternal: {
    type: Boolean,
    default: false,
  },
  handler: {
    type: Function,
    default: null,
  },
})
</script>
