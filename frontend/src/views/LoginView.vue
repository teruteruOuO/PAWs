<template>
<main id="login-view">
    <LoginLogoComponent />
    <LoginComponent />
</main>
</template>

<script setup>
import LoginComponent from '@/components/login/LoginComponent.vue';
import LoginLogoComponent from '@/components/login/LoginLogoComponent.vue';
</script>

<style scoped>
/* Phone (Vertical) */
main {
    /* Flex parent */
    display: flex;
    flex-direction: column;

    /* Layout */
    margin-block-start: 50px;
}
</style>