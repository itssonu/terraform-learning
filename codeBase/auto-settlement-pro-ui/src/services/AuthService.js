import { Subject } from 'rxjs'

import Constants from '../Constants';

export default class AuthService {

    static LoggedInUserDetails = new Subject();

    static UpdateLoggedInUserDetails = (data) => {
        this.LoggedInUserDetails.next(data);
    }

    static GetLoggedInUserData = () => {
        const token = Constants.getAuthtoken()?.token
        const parts = token.split('.');
        const payload = JSON.parse(window.atob(parts[1]));

        if (payload?.profilepic) {
            payload.profileImageUrl = window.atob(payload.profilepic);
        }
        return payload;
    }

    static UpdateLoggedInUserSession = (token) => {
        localStorage.setItem("authtoken", token);
        const updatedUserData = this.GetLoggedInUserData();
        this.UpdateLoggedInUserDetails(updatedUserData);
    }

}