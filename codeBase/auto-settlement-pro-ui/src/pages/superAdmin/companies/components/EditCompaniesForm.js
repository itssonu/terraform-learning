import React, { useEffect, useState } from 'react';
import { Field, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom'
import DotLoader from "react-spinners/BeatLoader";

import { TextInput, DatePicker, Dropdown, FileUpload, TextArea, RenderIf } from '../../../../components';
import useAxios from '../../../../hooks/useAxios';
import Constants from '../../../../Constants';

const EditCompaniesForm = ({ selectedUser, isSubmittingForm }) => {
  let navigate = useNavigate();
  const [islaoder, setIsLaoder] = useState(null);
  const { postData } = useAxios()

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


  const validationSchema = Yup.object().shape({
    companyLogo: Yup.mixed(),
    companyname: Yup.string().required('Company Name is required'),
    companyPhonenumber: Yup.string()
      .required('company Phonenumber is required')
      .matches(/^\d{10}$/, "company Phonenumber must be numeric and exactly 10 digits long"),
    // companyemail: Yup.string().required('Company Email is required'),
    companyAddress: Yup.string().required('Company Address is required'),
    firstName: Yup.string().required('FirstName is required'),
    contactPhonenumber: Yup.string()
      .required('Contact Phonenumber is required')
      .matches(/^\d{10}$/, "Contact Phonenumber must be numeric and exactly 10 digits long"),
    lastName: Yup.string().required('lastName is required'),
    emailAddress: Yup.string().required('Email Address is required'),
    domainName: Yup.string().required('Domain Name is required'),
    // databaseName: Yup.string().required('Database Name is required'),
    // databaseIp: Yup.string().required('Database Ip is required'),
    // taxId: Yup.string().required('TaxId is required'),
    // databasePassword: Yup.string().required('databasePassword is required').min(8, 'databasePassword must be at least 8 characters long'),
    // databaseUser: Yup.string().required('Database User Password is required')
    usersLimit: Yup.number()
      .required('Users limit is required')
      .typeError('Users limit must be a number'),
    monthlyPrice: Yup.number()
      .required('Monthly price is required')
      .typeError('Monthly price must be a number'),
    demandsPerMonth: Yup.number()
      .required('Demands per month is required')
      .typeError('Demands per month must be a number'),
    costPerAdditionalUser: Yup.number()
      .required('Cost per additional user is required')
      .typeError('Cost per additional user must be a number'),
    costPerAdditionalDemand: Yup.number()
      .required('Cost per additional demand is required')
      .typeError('Cost per additional demand must be a number'),
    rollOverCredits: Yup.number()
      .required('Roll over credits is required')
      .typeError('Roll over credits must be a number'),
    remainingDemand: Yup.number()
      .required('Remaining demand is required')
      .typeError('Remaining demand must be a number')
  });
  const onSubmit = (values, setErrors) => {
    setIsLaoder(true)

    const subscription = {
      monthlyPrice: values?.monthlyPrice,
      usersLimit: values?.usersLimit,
      demandsPerMonth: values?.demandsPerMonth,
      costPerAdditionalDemand: values?.costPerAdditionalDemand,
      costPerAdditionalUser: values?.costPerAdditionalUser,
      remainingDemand: values?.remainingDemand,
      rollOverCredits: values?.rollOverCredits
    }

    let formData = new FormData();
    formData.append('firstName', values?.firstName)
    formData.append('lastName', values?.lastName)
    formData.append('companyName', values?.companyname)
    formData.append('companyPhoneNumber', values?.companyPhonenumber)
    formData.append('companyAddress', values?.companyAddress)
    formData.append('contactEmail', values?.emailAddress)
    formData.append('contactNumber', values?.contactPhonenumber)
    formData.append('companyLogo', values?.companyLogo ? values?.companyLogo : selectedUser?.companyLogo)
    formData.append('companyId', selectedUser?._id)
    formData.append('accountantName', values?.accountantname)
    formData.append('accountantEmail', values?.accountantemail)
    formData.append('subscription', JSON.stringify(subscription))

    postData(Constants.ApiUrl.companies.updatecompanies, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((res) => {
      setIsLaoder(false)
      isSubmittingForm()
      // LoggedInUserService.UpdateLoggedInUserSession(res?.data?.token);
      console.log(res, "res in the add companies");
    }).catch(err => {

    })

  }

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

  const onback = (files, setFieldValue) => {
    isSubmittingForm()
  }

  return (
    <>
      <Formik
        initialValues={{
          companyname: selectedUser?.companyName || '',
          companyPhonenumber: selectedUser?.companyPhoneNumber || '',
          // companyemail: selectedUser?.companyEmail || '',
          companyAddress: selectedUser?.companyAddress || '',
          firstName: selectedUser?.firstName || '',
          contactPhonenumber: selectedUser?.contactNumber || '',
          lastName: selectedUser?.lastName || '',
          emailAddress: selectedUser?.contactEmail || '',
          domainName: selectedUser?.domainName || '',
          databaseIp: selectedUser?.databaseIp || '',
          taxId: selectedUser?.taxId || '',
          databaseUser: selectedUser?.databaseUser || '',
          companyLogo: selectedUser?.companyLogo || "",
          ContractDetails: selectedUser?.ContractDetails || "",
          accountantname: selectedUser?.accountantname || "",
          accountantemail: selectedUser?.accountantemail || "",
          usersLimit: selectedUser?.subscription?.usersLimit || 0,
          monthlyPrice: selectedUser?.subscription?.monthlyPrice || 0,
          demandsPerMonth: selectedUser?.subscription?.demandsPerMonth || 0,
          remainingDemand: selectedUser?.subscription?.remainingDemand || 0,
          rollOverCredits: selectedUser?.subscription?.rollOverCredits || 0,
          costPerAdditionalDemand: selectedUser?.subscription?.costPerAdditionalDemand || 0,
          costPerAdditionalUser: selectedUser?.subscription?.costPerAdditionalUser || 0,

        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          onSubmit(values);
          // Additional logic if needed
        }}
      >
        {({ setFieldValue }) => (
          <Form>
            <div className="add-form p-0">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <span style={{ fontSize: '40px', color: 'black', fontFamily: 'Baskerville', fontWeight: 'bold' }}>Company Information</span>
                </div>
                <div class="col-md-6 d-flex justify-content-end">
                  <button class="btn btn-theme" onClick={() => onback()}><i className='fa fa-arrow-left me-2'></i> Back to Companies</button>
                </div>
              </div>
              <h2>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <span>Company Details</span>
                </div>
              </h2>
              <div className="row">
                <div className="col-md-12">
                  <div class="upload-area">
                    {profilefileName?.imageUrl &&
                      <img src={profilefileName?.imageUrl} className="img-fluid" alt="user-logo" />
                    }
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
                <div className="row mt-5">
                  <div className="col-md-6">
                    <div className="form-group">
                      <Field name="companyname" type="text" removeMargin={true} label="Company Name" component={TextInput} />
                    </div>
                  </div>
                  {/* <div className="col-md-6">
                      <div className="form-group">
                        <Field name="companyemail" type="email" removeMargin={true}  label="Email Address"  component={TextInput} />
                      </div>
                    </div> */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <Field name="companyPhonenumber" type="text" removeMargin={true} label="Company Phone Number" component={TextInput} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <Field name="companyAddress" type="text" removeMargin={true} label="Company Address" component={TextInput} />
                    </div>
                  </div>
                </div>
                <h2>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <span>Contact Person details</span>
                  </div>
                </h2>
                <div className='row'>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="firstName" type="text" removeMargin={true} label="First Name" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="lastName" type="text" removeMargin={true} label="Last Name" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="contactPhonenumber" type="text" removeMargin={true} label="Contact Phone Number" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="emailAddress" type="email" removeMargin={true} label="Email Address" component={TextInput} />
                    </div>
                  </div>
                </div>
                <h2>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <span>Company Domain Details</span>
                  </div>
                </h2>
                <div className='row'>
                  <div className='col-md-6 '>
                    <div className="form-group">
                      <Field name="domainName" type="text" removeMargin={true} label="Domain Name" component={TextInput} disabled={true} />
                    </div>

                  </div>
                  <div className='col-md-6'>
                  </div>
                </div>
                <h2>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <span>Finance Company Details</span>
                  </div>
                </h2>
                <div className='row'>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="accountantname" type="text" removeMargin={true} label="Accountant Name" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="accountantemail" type="text" removeMargin={true} label="Accountant Email" component={TextInput} />
                    </div>
                  </div>

                </div>
                <h2>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <span>Subscription Details</span>
                  </div>
                </h2>
                <div className='row'>
                  <div className='col-md-4'>
                    <div className="form-group">
                      <Field name="monthlyPrice" type="text" removeMargin={true} label="Monthly Total Subscription Price" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-4'>
                    <div className="form-group">
                      <Field name="demandsPerMonth" type="text" removeMargin={true} label="Demand Per Month" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-4'>
                    <div className="form-group">
                      <Field name="usersLimit" type="text" removeMargin={true} label="User Limit" component={TextInput} />
                    </div>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="costPerAdditionalUser" type="text" removeMargin={true} label="Cost per additional user in $" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="costPerAdditionalDemand" type="text" removeMargin={true} label="Cost per additional demand in $" component={TextInput} />
                    </div>
                  </div>
                </div>
                <h2>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <span>Current Month Usage</span>
                  </div>
                </h2>
                <div className='row'>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="remainingDemand" type="text" removeMargin={true} label="Remaning Demands of the month" component={TextInput} />
                    </div>
                  </div>
                  <div className='col-md-6'>
                    <div className="form-group">
                      <Field name="rollOverCredits" type="text" removeMargin={true} label="Rollover credits" component={TextInput} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="btns text-end">
                <span onClick={() => onback()} className="btn btn-theme btn-outline me-3">Cancel</span>
                <button type='submit' className="btn btn-theme">Update</button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
      <DotLoader
        color={'#00a6ff'}
        loading={islaoder}
        size={30}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </>
  );
};
export default EditCompaniesForm;
