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
/* Phone Vertical */
main {
    /* Flex parent */
    display: flex;
    flex-direction: column;

    /* Layout */
    margin-block-start: 50px;
    margin-block-end: 50px;
}

/* Phone Horizontal */
@media screen and (min-width: 667px) and (max-height: 430px) {
    /* Flex parent */
    main {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        column-gap: 50px;
    }
}
</style>