import Constants from "../../Constants";
import LoginForm from "../LoginForm";

const Login = () => {
    return <LoginForm apiUrl={Constants.ApiUrl.auth.sigin} redirectPath="/cases" />;
}

export default Login;