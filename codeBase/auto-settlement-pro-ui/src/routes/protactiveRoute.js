import { Navigate, Outlet, useLocation } from "react-router-dom";
import Constants from '../Constants';

const ProtectedRoute = ({ redirectPath }) => {
    const location = useLocation();
    console.log(window.location.hostname,"window.location.hostname"); 
    if (!Constants.getAuthtoken()?.isToken) {
       let  redirectPath = ""
        if(window.location.hostname === "master.demandpro.law") {
            redirectPath= '/account/SAlogin'
        } else if(window.location.hostname !== "master.demandpro.law") {
            redirectPath='/account/login'}
        return <Navigate to={redirectPath}
            replace
            state={{ from: location }} />;
    }
    return <Outlet />;
};
export default ProtectedRoute;