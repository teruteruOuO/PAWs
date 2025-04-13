<template>
<section id="verify-email-component">
    <h1>Enter your Email</h1>
    <form @submit.prevent="sendEmail()">
        <ul>
            <li>
                <label for="email-signup">Email: </label>
                <input type="email" name="email-signup" id="email-signup" v-model="user.emailVerification.signup" required>
            </li>
            <li>
                <p class="feedback fail">{{ feedback.message }}</p>
            </li>
            <li>
                <button type="submit" :disabled="isLoadingSignup" :class="{ 'button-loading': isLoadingSignup}">
                    <span v-if="!isLoadingSignup">Verify Email</span>
                    <span v-else>Sending Code...</span>
                </button>
            </li>
        </ul>
    </form>
</section> 
</template>

<script setup>
import axios from 'axios';
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/user';

const user = useUserStore();
const isLoadingSignup = ref(false);
const feedback = reactive({
    message: '',
    success: ''
});
const emit = defineEmits(['email-verified']);

const sendEmail = async () => {
    isLoadingSignup.value = true;

    try {
        const response = await axios.post(`/api/user/signup/verify-email`, { email: user.emailVerification.signup.replace(/\s+/g, ' ').trim().toLowerCase() });
        console.log(response.data.message);
        user.emailVerification.signup = response.data.email;

        // Emit event to parent to switch component
        emit('email-verified');

    } catch (err) {
        console.error(`An error occured in VerifyEmailComponent.vue`);
        if (err.response) {
            console.error(err.response.data.message);
            feedback.message = err.response.data.message;
            feedback.success = false;
        } else {
            console.error(err);
        }

    } finally {
        isLoadingSignup.value = false;

    }
}

</script>


<style scoped>
</style>