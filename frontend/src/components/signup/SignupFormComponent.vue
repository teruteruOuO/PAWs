<template>
<section id="signup-form-component">
    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedback.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <h1>Sign up Form</h1>
        <form @submit.prevent="signupUser()">
            <ul>
                <li>
                    <label for="first-name-signup">First Name: </label>
                    <input type="text" name="first-name-signup" id="first-name-signup" v-model="signupInformation.name.first" placeholder="required" required>
                </li>
                <li>
                    <label for="last-name-signup">Last Name: </label>
                    <input type="text" name="last-name-signup" id="last-name-signup" v-model="signupInformation.name.last" placeholder="required" required>
                </li>
                <li>
                    <label for="initial-signup">Initial: </label>
                    <input type="text" name="initial-signup" id="initial-signup" minlength="1" maxlength="1" v-model="signupInformation.name.initial">
                </li>
                <li>
                    <label for="phone-signup">Phone: </label>
                    <input type="text" name="phone-signup" id="iphone-signup" maxlength="10" v-model="signupInformation.phone" @input="validatePhone" pattern="^\d{10}$">
                </li>
                <li>
                    <label for="address-signup">Address: </label>
                    <input type="text" name="address-signup" id="address-signup" v-model="signupInformation.location.address" placeholder="required" required>
                </li>
                <li>
                    <label for="city-signup">City: </label>
                    <input type="text" name="city-signup" id="city-signup" v-model="signupInformation.location.city" placeholder="required" required>
                </li>
                <li>
                    <label for="state-signup">State: </label>
                    <select name="city-signup" id="city-signup" v-model="signupInformation.location.state_code" required>
                        <option v-for="state in stateList" :key="state.code" :value="state.code">
                            {{ state.name }}
                        </option>
                    </select>
                </li>
                <li>
                    <label for="zip-signup">Zip: </label>
                    <input type="text" name="zip-signup" id="zip-signup" v-model="signupInformation.location.zip" @input="validateZip" pattern="^\d{5}$" maxlength="5" placeholder="Required" required>
                </li>
                <li>
                    <label for="username-signup">Username: </label>
                    <input type="text" name="username-signup" id="username-signup" v-model="signupInformation.credentials.username" placeholder="required" required>
                </li>
                <li>
                    <label for="password-signup">Password: </label>
                    <input type="password" name="password-signup" id="password-signup" v-model="signupInformation.credentials.password" placeholder="required" required>
                </li>
                <li>
                    <label for="confirm-password-signup">Confirm Password: </label>
                    <input type="password" name="confirm-password-signup" id="confirm-password-signup" v-model="signupInformation.credentials.confirm_password" placeholder="required" required>
                </li>
                <li>
                    <button type="submit" :disabled="isLoadingSignup" :class="{ 'button-loading': isLoadingSignup}">
                        <span v-if="!isLoadingSignup">Sign Up</span>
                        <span v-else>Signing up...</span>
                    </button>
                </li>
            </ul>
        </form>

        <section class="feedback">
            <p>{{ passwordRegExFeedback }}</p>
            <p>{{ confirmPasswordFeedback }}</p>
            <p :class="{ 'success': feedback.success, 'fail': !feedback.success }">{{ feedback.message }}</p>
        </section>
    </section>
    
</section>
</template>

<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { ref, reactive, computed, onMounted } from 'vue';

const router = useRouter();
const user = useUserStore();
const isLoadingPage = ref(false);
const isLoadingSignup = ref(false);
const retrieveResourcesFail = ref(false);
const emit = defineEmits(['signup-verified']);
const signupInformation = reactive({
    name: {
        first: '',
        last: '',
        initial: ''
    },
    location: {
        address: '',
        city: '',
        state_code: '',
        zip: ''
    },
    credentials: {
        username: '',
        password: '',
        confirm_password: ''
    },
    phone: ''
});
const feedback = reactive({
    message: '',
    success: ''
});
const stateList = ref();

/* Computed Variables */
// Informs user that their password must match the following criteria
// Contains at least one uppercase letter.
// Contains at least one lowercase letter.
// Contains at least one number.
// Contains at least one special character (@, #, $, %, etc.).
const passwordRegExFeedback = computed( () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (signupInformation.credentials.password && !passwordRegex.test(signupInformation.credentials.password)) {
        return "* Your password must contain at least one upper case and lowercase letters, one number, and one special character";
    } else {
        return null;
    }
});

// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (signupInformation.credentials.password && signupInformation.credentials.confirm_password) 
        && 
        (signupInformation.credentials.password !== signupInformation.credentials.confirm_password)
    ) {
        return "* Password and Confirm Password must match";
    } else {
        return null;
    }
});

// Ensure optional data like initial is always null when left empty 
const initial = computed(() => {
    if (signupInformation.name.initial === ""  || signupInformation.name.initial === " ") {
        return null
    } else {
        return signupInformation.name.initial
    }
});

const phone = computed(() => {
    if (signupInformation.phone === ""  || signupInformation.phone === " ") {
        return null
    } else {
        return signupInformation.phone
    }
});

/* Functions */
// Real-time ZIP code validation
const validateZip = () => {
    signupInformation.location.zip = signupInformation.location.zip.replace(/\D/g, '').slice(0, 5);
};
// Real-time Phone code validation
const validatePhone = () => {
    signupInformation.phone = signupInformation.phone.replace(/\D/g, '').slice(0, 10);
};

// Retrieve resources required for signup form
const retrieveResources = async () => {
    isLoadingPage.value = true;

    try {
        const response = await axios.get(`/api/state`);
        console.log(response.data.message);
        console.log(response.data.states);

        // Store the state code list
        stateList.value = response.data.states;

    } catch (err) {
        console.error(`An error occured in SignupFormComponent.vue`);
        retrieveResourcesFail = true;

        if (err.response) {
            console.error(err.response.data.message);
            feedback.message = err.response.data.message;
            feedback.success = false;
        } else {
            console.error(err);
        }
    } finally {
        isLoadingPage.value = false;
    }
}

// Sign up user
const signupUser = async() => {
    isLoadingSignup.value = true;

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value || passwordRegExFeedback.value) {
            console.error('Confirm Password and Password RegEx Feedback are not solved yet; therefore, sign up process will not continue');
            return;
        }

        // Send user input to the backend server to validate
        const body = {
            name: {
                first: signupInformation.name.first,
                initial: initial.value,
                last: signupInformation.name.last
            },
            location: {
                address: signupInformation.location.address,
                city: signupInformation.location.city,
                state_code: signupInformation.location.state_code,
                zip: String(signupInformation.location.zip)
            },
            credentials: {
                username: signupInformation.credentials.username,
                password: signupInformation.credentials.password
            },
            phone: phone.value,
            email: user.emailVerification.signup
        }

        const response = await axios.put(`/api/user/signup`, body);
        feedback.success = true;
        feedback.message = `${response.data.message}. You will be redirected to the Login page after 3 seconds.`;

        // Clear the Sign Up Form inputs
        signupInformation.credentials.username = "";
        signupInformation.credentials.password = "";
        signupInformation.credentials.confirm_password = "";
        signupInformation.location.address = "";
        signupInformation.location.city = "";
        signupInformation.location.state = "";
        signupInformation.location.zip = "";
        signupInformation.name.first = "";
        signupInformation.name.initial = "";
        signupInformation.name.last = "";
        signupInformation.phone = "";

        // Redirect after 3 seconds
        setTimeout(() => {
            // Clear email-sign up pinia store and revert it back to its original state
            user.emailVerification.signup = "";
            // Emit event to parent to switch component
            emit('signup-verified');
            router.push({ name: 'login' }); 
        }, 3 * 1000);

    } catch (err) {
        console.error(`An error occured in SignupFormComponent.vue`);
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

// Trigger retrieveResources function when the component loads
onMounted(async () => {
    await retrieveResources();
});
</script>