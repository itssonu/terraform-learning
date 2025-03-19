import React, { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import DialogBox from "../components/common/DialogBox";
import useAxios from "../hooks/useAxios";
import Constants from "../Constants";
const eastonLogo = require("../assets/images/login-logo.png");

const SuperAdminLayout = (props) => {

    const navigate = useNavigate();
    const loggedInUserDetailsSubscriber = useRef(null);
    const [profilePictureImageUrl, setProfilePictureImageUrl] = useState("");
    const [open, setOpen] = useState(false)
    const { postData } = useAxios()

    useEffect(() => {
        if (window.location.pathname === '/') {
            navigate('/Companies');
        }
        const loggedInUser = AuthService.GetLoggedInUserData();
        setProfilePictureImageUrl(loggedInUser.profileImageUrl);
        registerLoggedInUserDetailsSubscriber();

        return () => {
            loggedInUserDetailsSubscriber.current.unsubscribe();
        }

    }, [])



    const registerLoggedInUserDetailsSubscriber = () => {
        loggedInUserDetailsSubscriber.current = AuthService.LoggedInUserDetails.subscribe(value => {
            const imageUrl = value.profileImageUrl;
            setProfilePictureImageUrl(imageUrl);
        })
    }

    const Islogout = () => {
        postData(Constants.ApiUrl.logout.logout).then((res) => {
            // LoggedInUserService.UpdateLoggedInUserSession(res?.data?.token);
            localStorage.clear();
            if (window.location.hostname === "master.demandpro.law") {
                navigate('/account/SAlogin');
            } else if (window.location.hostname !== "master.demandpro.law") {
                navigate('/account/login');
            }
            console.log(res, "res in the add companies");
        }).catch(err => {

        })
    }
    return <>

        <TopNavBar
            profileImageUrl={profilePictureImageUrl}
            open={open} setOpen={setOpen}
            navigate={navigate}
            Islogout={Islogout}
        />
        {/* Home Routes render section */}
        <Outlet />
    </>
}

const TopNavBar = ({ profileImageUrl, open, setOpen, Islogout, navigate }) => <nav className="navbar navbar-expand-lg bg-body-tertiary">
    <div className="container">

        <NavLink className="nav-link super-nav" to="/super/dashboard">
            <img alt="Company-Logo" src={eastonLogo} className="navbar-brand img-fluid" />
        </NavLink>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

                <li className="nav-item">
                    <NavLink className="nav-link" to="/super/dashboard">Dashboard</NavLink>
                </li>

                <li className="nav-item">
                    <NavLink className="nav-link" to="/super/companies">Companies</NavLink>
                </li>

                <li className="nav-item">
                    <NavLink className="nav-link" to="/super/users">Users</NavLink>
                </li>
                {/* <li className="nav-item">
                    <NavLink className="nav-link" to="pdf-converter">Converter</NavLink>
                </li> */}

                <li className="nav-item profile">
                    <NavLink className="nav-link" to="profile">My Profile
                        <img alt="" src={profileImageUrl} className="img-fluid" />
                    </NavLink>
                </li>
                <li className="nav-item">
                    <DialogBox text="Logout" description={'Are you sure want to Logout'} open={open} handleClickOpen={() => setOpen(true)} handleSubmit={() => {
                        Islogout()
                    }} handleClose={() => setOpen(false)} />
                </li>
            </ul>
        </div>
    </div>
</nav>

export default SuperAdminLayout;