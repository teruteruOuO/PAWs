import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const username = ref('');
    const settings = reactive({
        page_mode: "",
        currency_sign: "",
        currency_code: ""
    });

    const resetUserStore = () => {
        username.value = "";
        settings.page_mode = "";
        settings.currency_sign = "";
        settings.currency_code = "";
    }

    // Forgot password email being stored in the local storage for easy access in case verification code must be resent
    const email = ref('');

    return { username, settings, resetUserStore }
}, { persist: { enabled: true } });