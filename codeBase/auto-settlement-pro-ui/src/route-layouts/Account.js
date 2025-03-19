import React from "react";
import { Outlet } from "react-router-dom";
const companyLogo = require("../assets/images/logo-white.png");

const Account = (props) => {
    return <>
        <div className="content-wrapper" style={{ minHeight:"100vh",justifyContent: 'center' }}>
            <div style={{maxWidth: "550px",width:"100%", margin : "0 auto"}} >
                <div className='text-center'>
                    <img src={companyLogo} className="img-fluid" alt="company-logo" style={{  marginBottom: '45px' }} />
                </div>
                <div className='from-wrap case-form'>
                    <div className="login-form">
                        <Outlet />
                    </div>
                </div>
            </div> 
        </div> 
    </>
}

export default Account;