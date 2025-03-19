import { useEffect, useState } from "react";

import axios from 'axios';

import AppConfig from "./AppConfig";

const ApiTestComponent = () => {

    const [apiResponse, setApiResponse] = useState("Api Test is running!!!");

    useEffect(() => {
        testApi();
    },[])

    const testApi = () => {

        const url = `${AppConfig.ApiBaseUrl}/message`;
        axios.get(url).then(resp => {
            setApiResponse(resp.data.message);
        }).catch(err => {
            setApiResponse(JSON.stringify(err));
        })
    }

  return (<>{apiResponse}</>);
}

export default ApiTestComponent;