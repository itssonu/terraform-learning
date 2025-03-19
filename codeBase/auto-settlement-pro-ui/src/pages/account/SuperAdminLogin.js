import Constants from "../../Constants";
import LoginForm from "../LoginForm";


const SuperAdminLogin = () => {
    return <LoginForm apiUrl={Constants.ApiUrl.auth.superAdminSignin} redirectPath="/super/dashboard" />;
}

export default SuperAdminLogin;