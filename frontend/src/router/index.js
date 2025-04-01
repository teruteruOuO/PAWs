import { createRouter, createWebHistory } from "vue-router";
import LoginView from '../views/LoginView.vue';
import { authorizeToken } from "@/assets/misc-scripts/authorize-token";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/password-recovery',
            name: 'password-recovery',
            component: () => import('../views/PasswordRecoveryView.vue')
        },
        {
            path: '/',
            name: 'dashboard',
            meta: { requiresAuth: true },
            component: () => import('../views/HomeView.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: { name: 'home' }
        }
    ]
});

// This is triggered each time a user navigates from page to page
router.beforeEach(async (to, from, next) => {
    const isLoggedIn = await authorizeToken();

    // Redirect to home when accessing login or sign up pages when user is already logged in
    if ((to.name === 'login' || to.name === 'password-recovery') && isLoggedIn) {
        next({ name: 'dashboard' });
    }

    // Redirect if trying to access a protected route without being logged in
    else if (to.meta.requiresAuth && !isLoggedIn) {
        next({ name: 'login' });
    } 

    // Allow navigation if no redirects are needed
    else {
        next();
    }
});

export default router
