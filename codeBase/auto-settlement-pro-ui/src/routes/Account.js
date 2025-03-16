import React from 'react'
import { Route, Routes } from 'react-router-dom';
import { Login, ForgotPassword, SuperAdminLogin } from '../pages/account'
import ChangePassword from '../pages/account/ChangePassword';

const Account = (props) => {
   
    return <Routes>
                <Route path="login" element={<Login />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="SAlogin" element={<SuperAdminLogin />} />
                <Route path="reset-password" element={<ChangePassword />} />
    </Routes>
}

export default Account;