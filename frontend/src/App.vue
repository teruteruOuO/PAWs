<template>
    <HeaderComponent v-if="isLoggedIn" />
    <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router';
import HeaderComponent from './components/HeaderComponent.vue';
import { useUserStore } from './stores/user';
import { computed } from 'vue';

const user = useUserStore();
const isLoggedIn = computed(() => {
    return user.userID ? true : false
});
</script>