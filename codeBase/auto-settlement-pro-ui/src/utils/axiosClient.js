import axios from 'axios';
import { deleteCookie, getAuthtoken } from '../utils/helper';
import AppConfig from '../AppConfig';

// Create an Axios instance
const apiClient = axios.create({
    baseURL: AppConfig.ApiBaseUrl,
    timeout: 10000,
    withCredentials: true,
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        if (!config.skipAuth) {
            const token = getAuthtoken();
            if (token) {
                const decrytedToken = token
                config.headers['Authorization'] = `Bearer ${decrytedToken}`;
            }
        }

        if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                deleteCookie(name);
            });

            localStorage.clear();
            // todo call logout service
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


// Method for handling GET requests
export const getRequest = (url, config = {}) => {
    return apiClient.get(url, config);
};

// Method for handling POST requests
export const postRequest = (url, data, config = {}) => {
    return apiClient.post(url, data, config);
};
// Method for handling PUT requests (for editing)
export const putRequest = (url, data, config = {}) => {
    return apiClient.put(url, data, config);
};
//Method for handling DELETE requests
export const deleteRequest = (url, config = {}) => {
    return apiClient.delete(url, config);
};


export default apiClient;
