import React from 'react';
import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { Dropdown, TextInput } from '../../../../components';
import Constants from '../../../../Constants';


const InjuryAnalysisSecondForm = ({ onSubmit, duplcateFormValues }) => {

    return (
        <>
            <InjuryAnalysis onSubmit={onSubmit} duplcateFormValues={duplcateFormValues} />
            {/* {duplicatFormFields} */}
        </>
    )
}

export default InjuryAnalysisSecondForm;

const InjuryAnalysis = ({ duplcateFormValues, createNewForm }) => {

    const validatoionSchema = Yup.object().shape({
        DamagedBodyParts: Yup.string().required('Damaged Body Parts is required'),
        Painlevel: Yup.string().required('Level of Pain is required'),
    })

    return (
        <Formik
            initialValues={{
                DamagedBodyParts: '',
                Painlevel: '',

            }}
            enableReinitialize={true}
            validationSchema={validatoionSchema}
            onSubmit={(values) => {
                //  duplcateFormValues({ injury: values })

            }}
        >
            {() => (
                <Form onChange={(e) => duplcateFormValues(e)}>
                    <div className="add-form p-0">
                        <div className="row">
                            {/* <div className='bd-card' style={{ display: 'flex', justifyContent: 'center', width: '100%' }}> */}
                            <div className="col-md-7">
                                <div className="form-group" >
                                    <Field name="DamagedBodyParts"
                                        label="Damaged Body Parts"
                                        component={Dropdown}
                                        defaultOption="Select body part"
                                        options={Constants.Dropdowns.BodyParts}
                                    />
                                </div>

                            </div>
                            <div className='col-md-4'>
                                <div className="form-group">
                                    <Field name="Painlevel"
                                        label="Select Level of Pain"
                                        component={Dropdown}
                                        defaultOption="Select level of pain"
                                        options={Constants.Dropdowns.LevelOfPain}
                                    />

                                </div>
                            </div>
                            {/* <div className="col" style={{ maxWidth: "70px" }}>
                                    <div className="form-group add-icon" style={{ marginLeft: '20px', marginTop: '31px' }}>
                                        <button type='btn' className="add-btn-style"  onClick={createNewForm}><i className="fa-solid fa-plus"></i></button>
                                    </div>
                                </div> */}
                        </div>

                    </div>
                    {/* </div> */}
                </Form>
            )}
        </Formik>
    )
}