import { Field, Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TextInput } from '../../components';
import {  useState } from 'react';
import './style.css'
import useAxios from '../../hooks/useAxios';
import Constants from '../../Constants';
import { confirm } from '../../utils/swal';

const ChangePassword = () => {
    const { postData } = useAxios()
    let [searchParams] = useSearchParams();
    let token = searchParams.get('token');
    let navigate = useNavigate();
    const [isTokenValid, setTokenValid] = useState(true);
    const validationSchema = Yup.object().shape({
        password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters long'),
        confirmPassword: Yup.string().required('Confirm password is required').oneOf([Yup.ref('password')], 'Passwords must match')
    })
    const onSubmit = (values, setErrors) => {
        values.token = token;
        postData(Constants.ApiUrl.auth.resetPassword, values).then((res) => {
            if(res.success){
                confirm({ icon: "success", title: res.message }).then((result) => {
                    if (result.isConfirmed) {
                      navigate('/account/login')
                    }
                  });
            }else{
                setTokenValid(false);
            }
        }).catch(err => {
            setTokenValid(false);
        })
    }
 
    return (
        <>
            {
                isTokenValid ?
                    <div className="content">
                        <h3 className='h3-heading'>
                            Change Password?
                        </h3>
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
                                            <label className='label-style'>Password</label>
                                            <div className='input-field'>
                                                <Field  className="input-field-style " type="password" name="password" placeholder="Enter New Password" />
                                                <ErrorMessage name="password" component="div" className="error-message" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className='label-style'>Confirm Password</label>
                                            <div className='input-field'>
                                                <Field  className="input-field-style " type="password" name="confirmPassword" placeholder="Confirm New Password" />
                                                <ErrorMessage name="confirmPassword" component="div" className="error-message" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='d-flex justify-content-between align-items-center'>
                                        <Link className="text-theme fw-semibold" to="/account/login"><i className="fa-solid fa-arrow-left me-2"></i> Back to Login</Link>
                                        <button type='submit' className="btn btn-theme">Submit</button>
                                    </div>
                                </Form>)}
                        </Formik>
                    </div>
                    : 
                        <div className="container">
                            <div className="row">
                                <div className="success-inner">
                                    <h1>Oops, this link is expired</h1>
                                    <p>This URL is not valid anymore.</p>
                                    <Link className="text-theme" to="/account/login"><i className="fa-solid fa-arrow-left me-2"></i> Back to Login</Link>
                                </div>
                            </div>
                        </div> 
            }
        </>

    )
}

export default ChangePassword;