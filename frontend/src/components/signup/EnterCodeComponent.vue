<template>
<section id="enter-code-component">
    <h1>Enter Code</h1>
    <form @submit.prevent="verifyCode()">
        <ul>
            <li>
                <label for="code-signup">Verification Code: </label>
                <input type="text" name="code-signup" id="code-signup" v-model="code" maxlength="6" required>
            </li>
            <li>
                <p class="feedback fail">{{ feedback.message }}</p>
            </li>
            <li>
                <button type="submit" :disabled="isLoadingVerifyCode" :class="{ 'button-loading': isLoadingVerifyCode}">
                    <span v-if="!isLoadingVerifyCode">Verify Code</span>
                    <span v-else>Verifying...</span>
                </button>
            </li>
            <li>
                <button type="button" @click="resendCode()" :disabled="isLoadingResendCode" :class="{ 'button-loading': isLoadingResendCode}">
                    <span v-if="!isLoadingResendCode">Resend Code</span>
                    <span v-else>Resending...</span>
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
const code = ref('');
const isLoadingVerifyCode = ref(false);
const isLoadingResendCode = ref(false);
const feedback = reactive({
    message: '',
    success: ''
});
const emit = defineEmits(['code-verified']);

// Resend code to the user
const resendCode = async (req, res) => {
    isLoadingResendCode.value = true;

    try {
        const response = await axios.post(`/api/user/signup/resend-code`, { email: user.emailVerification.signup.replace(/\s+/g, ' ').trim().toLowerCase() } );
        console.log(response.data.message);
        feedback.message = response.data.message;
        feedback.success = true;

    } catch (err) {
        console.error(`An error occured in EnterCodeComponent.vue`);
        if (err.response) {
            console.error(err.response.data.message);
            feedback.message = err.response.data.message;
            feedback.success = false;
        } else {
            console.error(err);
        }

    } finally {
        isLoadingResendCode.value = false;
    }
}

// Verify code
const verifyCode = async () => {
    isLoadingVerifyCode.value = true;

    try {
        const body = {
            code: code.value,
            email: user.emailVerification.signup
        }
        const response = await axios.post(`/api/user/signup/verify-code`, body);
        code.value = "";
        console.log(response.data.message);

        // Emit event to parent to switch component
        emit('code-verified');

    } catch (err) {
        console.error(`An error occured in EnterCodeComponent.vue`);
        if (err.response) {
            console.error(err.response.data.message);
            feedback.message = err.response.data.message;
            feedback.success = false;
        } else {
            console.error(err);
        }

    } finally {
        isLoadingVerifyCode.value = false;
    }
}

</script>