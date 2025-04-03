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
                <RouterLink :to="{ name: 'password-recovery' }">Forgot Password?</RouterLink>
            </li>
            <li>
                <button type="submit" :class="{ 'button-loading': isLoadingLogin}">
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
        user.userID = response.data.userID;
        router.push({ name: 'dashboard' });

    } catch (err) {
        console.error(`An error occured in LoginComponent.vue`);
        if (err.response.data.message) {
            console.error(err.response.data.message);
            feedback.message = err.response.data.message;
            feedback.success = false;
        }
        console.error(err);

    } finally {
        isLoadingLogin.value = false;
    }
}
</script>

<style scoped>
/* Phone Vertical */
section * {
    font-size: 2.5rem;
}

/* Force UL to take over FORM's precendece (FORM doesn't exist) */
form {
    display: contents;
}

ul {
    /* Flex parent */
    display: flex;
    flex-direction: column;
}

ul > * {
    text-align: center;
}

li:nth-child(1) *, li:nth-child(3) * {
    display: block; 
    margin-inline-start: auto;
    margin-inline-end: auto;
}

li:nth-child(2) *, li:nth-child(4) * {
    font-size: 1.5625rem; 
    display: flex;
    justify-content: center;     
}

li:nth-child(2), li:nth-child(4) {
    margin-block-end: 20px;
}

input {
    text-align: center;
}

/* Phone Horizontal */
@media screen and (min-width: 667px) and (max-height: 430px) {
    li:nth-child(1) *, li:nth-child(3) * {
        display: block; 
        font-size: 1.875rem;
    }

    li:nth-child(2) *, li:nth-child(4) * {
        font-size: 1.25rem;
        
    }

    input {
        text-align: center;
        inline-size: 264px;
        block-size: 55px;
    }

    input, button * {
        font-size: 1.875rem;
    }
}
</style>