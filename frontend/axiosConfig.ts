import axios from 'axios';

// Function to set up Axios with authentication
export const setupAxios = (email: string | null, password: string | null) => {
    // Set default configuration for all requests
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = 'http://localhost:5000';

    // Remove any existing Authorization header
    delete axios.defaults.headers.common['Authorization'];

    // If email and password are provided, set the Authorization header
    if (email && password) {
        const authString = `${email}:${password}`;
        const encodedAuth = btoa(authString);
        axios.defaults.headers.common['Authorization'] = `Basic ${encodedAuth}`;
    }

    // Add a response interceptor to handle 401 Unauthorized errors
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                console.error('Unauthorized access - redirecting to login');
                window.dispatchEvent(new Event('unauthorized'));
            }
            return Promise.reject(error);
        }
    );
};