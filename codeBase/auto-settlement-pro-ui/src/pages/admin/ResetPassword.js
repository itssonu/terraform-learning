import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate } from "react-router-dom";
import { TextInput } from '../../components';

import './style.css'
import useAxios from '../../hooks/useAxios';
import Constants from '../../Constants';
import { confirm } from '../../utils/swal';
const ResetPassword = () => {
    const { postData } = useAxios()
    let navigate = useNavigate();
    const validationSchema = Yup.object().shape({
        password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters long'),
        confirmPassword: Yup.string().required('Confirm password is required').oneOf([Yup.ref('password')], 'Passwords must match')
    })
    const onSubmit = (values, setErrors) => {
        const token = Constants.getAuthtoken()?.token;
        values.token = token;
        postData(Constants.ApiUrl.auth.resetPassword, values).then((res) => {
            if (res.success) {
                confirm({ icon: "success", title: res.message }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/profile')
                    }
                });
            } else {
                confirm({ icon: "error", title: res.message });
            }

        }).catch(err => {
            confirm({ icon: "error", title: err.message });
        })
    }

    const backToProfile = () => {
        navigate('/super/profile')
    }

    return (
        <section className='content-wrapper'>
            <div class="container layout-container case-form">
                <div className="listing">
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
                                <div className="add-form p-0">
                                    <h3 className="form-title mb-6 fs-4">Change Password</h3>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <span className="input-group-text bg-transparent border-0" style={{ zIndex: '999', padding: '14px 0px 0px 8px', position: 'absolute' }}>
                                                    <i className="fa-solid fa-key"></i>
                                                </span>
                                                <Field
                                                    name="password"
                                                    removeMargin={true}
                                                    shouldDollarRender={true}
                                                    type="password"
                                                    placeholder="Enter New Password"
                                                    component={TextInput}
                                                    className="form-control"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <span className="input-group-text bg-transparent border-0" style={{ zIndex: '999', padding: '14px 0px 0px 8px', position: 'absolute' }}>
                                                    <i className="fa-solid fa-key"></i>
                                                </span>
                                                <Field name="confirmPassword" removeMargin={true} shouldDollarRender={true} type="password" placeholder="Enter Confirm Password" component={TextInput} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='d-flex justify-content-between align-items-center btm-btns'>
                                        <a onClick={backToProfile} className="text-theme"><i className='fa fa-arrow-left me-2'></i>Back to profile</a>
                                        <div className="btns text-center button-spacing">
                                            <button onClick={backToProfile} type='button'
                                                className="btn btn-theme btn-border" id="previous">Cancel</button>
                                            <button className="btn btn-theme" type="submit" id="submit">Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </Form>)}
                    </Formik>
                </div>
            </div>
        </section>
    )
}

export default ResetPassword;