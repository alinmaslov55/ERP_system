import Axios from "axios";

// When running in development, relative URLs route through Vite's local proxy (/api and /sanctum),
// keeping everything on the same origin (localhost:5173). This completely eliminates
// cross-origin cookie blocking, domain mismatches, and CSRF token mismatches.
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const axios = Axios.create({
    baseURL: API_BASE,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Explicitly extract XSRF-TOKEN from document.cookie and set the X-XSRF-TOKEN header
axios.interceptors.request.use((config) => {
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
        if (match && match[1]) {
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
        }
    }
    return config;
});

// Helper to fetch the Sanctum CSRF cookie
export const getCsrfCookie = async () => {
    return axios.get('/sanctum/csrf-cookie', {
        baseURL: '', // hits /sanctum/csrf-cookie on the same origin via proxy
    });
};

export default axios;
