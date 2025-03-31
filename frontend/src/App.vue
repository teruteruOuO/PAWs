<template>
    <HeaderComponent />
    <RouterView />
    <FooterComponent />
</template>

<script setup>
import { RouterView } from 'vue-router';
import HeaderComponent from './components/HeaderComponent.vue';
import FooterComponent from './components/FooterComponent.vue';
</script>