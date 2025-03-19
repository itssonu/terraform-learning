import React from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import useAxios from '../hooks/useAxios';
import { toaster } from '../utils/toast';
import DotLoader from "react-spinners/BeatLoader";
import LoggedInUserService from '../services/AuthService';
import XButton from '../components/common/XButton';


const LoginForm = ({ apiUrl, redirectPath }) => {
    const { isLoading, postData } = useAxios();
    const navigate = useNavigate();

    const validationSchema = Yup.object().shape({
        email: Yup.string().required('Email is required').email('Please enter a valid email'),
        password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters long'),
    });
    return (
        <>
            <h3 className='h3-heading'>
                Login
            </h3>
            <Formik 
                initialValues= {{
                    email: '',
                    password: '',
                }}
                validationSchema={validationSchema}
                onSubmit={async (values) => {
                    const { success, data, message } = await postData(apiUrl, values);
                    if (success) {
                        const { token } = data;
                        LoggedInUserService.UpdateLoggedInUserSession(token);
                        navigate(redirectPath);
                    } else {
                        toaster({ message, success });
                    }
            }}>
                <Form>
                    <div className="fields">
                        <div className="form-group">
                            <label className='label-style'>Email</label>
                            <div className='input-field'>
                                <Field  className="input-field-style " type="text" name="email" placeholder="Email" />
                                <ErrorMessage name="email" component="div" className="error-message" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className='label-style'>Password</label>
                            <div className='input-field'>
                                <Field  className="input-field-style " type="password" name="password" placeholder="Password" />
                                <ErrorMessage name="password" component="div" className="error-message" />
                            </div>
                        </div>
                    </div>
                    <div className='d-flex justify-content-between align-items-center'>
                        <Link className="frgt" to="/account/forgot-password">Forgot Password?</Link>
                        <XButton loading={isLoading} className="btn btn-theme" type='submit' buttonText='Login' />
                    </div>
                    <DotLoader
                        color={'#00a6ff'}
                        loading={isLoading}
                        size={30}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    />
                </Form>
            </Formik>
        
        </>
    );
};

export default LoginForm;
