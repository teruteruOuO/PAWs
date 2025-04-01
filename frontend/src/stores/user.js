import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const userID = ref('');
    const resetUserStore = () => {
        userID.value = '';
        localStorage.removeItem('user');
    }

    return { userID, resetUserStore }
}, { persist: { enabled: true } });