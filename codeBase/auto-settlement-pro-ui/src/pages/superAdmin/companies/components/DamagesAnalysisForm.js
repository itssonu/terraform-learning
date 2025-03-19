import React, { useState } from 'react';
import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { TextInput, DatePicker, FileUpload, TextArea } from '../../../../components';


const DamagesAnalysisForm = ({ onSubmit, stepDecrement, onMedicalBillUpload, onIncomeDocmentUpload, onInjuriesPhotosUpload, }) => {

    const [fileName, setFileName] = useState('');
    const [medicalRecordsFileName, setMedicalRecordsFileName] = useState('')
    const [injuryPhotoName, setInjuryPhotoName] = useState('')
    const onMedicalBillFileSelect = (files) => {

        if (files?.file?.length > 1) {
            setFileName('Multiple Medical Bills is selected');
        } else {
            setFileName(files?.file[0]?.name);
        }

        onMedicalBillUpload(files.file)

    }

    const onIncomeDocmentSelect = (files) => {
        setMedicalRecordsFileName(files?.file?.name)
        onIncomeDocmentUpload(files.file)
        console.log(files)
    }

    const validatoionSchema = Yup.object().shape({

        WorkHoursMissed: Yup.number().min(0).required('Value should be greater then zero'),
        // hourlyIncomeRate: Yup.string().required('Hourly Income Rate is required'),
        // typeofWork: Yup.string().required('Type of Work is required')
    })

    const onInjuryFileSelect = (files) => {
        
        setInjuryPhotoName(files?.file?.name);
        onInjuriesPhotosUpload(files?.file)

    }
    return (
        <Formik
            initialValues={{

                WorkHoursMissed: '',
                hourlyIncomeRate: '',
                typeofWork: '',
            }}
            enableReinitialize={true}
            // validationSchema={validatoionSchema}
            onSubmit={(values) => {

                onSubmit({ damage: values })
            }}
        >
            {({ }) => (
                <Form>
                    <div className="add-form p-0">
                        <div className="card">
                            <h2 className="title">Damages Analysis
                            </h2>
                            <div className="row">
                                {/* <div className="col-md-4">
                                    <div className='mt-2'>
                                        <Field name={`medicalProviderandFacility2`} placeholder="Write Medical Provider/Facitlity Name" label="Medical Provider / Facitlity" type="text" component={TextInput} onBlur={(e) => { handleInput(e) }} />
                                    </div>
                                </div> */}
                                {/* <div className="col-md-4">
                                    <div className='mt-2'>
                                        <label>Upload Provider Medical Records <i className="fa-solid fa-upload" style={{ paddingLeft: '8rem' }}></i></label><br></br>
                                        <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem' }}>
                                            <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }} onChange={() => onMedicalRecordsFile()}>{medicalRecordFileName[0] ? medicalRecordFileName[0] : 'Upload Medical Record'}</div>

                                            <Field name="accidentScenes2" component={FileUpload} multiplefileUpload={true} onFileSelected={onMedicalRecordsFile} documentName='medicalRecordsFile' onBlur={(e) => { handleInput(e) }} />
                                        </div>
                                    </div>
                                </div> */}
                                {/* <div className="col-md-6">
                                    <div className="form-group mb-0" style={{ marginTop: '3.5rem' }}>
                                        <label for="exampleFormControlTextarea1" className="form-label">Attach All <b>Prior</b> Medical Records
                                        </label>
                                        <div className="file-upload">
                                            <div className="text text-center">
                                                <Field name="policeReport" component={FileUpload} multiplefileUpload={true} onFileSelected={onInjuryFileSelect} documentName='injuryFile' />

                                                <i className="fa-solid fa-upload"></i>
                                                <p>{injuryPhotoName ? injuryPhotoName : "Upload file type .pdf, .jpg, .png"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                            <div className="row mt-5">
                                <div className="col-md-6">
                                    <div className="sub-title">
                                        <i className="fa-sharp fa-solid fa-angle-right"></i>
                                        <span> Loss of Income Section
                                        </span>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <Field name="WorkHoursMissed" type="number" label="Enter Work Hours Missed" component={TextInput} />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '3rem' }}>
                                            <Field name="hourlyIncomeRate" label="Hourly Income Rate" placeholder="Enter here" shouldUserRenderIcon={<>   <span style={{ position: 'absolute', color: '#18479a', paddingLeft: '18px', paddingTop: '12px' }}>$</span>    </>} component={TextInput} shouldDollarRender={true} isDollarSignRender={true} />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '4rem' }}>
                                            <Field name="typeofWork" label="Enter Type of Work" placeholder="Enter here" component={TextInput} />
                                        </div>
                                    </div>

                                </div>


                                {/* <div className="col-md-6">
                                    <div className="form-group" style={{ marginTop: '3.5rem' }}>
                                        <label for="exampleFormControlTextarea1" className="form-label">Attach All Medical Records Bills (If Possible)

                                        </label>
                                        <div className="file-upload"  >
                                            <div className="text text-center" >
                                                <Field name="accidentScenes" component={FileUpload} onFileSelected={onIncomeDocmentSelect} documentName='incomeDocumentFile' />
                                                <i className="fa-solid fa-upload"></i>
                                                <p>{medicalRecordsFileName ? medicalRecordsFileName : "Upload file type .pdf, .jpg, .png"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                        <div className="btns text-center">
                            <button className="btn-theme btn-outline me-3" onClick={stepDecrement}>Previous</button>
                            <button className="btn-theme" type="submit">Submit</button>
                        </div>
                    </div>
                </Form>
            )
            }
        </Formik >
    )
}

export default DamagesAnalysisForm;