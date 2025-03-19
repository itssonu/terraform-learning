import React, { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import DialogBox from "../components/common/DialogBox";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/actions/users";
import { ConfirmationBox } from "../pages/admin";
import { routeName } from "../redux/actions/liabilty";
const eastonLogo = require("../assets/images/login-logo.png");

const Home = (props) => {
    const dispatch = useDispatch()

    const navigate = useNavigate();
    const loggedInUserDetailsSubscriber = useRef(null);
    const [profilePictureImageUrl, setProfilePictureImageUrl] = useState("");
    const [open, setOpen] = useState(false)
    const { isAdmin = false } = useSelector((state) => state.users || {});
    const [shouldRenderConfirmationBox, setShouldRenderConfrimationBox] = useState(false)
    const isCaseDataSaved = useSelector(state => state.isCaseSaved.isCaseSaved);
    const formikRef = useSelector(state => state.formikRefCapture.refData)
    const addCaseFormStep = useSelector(state => state.formikRefCapture.addCaseFormStep)


    useEffect(() => {
        if (window.location.pathname === '/') {
            navigate('/cases');
        }
        const loggedInUser = AuthService.GetLoggedInUserData();
        dispatch(setUser(loggedInUser))
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
        // LogoutService.Logout().then((res)=>{
        // LoggedInUserService.UpdateLoggedInUserSession(res?.data?.token);
        localStorage.clear();
        console.log(window.location.hostname, "window.location.hostname");
        if (window.location.hostname === "master.demandpro.law") {
            navigate('/account/SAlogin');
        } else if (window.location.hostname !== "master.demandpro.law") {
            navigate('/account/login');
        }
    }

    const onNavigateClickHandler = (e)=>{
        if (addCaseFormStep === 4) {
            const PrevButton = formikRef.current.querySelector('#previous');
            if (PrevButton) {
               PrevButton.click()
            }
         } else {
            const submitButton = formikRef?.current?.querySelector('#submit');
            if (submitButton) {
               submitButton.click()
            }
         }

        if (!isCaseDataSaved) {
            e.preventDefault();
            setShouldRenderConfrimationBox(true)
        }
       
    }

    return <>

        <TopNavBar
            profileImageUrl={profilePictureImageUrl}
            open={open} setOpen={setOpen}
            navigate={navigate}
            isAdmin={isAdmin}
            isCaseDataSaved={isCaseDataSaved}
            setShouldRenderConfrimationBox={setShouldRenderConfrimationBox}
            routeName={routeName}
            dispatch={dispatch}
            formikRef={formikRef}
            onNavigateClickHandler={onNavigateClickHandler}
        />
        
                <Outlet />
        <ConfirmationBox isDialogOpen={shouldRenderConfirmationBox} setShouldRenderConfrimationBox={setShouldRenderConfrimationBox} formikRef={formikRef} />
    </>
}

const TopNavBar = ({ profileImageUrl, open, setOpen, navigate, isAdmin, isCaseDataSaved, setShouldRenderConfrimationBox, routeName, dispatch, formikRef, onNavigateClickHandler }) => <nav className="navbar navbar-expand-lg bg-body-tertiary">
    <div className="container">

        <NavLink  to="dashboard">
            <img alt="Company-Logo" src={eastonLogo} className="navbar-brand img-fluid" />
        </NavLink>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

                <li className="nav-item">
                    <NavLink className="nav-link" to="dashboard"
                        onClick={(e) => {
                            dispatch(routeName('/dashboard'))

                            onNavigateClickHandler(e)
                        }}>Dashboard</NavLink>
                </li>

                <li className="nav-item">
                    <NavLink className="nav-link" to="cases"
                        onClick={(e) => {
                            dispatch(routeName('/cases'))
                            onNavigateClickHandler(e)
                        }}
                    >Current Cases</NavLink>
                </li>

                <li className="nav-item">
                    <NavLink className="nav-link" to="users"
                        onClick={(e) => {
                            dispatch(routeName('/users'))
                            onNavigateClickHandler(e)
                        }}
                    >Users</NavLink>
                </li>

                {isAdmin && <li className="nav-item">
                    <NavLink className="nav-link" to="template-builder"
                        onClick={(e) => {
                            dispatch(routeName('/template-builder'))
                            onNavigateClickHandler(e)
                        }}
                    >Template</NavLink>
                </li>}

                <li className="nav-item profile">
                    <NavLink className="nav-link" to="profile"
                        onClick={(e) => {
                            dispatch(routeName('/profile'))
                            onNavigateClickHandler(e)
                        }}
                    >My Profile
                        <img alt="" src={profileImageUrl} className="img-fluid" />
                    </NavLink>
                </li>
                <li className="nav-item">
                    <DialogBox text="Logout" description={'Are you sure want to Logout'} open={open} handleClickOpen={() => setOpen(true)} handleSubmit={() => {
                        localStorage.clear();
                        navigate('/account/login');
                    }} handleClose={() => setOpen(false)} />
                </li>
            </ul>
        </div>
    </div>
</nav>

export default Home;