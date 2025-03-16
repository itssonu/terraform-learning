import React from 'react';
import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { TextInput, Checkbox1 } from '../../../../components';


const AddEditUserForm = ({ onSubmit, onCancel, isSubmittingForm }) => {

    const validationSchema = Yup.object().shape({
        firstName: Yup.string().required('First name is required'),
        lastName: Yup.string().required('Last name is required'),
        email: Yup.string().required('Email is required').email('Please enter a valid email'),
        mobileNumber: Yup.string().required('Mobile number is required'),
        password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters long'),
        confirmPassword: Yup.string().required('Confirm password is required').oneOf([Yup.ref('password')], 'Passwords must match')
    })

    return (
        <Formik
            initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                mobileNumber: '',
                password: '',
                confirmPassword: '',
                isAdmin: false
            }}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={(values ,  { setErrors }) => {
                onSubmit(true,values , setErrors);
            }}
        >
            {() => (
                <Form>
                    <div className="add-form p-0">
                        <div className="p-4">
                            <h2 className="title">Add User
                            </h2>
                            <div className="row pt-3">
                                <div className="col-6">
                                    <div className="form-group">
                                        <Field name="firstName" placeholder="Enter First Name" label="First Name" component={TextInput} />
                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className="form-group">
                                        <Field name="lastName" placeholder="Enter Last Name" label="Last Name" component={TextInput} />
                                    </div>
                                </div>



                                <div className="col-6">
                                    <div className="form-group">
                                        <Field name="email" placeholder="Enter Email" label="Email" component={TextInput} />
                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className="form-group">
                                        <Field name="mobileNumber" placeholder="Enter Mobile Number" label="Mobile Number" component={TextInput} />
                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className="form-group">
                                        <Field name="password" type="password" placeholder="Enter Password" label="Password" component={TextInput} />
                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className="form-group">
                                        <Field name="confirmPassword" type="password" placeholder="Confirm Password" label="Confirm Password" component={TextInput} />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="form-group">
                                        <Field
                                            name="isAdmin"
                                            label="Admin"
                                            position="left"
                                            component={Checkbox1}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="btns text-center">
                            <button disabled={isSubmittingForm} className="btn-theme" type="submit">Save</button>
                            <button className="btn-secondary form-buttons-margin" onClick={onCancel} >Cancel</button>
                        </div>
                    </div>
                </Form>
            )
            }
        </Formik>
    )


}

export default AddEditUserForm;