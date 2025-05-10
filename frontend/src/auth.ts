import CryptoJS from 'crypto-js';
import axios, { AxiosInstance } from 'axios';

type AuthData = {
    email: string;
    refreshToken: string;
    expiresAt: number;
};

type AuthCredentials = {
    email: string;
    password: string;
};

const CRYPTO_SECRET = import.meta.env.VITE_CRYPTO_SECRET;
let authCredentials: AuthCredentials | null = null;

// Encryption utilities
const encryptData = (data: AuthData): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), CRYPTO_SECRET).toString();
};

const decryptData = (ciphertext: string): AuthData | null => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, CRYPTO_SECRET);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
};

// Session management
const storeAuthSession = (data: AuthData): void => {
    sessionStorage.setItem('authSession', encryptData(data));
};

const clearAuthSession = (): void => {
    sessionStorage.removeItem('authSession');
    authCredentials = null;
};

// Axios instance configuration
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth headers
api.interceptors.request.use(config => {
    if (authCredentials) {
        config.auth = {
            username: authCredentials.email,
            password: authCredentials.password
        };
    }
    return config;
});

// Response interceptor for session management
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const sessionData = sessionStorage.getItem('authSession');
            if (!sessionData) {
                clearAuthSession();
                return Promise.reject(error);
            }

            const decrypted = decryptData(sessionData);
            if (!decrypted) {
                clearAuthSession();
                return Promise.reject(error);
            }

            try {
                // Refresh token flow
                const refreshResponse = await axios.post(
                    '/refresh-token',
                    { refreshToken: decrypted.refreshToken },
                    {
                        baseURL: import.meta.env.VITE_API_URL,
                        withCredentials: true,
                        auth: {
                            username: decrypted.email,
                            password: decrypted.refreshToken
                        }
                    }
                );

                // Update credentials
                authCredentials = {
                    email: refreshResponse.data.email,
                    password: decrypted.refreshToken
                };

                // Update session storage
                storeAuthSession({
                    ...decrypted,
                    expiresAt: Date.now() + 3600 * 1000 // 1 hour expiration
                });

                return api(originalRequest);
            } catch (refreshError) {
                clearAuthSession();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Login handler
const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
        authCredentials = { email, password };

        const response = await api.post('/login', {
            email,
            password
        });

        storeAuthSession({
            email: response.data.email,
            refreshToken: response.data.refreshToken,
            expiresAt: Date.now() + 3600 * 1000 // 1 hour expiration
        });

        window.location.href = '/dashboard';
    } catch (error) {
        clearAuthSession();
        throw new Error('Login failed');
    }
};

// Auto-check session on load
window.addEventListener('load', () => {
    const sessionData = sessionStorage.getItem('authSession');
    if (sessionData) {
        const decrypted = decryptData(sessionData);
        if (decrypted && decrypted.expiresAt > Date.now()) {
            authCredentials = {
                email: decrypted.email,
                password: decrypted.refreshToken
            };
        } else {
            clearAuthSession();
        }
    }
});

export { api, handleLogin, clearAuthSession };