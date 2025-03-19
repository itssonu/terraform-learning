import { Field, Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Link } from "react-router-dom";
import { useState } from 'react';
import './style.css'
import useAxios from '../../hooks/useAxios';
import Constants from '../../Constants';
import { confirm } from '../../utils/swal';
const ForgotPassword = () => {
    const { postData } = useAxios()
    const [emaiSentSuccessfully , setemaiSentSuccessfully] = useState(0)
    const validationSchema = Yup.object().shape({
        email: Yup.string().required('Email is required').email('Please enter a valid email'),
    })
    const onSubmit = (values, setErrors) => {
        postData(Constants.ApiUrl.auth.forgotPassword, values).then((res) => {
            if(res.success){
                setemaiSentSuccessfully(1)
            }else{
                confirm({ icon: "error", title: res.message });
            }
        }).catch(err => {
            confirm({ icon: "error", title: err.message });
        })
    }
    return ( 
        <>
        {
            emaiSentSuccessfully === 0 ? 
            <div className="content">
                <h3 className='h3-heading'>
                    Forgot Password
                </h3>
                <Formik
                    initialValues={{
                        email: '',
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
                                    <label className='label-style'>Email</label>
                                    <div className='input-field'>
                                        <Field  className="input-field-style " type="text" name="email" placeholder="Email" />
                                        <ErrorMessage name="email" component="div" className="error-message" />
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
        <section className="mail-seccess section">
            <div className="success-inner">
                <h1><i className="fa fa-envelope"></i><span>Email sent Successfully!</span></h1>
                <p>Please check your mail</p>
                <Link className="text-theme" to="/account/login"><i className="fa-solid fa-arrow-left me-2"></i> Back to Login</Link>
            </div>
        </section>
        }
        </>

    )
}

export default ForgotPassword;