import React, { useEffect, useState } from 'react';
import { Field, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { TextInput, DatePicker, Dropdown, FileUpload, TextArea, RenderIf, RedesignedFileUpload } from '../../../../components';
import Constants from '../../../../Constants';
import DotLoader from "react-spinners/BeatLoader";
import useAxios from '../../../../hooks/useAxios';

const AddCompaniesForm = ({ isSubmittingForm, }) => {
  let navigate = useNavigate();
  const [islaoder, setIsLaoder] = useState(null);
  const { postData } = useAxios()

  const [showPassword, setShowPassword] = useState(null);
  const [user, setUser] = useState({
    profilepic: "",
    emailAddress: "",
    databasePassword: "",
  })
  const [profilefileName, setprofilefileName] = useState({
    fileName: "",
    imageUrl: null
  });

  const validationSchema = Yup.object().shape({
    companyLogo: Yup.mixed(),
    companyName: Yup.string().required('Company Name is required'),
    // companyPhonenumber: Yup.string().required('Company Phonenumber is required').max(10, 'Company Phonenumber must be at least 10 characters long'),
    companyPhonenumber: Yup.string()
      .required('company Phonenumber is required')
      .matches(/^\d{10}$/, "company Phonenumber must be numeric and exactly 10 digits long"),
    // companyemail: Yup.string().required('Company Email is required'),
    companyAddress: Yup.string().required('Company Address is required'),
    firstname: Yup.string().required('Firstname is required'),
    contactPhonenumber: Yup.string()
      .required('Contact Phonenumber is required')
      .matches(/^\d{10}$/, "Contact Phonenumber must be numeric and exactly 10 digits long"),
    lastname: Yup.string().required('Lastname is required'),
    emailAddress: Yup.string().required('Email Address is required'),
    domainName: Yup.string().required('Domain Name is required'),
    // databaseName: Yup.string().required('Database Name is required'),
    // databaseIp: Yup.string().required('Database Ip is required'),
    // taxId: Yup.string().required('TaxId is required'),
    databasePassword: Yup.string().required('databasePassword is required').min(8, 'databasePassword must be at least 8 characters long'),
    accountantemail: Yup.string()
      .email('Invalid email format')
      .required('Accountant Email is required'),
    usersLimit: Yup.number()
      .required('Users limit is required')
      .typeError('Users limit must be a number'),
    monthlyPrice: Yup.number()
      .required('Monthly price is required')
      .typeError('Monthly price must be a number'),
    demandsPerMonth: Yup.number()
      .required('Demands per month is required')
      .typeError('Demands per month must be a number')
    // databaseUser: Yup.string().required('Database User Password is required')
  });
  const onSubmit = (values, setErrors) => {
    console.log(values, "vlaues");
    setIsLaoder(true)
    let formData = new FormData();
    formData.append('firstName', values?.firstname)
    formData.append('lastName', values?.lastname)
    // formData.append('companyEmail', values?.companyemail)
    formData.append('companyName', values?.companyName)
    formData.append('companyPhoneNumber', values?.companyPhonenumber)
    formData.append('companyAddress', values?.companyAddress)
    formData.append('contactEmail', values?.emailAddress)
    formData.append('dataBaseUser', values?.databaseUser)
    formData.append('databaseIP', values?.databaseIp)
    formData.append('taxiationID', values?.taxId)
    formData.append('dataBasePassword', values?.databasePassword)
    formData.append('domainName', values?.domainName + ".demandpro.law")
    formData.append('contactNumber', values?.contactPhonenumber)
    formData.append('companyLogo', values?.companyLogo)
    formData.append('contractDetails', values?.ContractDetails)
    formData.append('accountantname', values?.accountantname)
    formData.append('accountantemail', values?.accountantemail)
    formData.append('monthlyPrice', values?.monthlyPrice)
    formData.append('demandsPerMonth', values?.demandsPerMonth)
    formData.append('usersLimit', values?.usersLimit)

    postData(Constants.ApiUrl.companies.addCompanies, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((res) => {
      setIsLaoder(false)
      isSubmittingForm()
      console.log(res, "res in the add companies");
    }).catch(err => {
      if (err.response.data.message.email) {
        alert(err.response.data.message.email)
      } else if (err.response.data.message.mobileNumber) {
        alert(err.response.data.message.mobileNumber)
      }
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

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (<>
    <Formik
      initialValues={{
        companyName: '',
        companyPhonenumber: '',
        // companyemail: '',
        companyAddress: '',
        firstname: '',
        contactPhonenumber: '',
        lastname: '',
        emailAddress: '',
        domainName: '',
        databaseIp: '',
        taxId: '',
        databaseUser: '',
        databasePassword: '',
        ContractDetails: "",
        accountantname: "",
        accountantemail: "",
        usersLimit: "",
        monthlyPrice: "",
        demandsPerMonth: "",
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
                {/* <div className="file-upload bd-card profile">
                  {profilefileName?.imageUrl &&
                    <img src={profilefileName?.imageUrl} className="img-fluid" alt="user-logo" />
                  }
                  <div className="position-relative">
                    <Field name="profilepic" component={RedesignedFileUpload} onFileSelected={(files) => onProfileUpload(files, setFieldValue)} />
                    <div className="text text-center">
                      <i className="fa-solid fa-upload"></i>
                      <p>Upload file type .pdf, .jpg, .png</p>
                    </div>
                  </div>
                </div> */}
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
                    <Field name="companyName" type="text" label="Company Name" component={TextInput} />
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
                    <Field name="firstname" type="text" removeMargin={true} label="First Name" component={TextInput} />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className="form-group">
                    <Field name="lastname" type="text" removeMargin={true} label="Last Name" component={TextInput} />
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
                <div className='col-md-6'>
                  <div className="form-group position-relative">
                    <Field
                      onClick={() => setShowPassword(true)}
                      name="databasePassword"
                      type={showPassword ? "text" : "password"}
                      component={TextInput}
                      removeMargin={true}
                      label="Password"
                      className="form-control pe-5" // Prevents text overlap with the icon
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      className="border-0 bg-transparent position-absolute"
                      style={{
                        right: "15px",  // Adjust as needed for proper spacing
                        top: "50%",  // Align vertically at the middle
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                </div>

              </div>
              <h2>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <span>Company Domain Details</span>
                </div>
              </h2>
              <div className='row'>
                <div className='col-md-6'>
                  <div className="form-group">
                    <Field name="domainName" type="text" removeMargin={true} label="Domain Name" component={TextInput} isdomainName={true} />
                  </div>
                  {/* <div className="form-group">
                        <Field name="databaseUser" type="text" removeMargin={true}  label="Database User"  component={TextInput} />
                      </div> */}
                  {/* <div className="form-group">
                        <Field name="databaseIp" type="text" removeMargin={true}  label="Database IP"  component={TextInput} />
                      </div> */}

                </div>
                {/* <div className='col-md-6'>
                      <div className="form-group">
                        <Field name="ContractDetails" type="text" removeMargin={true}  label="Monthly Credits" placeholder="Number of demands per month" component={TextInput} isNumeric={true} />
                      </div>
                    </div> */}
                {/* <div className='col-md-6'>
                      <div className="form-group">
                        <Field name="monthlyPrice" type="text" removeMargin={true}  label="Monthly Price" placeholder="Default amount billed each month" value="5000" componenet={TextInput} isNumeric={true} />
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className="form-group">
                        <Field name="noOfUsers" type="text" removeMargin={true}  label="Number of Users" placeholder="Number of users to include in company" component={TextInput} isNumeric={true} />
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className="form-group">
                        <Field name="renewalDate" type="text" removeMargin={true}  label="Contract Renewal Date" placeholder="Contract Reneweal Date" component={DatePicker} />
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className="form-group">
                        <Field name="costPerAdditionalUser" type="text" removeMargin={true}  label="Cost per Additional User" placeholder="" value="50" component={TextInput} isNumeric={true} />
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className="form-group">
                        <Field name="costPerAdditionalCase" type="text" removeMargin={true}  label="Cost per Additional Case" placeholder="" value="300" component={TextInput} isNumeric={true} />
                      </div>
                    </div> */}
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
            </div>
            <div className="btns text-end">
              <a onClick={() => onback()} className="btn btn-theme btn-outline me-3">Cancel</a>
              <button type='submit' className="btn btn-theme">Create</button>
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
export default AddCompaniesForm;
