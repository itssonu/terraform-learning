import React, { useEffect, useState } from 'react'
import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { FileUpload, TextInput } from '../../../components'
import { Link, useNavigate } from 'react-router-dom'
import LoggedInUserService from '../../../services/AuthService';
import useAxios from '../../../hooks/useAxios'
import Constants from '../../../Constants'

const Profile = () => {
  const { putData } = useAxios()

  let navigate = useNavigate();
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilepic: ""
  })
  const [profilefileName, setprofilefileName] = useState({
    fileName: "",
    imageUrl: null
  });
  useEffect(() => {
    const data = LoggedInUserService.GetLoggedInUserData();
    const imageUrl = data?.profileImageUrl;
    setUser(data)
    setprofilefileName({ imageUrl: imageUrl });
  }, [])


  const validationSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Please enter a valid email'),
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
  })
  const onProfileUpload = (files, setFieldValue) => {

    setprofilefileName(files.file.name);
    setprofilefileName((prev) => ({ ...prev, fileName: files.file.name, imageUrl: URL.createObjectURL(files?.file) }))
    setFieldValue('profilepic', files?.file)
  }
  const onSubmit = (values, setErrors) => {

    const data = LoggedInUserService.GetLoggedInUserData();
    const domain = data.domainName;
    let formData = new FormData();
    formData.append('firstName', values?.firstName)
    formData.append('lastName', values?.lastName)
    formData.append('email', values?.email)
    formData.append('profilepic', values?.profilepic)
    formData.append('domainName', domain)

    putData(Constants.ApiUrl.user.updateProfile, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
     },
    }).then((res) => {
      LoggedInUserService.UpdateLoggedInUserSession(res?.token);
    }).catch(err => {

    })

  }
 
  return (
    <Formik
      initialValues={{ ...user }}
      validationSchema={validationSchema}
      enableReinitialize={true}
      onSubmit={(values, { setErrors }) => {
        onSubmit(values)
      }}
    >
      {({ errors, touched, isSubmitting, setFieldValue }) => {
        return (
          <Form>
            <div className="wrapper add-form">
              <div className="content">
                <div className="title">
                  <h2>Personal Information</h2>
                  <p>Update your photo and personal details here.</p>
                </div>

                <div className="card mb-5">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <Field name="firstName" type="text" removeMargin={true} className="form-control" label="First Name" placeholder="Enter here" component={TextInput} />
                      </div>
                      <div className="form-group">
                        <Field name="lastName" type="text" removeMargin={true} className="form-control" label="Last Name" placeholder="Enter here" component={TextInput} />
                      </div>
                      <div className="form-group">
                        <Field disabled name="email" type="email" removeMargin={true} className="form-control" label="Email Address" placeholder="Enter here" component={TextInput} />
                      </div>
                      <Link className="frgt"
                        to="/forgot-password"
                      >Reset Password?</Link>
                    </div>
                    <div className="col-md-6">
                      <div className="file-upload bd-card profile">
                        <img src={profilefileName?.imageUrl !== "" ? profilefileName?.imageUrl : ""} className="img-fluid" alt="user-logo" />
                        <div className="position-relative">
                          <Field name="profilepic" component={FileUpload} onFileSelected={(files) => onProfileUpload(files, setFieldValue)} />
                          <div className="text text-center">
                            <i className="fa-solid fa-upload"></i>
                            <p>Upload file type .pdf, .jpg, .png</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content">
                {/* <div className="title">
          <h2>Profile</h2>
          <p>Update your profile &amp; password.</p>
        </div>
        <div class="card">
          <form>
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="exampleFormControlInput1" class="form-label">Username</label>
                  <input type="name" class="form-control" id="exampleFormControlInput1" placeholder="Enter here" />
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="exampleFormControlInput1" class="form-label">Current Password</label>
                  <input type="name" class="form-control" id="exampleFormControlInput1" placeholder="Enter here" />
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="exampleFormControlInput1" class="form-label">New Password</label>
                  <input type="name" class="form-control" id="exampleFormControlInput1" placeholder="Enter here" />
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="exampleFormControlInput1" class="form-label">Confirm Password</label>
                  <input type="name" class="form-control" id="exampleFormControlInput1" placeholder="Enter here" />
                </div>
              </div>
            </div>
          </form>
        </div> */}
                <div className="btns text-end">
                  <a href="javascript:void(0)" onClick={() => navigate('/cases')} className="btn btn-theme btn-outline me-3">Cancel</a>
                  <button type='submit' className="btn btn-theme">Save Changes</button>
                </div>
              </div>
            </ div>
          </Form>
        )
      }}
    </Formik>
  )
}

export default Profile;