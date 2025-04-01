<template>
<section id="login-logo-component">
    <img 
    src="/images/smiling-cat.png" 
    alt="Smiling Cat Logo">
    <h1 v-if="isPhone">PAWS IMS</h1>
    <h1 v-else>Paws & Whiskers Inventory Management System</h1>
</section> 
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Change text based on screen width
const windowWidth = ref(window.innerWidth);
const updateWidth = () => {
    windowWidth.value = window.innerWidth;
};

// Computed property for visibility based on width range
const isPhone = computed(() => windowWidth.value <= 667);

onMounted(() => {
    window.addEventListener('resize', updateWidth);
});

onUnmounted(() => window.removeEventListener('resize', updateWidth));
</script>

<style scoped>
section {
    background-color: aqua;
}

img {
    display: block;
}
</style>

