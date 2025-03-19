import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { TextInput } from '../../components';
import { useEffect, useState } from 'react';
import LoggedInUserService from '../../services/AuthService'
import './style.css'
import Constants from '../../Constants';
import useAxios from '../../hooks/useAxios';
const ResetPassword = () => {
    const { postData } = useAxios()

    const location = useLocation();
    const { fromReset, data } = location.state || {};

    let navigate = useNavigate();
    const [ProfileData, setProfileData] = useState()
    useEffect(() => {

        if (fromReset) {
            console.log('Data received from reset password:', data);
            setProfileData(data?.data)
        }
    }, [fromReset, data])
    console.log(ProfileData, "ProfileData");
    const validationSchema = Yup.object().shape({
        password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters long'),
        confirmPassword: Yup.string().required('Confirm password is required').oneOf([Yup.ref('password')], 'Passwords must match')
    })
    const onSubmit = (values, setErrors) => {
        const data = LoggedInUserService.GetLoggedInUserData();
        const domain = data.domainName;
        console.log(values, "values");
        values.user_id = ProfileData?._id;
        values.token = ProfileData?.resetToken;
        values.domainName = domain;

        postData(Constants.ApiUrl.auth.resetPassword, values).then((res) => {
            navigate('/profile')
        }).catch(err => {

        })
    }
    return (
        <section className='content-wrapper'>
            <div class="container layout-container case-form">
                <div className="listing">
                    <div className="content">
                        <div className="top">
                            <div className="text">
                                <h1>Change Password?</h1>
                            </div>
                            <Formik
                                initialValues={{
                                    password: '',
                                    confirmPassword: '',
                                }}
                                enableReinitialize={true}
                                validationSchema={validationSchema}
                                onSubmit={(values, { setErrors }) => {
                                    onSubmit(values, setErrors)
                                }}
                            >
                                {() => (
                                    <Form>
                                        <div className="fields">
                                            <div className="form-group">
                                                <Field name="password" removeMargin={true} shouldDollarRender={true} shouldUserRenderIcon={<> <span style={{
                                                    width: "2.5rem",
                                                    outline: "none",
                                                    height: "48px",
                                                    border: "none",
                                                    position: "absolute"
                                                }} className="input-group-text"><i className="fa-solid fa-key"></i></span></>} className="form-control" type="password" placeholder="Enter Password" component={TextInput} />
                                            </div>
                                            <div className="form-group">
                                                <Field name="confirmPassword" removeMargin={true} shouldDollarRender={true} shouldUserRenderIcon={<> <span style={{
                                                    width: "2.5rem",
                                                    outline: "none",
                                                    height: "48px",
                                                    border: "none",
                                                    position: "absolute"
                                                }} className="input-group-text"><i className="fa-solid fa-key"></i></span></>} className="form-control" type="password" placeholder="Enter Password" component={TextInput} />
                                            </div>
                                        </div>
                                        <button type='submit' className="btn-theme btn-login">Submit</button>
                                    </Form>)}
                            </Formik>
                        </div>
                        <Link className="text-theme" to="/profile"><i className="fa-solid fa-arrow-left me-2"></i> Back to profile</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ResetPassword;