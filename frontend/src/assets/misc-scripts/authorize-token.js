import axios from "axios";
import { useUserStore } from "@/stores/user";

// Determine a user's authority for accessing each webpage before they can continue
export const authorizeToken = async () => {
    const user = useUserStore();

    try {
        const response = await axios.get('/api/user/verify-token');
        console.log(response.data.message);
        return true;

    } catch (err) {
        // Automatically log out the user if there's an authorization issue (ex: expired token)
        if (err.response && err.response.status === 401) {
            if (err.response.data.expired) {
                alert(err.response.data.message);
            }

            console.warn(err.response.data.message);
            user.resetUserStore();
        }

        return false;
    }
}