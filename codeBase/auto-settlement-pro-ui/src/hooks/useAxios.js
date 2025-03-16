import { useState, useCallback } from "react";
import { deleteRequest, getRequest, postRequest, putRequest } from "../utils/axiosClient";

const useAxios = (defaultConfig) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Generalized request handler
    const handleRequest = useCallback(async (requestFn, url, data = null, config = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            config = {...config, ...defaultConfig}
            const response = await requestFn(url, data, config);
            return response.data;
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || 'Internal server error';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getData = useCallback((url, config) => handleRequest(getRequest, url, config), [handleRequest]);
    const postData = useCallback((url, data, config) => handleRequest(postRequest, url, data, config), [handleRequest]);
    const putData = useCallback((url, data, config) => handleRequest(putRequest, url, data, config), [handleRequest]);
    const deleteData = useCallback((url, data, config) => handleRequest(deleteRequest, url, data, config), [handleRequest]);

    return {
        isLoading,
        error,
        getData,
        postData,
        putData,
        deleteData,
        setIsLoading,
    };
};

export default useAxios;
