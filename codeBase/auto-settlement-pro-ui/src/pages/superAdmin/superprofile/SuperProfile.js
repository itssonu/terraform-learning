import React, { useEffect, useState } from 'react'
import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { FileUpload, TextInput } from '../../../components'
import { Link, useNavigate } from 'react-router-dom'
import LoggedInUserService from '../../../services/AuthService'
import useAxios from '../../../hooks/useAxios'
import Constants from '../../../Constants'
const userLogo = require("../../../assets/images/user.png")

const SuperProfile = () => {
  const { postData, putData } = useAxios()

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
  });

  const onProfileUpload = (files, setFieldValue) => {
    const newFiles = Array.isArray(files.file) ? files.file : [files.file];
    const selectedFile = newFiles[0];
    if (!selectedFile) return;
    setprofilefileName(selectedFile.name);
    setprofilefileName((prev) => ({
      ...prev,
      fileName: selectedFile.name,
      imageUrl: URL.createObjectURL(selectedFile)
    }));
    setFieldValue('companyLogo', selectedFile);
  };

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
  const resetPassword = () => {
    const data = LoggedInUserService.GetLoggedInUserData();
    const domain = data.domainName;
    const values = {
      email: user?.email,
      profile: true,
      domainName: domain,
    };
    postData(Constants.ApiUrl.auth.forgotPassword, values).then((res) => {
      console.log(res, "res");
      if (res) {
        navigate('/forgot-password', { state: { fromReset: true, data: res } });
      }
    }).catch(err => {
    })
  }

  return (
    <section className='content-wrapper'>
      <div class="container layout-container case-form">
        <div className="listing">
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
                  <div className="add-form p-0">
                    <div class="row align-items-center mb-10">
                      <div class="col-md-6">
                        <span style={{ fontSize: '40px', color: 'black', fontFamily: 'Baskerville', fontWeight: 'bold' }}>Personal Information</span>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <Field name="firstName" type="text" removeMargin={true} label="First Name" placeholder="Enter here" component={TextInput} />
                        </div>
                        <div className="form-group">
                          <Field name="lastName" type="text" removeMargin={true} label="Last Name" placeholder="Enter here" component={TextInput} />
                        </div>
                        <div className="form-group">
                          <Field disabled name="email" type="email" removeMargin={true} label="Email Address" placeholder="Enter here" component={TextInput} />
                        </div>
                        <Link className="frgt"
                          onClick={() => resetPassword()}
                        >Reset Password?</Link>
                      </div>
                      <div className="col-md-6 mb-10">
                        {/* <div className="file-upload bd-card profile">
                            <img src={profilefileName?.imageUrl !== "" ? profilefileName?.imageUrl : ""} className="img-fluid" alt="user-logo" />
                            <div className="position-relative">
                              <Field name="profilepic" component={FileUpload} onFileSelected={(files) => onProfileUpload(files, setFieldValue)} />
                              <div className="text text-center">
                                <i className="fa-solid fa-upload"></i>
                                <p>Upload file type .pdf, .jpg, .png</p>
                              </div>
                            </div>
                          </div> */}
                        <div class="upload-area">
                          <img src={profilefileName?.imageUrl !== "" ? profilefileName?.imageUrl : ""} className="img-fluid" alt="user-logo" />
                          <div class="mb-4">
                            <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15.8332 34.4616H18.1665V23.5083L23.0665 28.4083L24.7179 26.7435L16.9998 19.0254L9.28176 26.7435L10.9466 28.3949L15.8332 23.5083V34.4616ZM4.436 42C3.36189 42 2.46512 41.6403 1.74567 40.9208C1.02623 40.2014 0.666504 39.3046 0.666504 38.2305V3.7695C0.666504 2.69539 1.02623 1.79861 1.74567 1.07917C2.46512 0.359722 3.36189 0 4.436 0H22.8332L33.3332 10.5V38.2305C33.3332 39.3046 32.9735 40.2014 32.254 40.9208C31.5346 41.6403 30.6378 42 29.5637 42H4.436ZM21.6665 11.6667V2.33333H4.436C4.07667 2.33333 3.74748 2.48286 3.44842 2.78192C3.14937 3.08097 2.99984 3.41017 2.99984 3.7695V38.2305C2.99984 38.5898 3.14937 38.919 3.44842 39.2181C3.74748 39.5171 4.07667 39.6667 4.436 39.6667H29.5637C29.923 39.6667 30.2522 39.5171 30.5513 39.2181C30.8503 38.919 30.9998 38.5898 30.9998 38.2305V11.6667H21.6665Z" fill="#686C74" />
                            </svg>
                          </div>
                          <p>Drag and drop your files here or</p>
                          <div className='inline-block position-relative'>
                            <button type='button' class="btn btn-theme btn-border bg-transparent d-flex align-items-center gap-1 mx-auto" onclick="document.getElementById('fileInput').click();"><svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0.666504 13.6666V12.3333H11.3332V13.6666H0.666504ZM3.99984 11V6.33331H1.33317L5.99984 0.333313L10.6665 6.33331H7.99984V11H3.99984Z" fill="#2277C9" />
                            </svg> Upload</button>
                          </div>
                          <Field name="profilepic" component={FileUpload} multiplefileUpload={true} onFileSelected={(files) => onProfileUpload(files, setFieldValue)} />
                        </div>
                      </div>
                    </div>
                    <div className="btns text-end">
                      <a onClick={() => navigate('/super/companies')} className="btn btn-theme btn-outline me-3">Cancel</a>
                      <button type='submit' className="btn btn-theme">Save Changes</button>
                    </div>
                  </ div>
                </Form>
              )
            }}
          </Formik>
        </div>
      </div>
    </section>

  )
}

export default SuperProfile;