<template>
<section id="login-logo-component">
    <img 
    src="/images/smiling-cat.png" 
    alt="Smiling Cat Logo">
    <h1 v-if="isMobile">PAWS IMS</h1>
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
const isMobile = computed(() => windowWidth.value <= 1024);

onMounted(() => {
    window.addEventListener('resize', updateWidth);
});

onUnmounted(() => window.removeEventListener('resize', updateWidth));
</script>

<style scoped>
/* Phone Vertical */

img {
    display: block;
    inline-size: 314px;
    block-size: 237px;
    margin-inline-start: auto;
    margin-inline-end: auto;
    /* background-color: rgb(252, 137, 252); */
}

h1 {
    font-size: 4.0625rem;
    /* background-color: rgb(255, 215, 255); */
    text-align: center;
}

/* Phone Horizontal */
@media screen and (min-width: 667px) and (max-height: 430px) {
    img {
        inline-size: 231px;
        block-size: 174px;
    }
}
</style>

