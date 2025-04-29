<template>
<section id="login-component">
    <form @submit.prevent="loginUser()">
        <ul>
            <li>
                <label for="username-login">Username: </label>
                <input type="text" name="username-login" id="username-login" v-model="userInputCredentials.username" required>
            </li>
            <li class="feedback error">
                <p>{{ feedback.message }}</p>
            </li>
            <li>
                <label for="password-login">Password: </label>
                <input type="password" name="password-login" id="password-login" v-model="userInputCredentials.password" required>
            </li>
            <li>
                <p><RouterLink :to="{ name: 'password-recovery' }">Forgot Password?</RouterLink></p>
                <p><RouterLink :to="{ name: 'signup' }">Sign Up</RouterLink></p>
            </li>
            <li>
                <button type="submit" :disabled="isLoadingLogin" :class="{ 'button-loading': isLoadingLogin}">
                    <span v-if="!isLoadingLogin">Login</span>
                    <span v-else>Logging in...</span>
                </button>
            </li>
        </ul>
    </form>
</section>
</template>

<script setup>
import axios from 'axios';
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

// Initialize variables
const router = useRouter(); 
const user = useUserStore();
const isLoadingLogin = ref(false);
const feedback = reactive({
    message: '',
    success: ''
});
const userInputCredentials = reactive({
    username: '',
    password: ''
});

// Login the user and redirect them to the dashboard page
const loginUser = async (req, res) => {
    console.log(`Logging in user ${userInputCredentials.username}`);
    isLoadingLogin.value = true;

    try {
        const body = {
            username: userInputCredentials.username,
            password: userInputCredentials.password
        }
        const response = await axios.post(`/api/user/login`, body);
        console.log(response.data.message);

        // Store the user's ID in the local storage and send them to the dashboard page
        user.userIdentity.id = response.data.userID;
        user.userIdentity.role = response.data.role;
        router.push({ name: 'dashboard' });

    } catch (err) {
        console.error(`An error occured in LoginComponent.vue`);
        if (err.response) {
            console.error(err.response.data.message);
            feedback.message = err.response.data.message;
            feedback.success = false;
        } else {
            console.error(err);
        }

    } finally {
        isLoadingLogin.value = false;

    }
}
</script>

<style scoped>
</style>