<template>
<section id="logout-component">
    <button @click="logoutUser">Logout of the Account</button>
</section>
</template>

<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

// Initialize Variables
const router = useRouter();
const user = useUserStore();

// Logout use after clicking the button
const logoutUser = async () => {
    console.log(`Logging out user`);

    const response = await axios.post('/api/user/logout');
    console.log(response.data.message);

    user.resetUserStore();
    router.push({ name: 'login' });
}
</script>