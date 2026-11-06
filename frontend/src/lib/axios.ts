import Axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// Automatically handle both port 8000 and 8080
const defaultPort = import.meta.env.VITE_BACKEND_PORT || '8080';
let activeBaseURL = import.meta.env.VITE_API_URL || `http://localhost:${defaultPort}/api/v1`;

const axios = Axios.create({
    baseURL: activeBaseURL,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
    },
    withCredentials: true,
});

// Helper to fetch the Sanctum CSRF cookie from the active backend host
export const getCsrfCookie = async () => {
    const backendRoot = activeBaseURL.replace(/\/api\/v1\/?$/, '');
    return Axios.get(`${backendRoot}/sanctum/csrf-cookie`, { withCredentials: true });
};

// Automatic port failover interceptor (8080 <-> 8000)
axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as (InternalAxiosRequestConfig & { __isPortRetry?: boolean }) | undefined;

        // If network connection failed (server not listening on this port) and not already retried
        if (!error.response && config && !config.__isPortRetry) {
            const currentPort = activeBaseURL.includes('8080') ? '8080' : '8000';
            const alternativePort = currentPort === '8080' ? '8000' : '8080';
            activeBaseURL = activeBaseURL.replace(`:${currentPort}`, `:${alternativePort}`);
            axios.defaults.baseURL = activeBaseURL;
            config.baseURL = activeBaseURL;
            config.__isPortRetry = true;

            console.warn(`[Axios] Connection failed on port ${currentPort}. Retrying on alternative port ${alternativePort}...`);
            return axios(config);
        }

        return Promise.reject(error);
    }
);

export default axios;
