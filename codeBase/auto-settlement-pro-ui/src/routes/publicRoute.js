import { Navigate, Outlet } from "react-router-dom";
import Constants from '../Constants';
const PublicRoute = ({ redirectPath = '/account/login' }) => {
    if (Constants?.getAuthtoken()?.isToken) {
        return <Navigate to={Constants?.getAuthtoken()?.isToken ? "/cases"  : redirectPath} replace />;
    }
    return <Outlet />;
};
export default PublicRoute;