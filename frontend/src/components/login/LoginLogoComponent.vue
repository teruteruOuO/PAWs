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
const isMobile = computed(() => windowWidth.value <= 1366);

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

/* Tablet */
@media screen and (min-width: 768px) and (min-height: 600px) {
    section {
        /* Flex parent */
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        column-gap: 40px;
    }

    img {
        inline-size: 325px;
        block-size: 245px;
    }

    h1 {
        font-size: 5rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}

/* Desktop */
@media screen and (min-width: 1366px) {
    /* Flex parent */
    section {
        max-inline-size: 1366px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    img {
        inline-size: 469px;
        block-size: 353px;
    }
}
</style>

