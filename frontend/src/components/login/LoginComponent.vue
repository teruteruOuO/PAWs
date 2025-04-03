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
        if (err.response) {
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
@media screen and (min-width: 667px) and (min-height: 430px) {
    li:nth-child(1) *, li:nth-child(3) *, li:nth-child(5) * {
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

/* Tablet */
@media screen and (min-width: 768px) and (min-height: 600px) {
    li:nth-child(1) *, li:nth-child(3) *, li:nth-child(5) * {
        font-size: 3.75rem;
    }

    li:nth-child(2) *, li:nth-child(4) * {
        font-size: 2.5rem;
        
    }

    li:nth-child(2), li:nth-child(4) {
        margin-block-end: 40px;
    }

    input {
        text-align: center;
        border-radius: 50px;
        inline-size: 439px;
        block-size: 79px;
    }
    
    button {
        font-size: 3.75rem;
        inline-size: 393px;
        block-size: 79px;
    }

    input, button * {
        font-size: 1.875rem;
    }
}

@media screen and (min-width: 1366px) {
    /* Grid parent */
    ul {
        display: grid; /* Switch from flex to grid */
        grid-template-columns: repeat(2, 1fr); /* Customize as needed */
        max-inline-size: 1600px;
        grid-template-areas: 
        "on on"
        ".  tw"
        "th th"
        ".  fo"
        "fi fi";
    }

    ul > li {
        /* Reset potential flex styling from earlier */
        display: block;
        text-align: initial;
        justify-content: initial;
        align-items: initial;
    }

    /* Naming each children */
    li:nth-child(1) {
        grid-area: on
    }

    li:nth-child(2) {
        grid-area: tw
    }
    
    li:nth-child(3) {
        grid-area: th
    }

    li:nth-child(4) {
        grid-area: fo
    }

    li:nth-child(5) {
        grid-area: fi
    }

    li:nth-child(1), li:nth-child(3) {
        display: flex;
        flex-direction: row;
        column-gap: 200px;
        justify-content: center;
        align-content: center;
    }


    li:nth-child(1) *, li:nth-child(3) *, li:nth-child(5) * {
        display: inline;
        font-size: 4.6875rem;
    }

    li:nth-child(1) input, li:nth-child(3) input {
        inline-size: 635px;
        block-size: 100px;
        font-size: 3.5rem;
        text-align: left;
    }

    /* Center the button */
    li:nth-child(5) {
        display: flex;
        justify-content: center;
        align-content: center;
    }

    button {
        display: block;
        inline-size: 635px;
        block-size: 100px;
        font-size: 3.5rem;
        text-align: center;
        border-width: 10px;
    }
    /* Center button end */

    li:nth-child(2), li:nth-child(4) {
        margin-block-end: 40px; /* Reset margin if needed */
    }

    li:nth-child(2) *, li:nth-child(4) * {
        display: block; /* override flex */
        text-align: left;
        justify-content: initial; /* optional reset */
    }
    
}
</style>