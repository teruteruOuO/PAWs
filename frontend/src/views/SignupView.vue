<template>
<main id="signup-view">
    <div>
        <button @click="router.go(-1)">
            ← Go Back
        </button>
    </div>
    <VerifyEmailComponent v-if="currentComponentName === 'VerifyEmailComponent'" @email-verified="switchComponent('EnterCodeComponent')" />
    <EnterCodeComponent v-else-if="currentComponentName === 'EnterCodeComponent'" @code-verified="switchComponent('SignupFormComponent')" />
    <SignupFormComponent v-else-if="currentComponentName === 'SignupFormComponent'" @signup-verified="switchComponent('VerifyEmailComponent')" />
</main> 
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useUserStore } from '@/stores/user';
import VerifyEmailComponent from '@/components/signup/VerifyEmailComponent.vue';
import EnterCodeComponent from '@/components/signup/EnterCodeComponent.vue';
import SignupFormComponent from '@/components/signup/SignupFormComponent.vue';

const router = useRouter();
const user = useUserStore();

/* Component switching */
// Retrieve stored component or default to VerifyEmailComponent
const storedComponent = localStorage.getItem('selectedSignupComponent') || 'VerifyEmailComponent';
const currentComponentName  = ref(storedComponent);

// Function to switch components and store selection
const switchComponent = (componentName) => {
    currentComponentName.value = componentName;
    localStorage.setItem('selectedSignupComponent', componentName);
};

// Ensure selected component persists on page reload
onMounted(() => {
    const savedComponent = localStorage.getItem('selectedSignupComponent');
    const validComponents = ['VerifyEmailComponent', 'EnterCodeComponent', 'SignupFormComponent'];

    if (savedComponent && validComponents.includes(savedComponent)) {
        currentComponentName.value = savedComponent;
    } else {
        currentComponentName.value = 'VerifyEmailComponent'; // fallback to default
    }
});

/* Track when user cancels sign up process */
// Clear email from Pinia store
const clearEmailAndReset = () => {
    console.log("Clearing email.signup from Pinia store...");
    user.emailVerification.signup = "";
    switchComponent(VerifyEmailComponent);
};

// Delete user email from backend (Regular API Call)
const deleteUserEmail = async () => {
    try {
        const email = user.emailVerification.signup;

        if (email) {
            console.log(`Deleting user email: ${user.emailVerification.signup}`);
            const response = await axios.delete(`/api/user/signup`, { data: { email } });
            console.log(response.data.message);
        }

    } catch (err) {
        console.error('An error occurred while deleting the user email.');
        if (err.response) {
            console.error(err.response.data.message);
            alert(err.response.data.message);
        } else {
            console.error(err);
        }
    }
};

// Trigger DELETE API before leaving the route
onBeforeRouteLeave(async (to, from, next) => {
    if ((currentComponentName.value == 'VerifyEmailComponent') || !user.emailVerification.signup  ) {
        console.log("No email signup found in the local storage. Skipping onBeforeRouteLeave");
        next(); // Allow navigation without running the deletion process
        return;
        
    } else {
        const answer = window.confirm("Are you sure you want to leave? Your progress will be lost.");

        if (!answer) {
            console.log("User cancelled navigation.");
            next(false); // Prevents navigation if the user cancels the prompt
            return;
        }

        // Proceed with email deletion if user confirms leaving
        await deleteUserEmail();
        clearEmailAndReset();
        next(); // Continue navigation
    }
});
</script>

<style scoped>
</style>