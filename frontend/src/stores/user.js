import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const userIdentity = reactive({
        id: 0,
        role: ''
    });
    const emailVerification = reactive({
        forgot_password: '',
        signup: ''
    });

    const resetUserStore = () => {
        userIdentity.id = '';
        userIdentity.role = '';
    }

    return { userIdentity, emailVerification, resetUserStore }
}, { persist: { enabled: true } });