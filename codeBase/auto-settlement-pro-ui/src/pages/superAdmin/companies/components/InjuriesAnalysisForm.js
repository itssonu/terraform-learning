import React, { useEffect, useRef, useState } from 'react';
import { Field, Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { TextInput, Dropdown, FileUpload, TextArea, RenderIf, Dialog, MedicalBillFileUpload } from '../../../../components';
import Constants from '../../../../Constants';
import { CaseService } from '../../../../api-services';
import { GenerateUUID } from '../../../../Utils';
import { useActionData } from 'react-router-dom';
import zIndex from '@mui/material/styles/zIndex';
import { debounce } from '@mui/material';
import { upload } from '@testing-library/user-event/dist/upload';


const InjuriesAnalysisForm = ({ onSubmit, stepDecrement, onInjuriesPhotosUpload, onMedicalRecordsUpload }) => {

    const [medicalBillName, setMedicalBillName] = useState([]);
    const [medicalRecordsFile, setMedicalRecordsFile] = useState([])
    const [duplicateInjuredBodyPartsControls, setDuplicateInjuredBodyPartsControls] = useState([]);
    const [duplicateMedicalBillsandMedicalProviders, setDuplicateMedicalBillsandMedicalProviders] = useState([])
    const [pdfFile, setPdfFile] = useState([])
    const injuredBodyPartControls = useRef([]);
    const medicalProviderandMdicalBills = useRef([]);
    const [values, setValues] = useState({})
    const [multipleMedicalProviderandFacitlityName, setMultipleMedicalProviderandFacitlityName] = useState([])
    const [medicalBills, setMedicalBills] = useState([]);
    const [medicalRecordFileName, setMedicalRecordFileName] = useState([])
    let [medicalProviderCounter, setMedicalProviderCounter] = useState([])
    const [index, setIndex] = useState(0)
    const [error, setErrors] = useState({});
    const medicalProviderName = useRef(null);
    const [outerMultipleMedicalRecordsandMedicalBillsForSingleProviderCounter, setOuterMultipleMedicalRecordsandMedicalBillsForSingleProviderCounter] = useState([])
    const [multipleMedicalRecordsandMedicalBillsForSingleProviderCounter, setMultipleMedicalRecordsandMedicalBillsForSingleProviderCounter] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMedicalBillModalOpen, setMedicalBillModalOpen] = useState(false)



    const newMedicalRecordFileName = [...medicalRecordFileName];

    useEffect(() => {
        console.log(medicalRecordsFile)
        console.log(medicalBillName)
        console.log(medicalBills)
    }, [medicalRecordsFile])


    const validationSchemaforMedicalProviderName = Yup.object().shape({
        medicalProviderName: Yup.string().required('Medical Provider Name is required'),
    })
    const removeDuplicateInjuredPartControl = (controlUuid, fieldSetterCallback) => {
        const controlIndex = injuredBodyPartControls.current.findIndex(x => x.uuid === controlUuid);
        injuredBodyPartControls.current.splice(controlIndex, 1);
        setDuplicateInjuredBodyPartsControls(injuredBodyPartControls.current);
        fieldSetterCallback();
    }

    const appendDuplicateInjuredBodyPartControl = (fieldSetterCallback) => {
        

        const duplicateFieldsLength = !duplicateInjuredBodyPartsControls.length ? 1 : duplicateInjuredBodyPartsControls.length + 1;
        const bodyPartFieldName = "injuredBodyParts" + duplicateFieldsLength;
        const painLevelFieldName = "painLevel" + duplicateFieldsLength;
        const uuid = GenerateUUID();

        const resetInjuredBodyPartFieldValues = () => {
            fieldSetterCallback(bodyPartFieldName, null);
            fieldSetterCallback(painLevelFieldName, null);
        }

        resetInjuredBodyPartFieldValues();

        const injuredBodyPartControl = {
            uuid, element: <InjuredBodyPartsControl
                bodyPartFieldName={bodyPartFieldName}
                painLevelFieldName={painLevelFieldName}
                onMinusClick={removeDuplicateInjuredPartControl.bind(this, uuid, resetInjuredBodyPartFieldValues)}
            />
        }

        injuredBodyPartControls.current = [...duplicateInjuredBodyPartsControls, injuredBodyPartControl];

        setDuplicateInjuredBodyPartsControls(injuredBodyPartControls.current);
    };

    const appendDuplicateMedicalProviderandMedicalBill = (fieldSetterCallback) => {
        const duplicateFieldsLength = !duplicateMedicalBillsandMedicalProviders.length ? 1 : duplicateMedicalBillsandMedicalProviders + 1;
        const medicalProvideFieldName = "nameOfMedicalProvider" + duplicateFieldsLength;
        const medicalBillFieldName = "medicalBillsAmount" + duplicateFieldsLength;
        const medicalBillsAttachmentFieldName = "medicalBillsAttachment" + duplicateFieldsLength;
        const uuid = GenerateUUID();

        const resetMedicalBillsandAttachmentNameField = () => {
            fieldSetterCallback(medicalProvideFieldName, null);
            fieldSetterCallback(medicalBillFieldName, null);
            fieldSetterCallback(medicalBillsAttachmentFieldName, null);
        }
        resetMedicalBillsandAttachmentNameField();

        const medicalBillsandMedicalProviders = {
            uuid, element: <MedicalBillsandMedicalProviders
                nameOfMedicalProvider={medicalProvideFieldName}
                medicalBillsAmount={medicalBillFieldName}
                medicalBillsAttachment={medicalBillsAttachmentFieldName}
            />
        }
        medicalProviderandMdicalBills.current = [...duplicateMedicalBillsandMedicalProviders, medicalBillsandMedicalProviders];

        setDuplicateMedicalBillsandMedicalProviders(medicalProviderandMdicalBills.current)
    }

    const parseInjuredBodyPartsControlsValues = (formData) => {

        const injuredBodyPartsValue = `${formData.injuredBodyParts} with pain level of (${formData.painLevel}/10),`;

        const duplicateInjuredBodyPartControlsValue = injuredBodyPartControls.current.map((x, index) => {
            const fieldIndex = index + 1;
            const bodyPartFieldKey = 'injuredBodyParts' + fieldIndex;
            const painLevelFieldKey = 'painLevel' + fieldIndex;
            const bodyPart = formData[bodyPartFieldKey];
            const painLevel = formData[painLevelFieldKey];

            if (bodyPart) return `${bodyPart} with pain level of (${painLevel}/10)`;
            else return null;
        }).filter(y => y).join(',');

        return injuredBodyPartsValue + duplicateInjuredBodyPartControlsValue;
    }

    const parseMedicalBillsandMedicalProvideraValues = (formData) => {
        // const medicalBillsandMedicalProvideraValues =`${formData.nameOfMedicalProvider}`
        const duplicateMedicalBillsandMedicalProvideraValues = medicalProviderandMdicalBills.current.map((x, index) => {
            const fieldIndex = index + 1;
            const medicalProvideFieldKey = "nameOfMedicalProvider" + fieldIndex;
            const medicalBillFieldKey = "medicalBillsAmount" + fieldIndex;
            const medicalBillsAttachmentFieldKey = "medicalBillsAttachment" + fieldIndex;
            const medicalProviers = formData[medicalProvideFieldKey];
            const medicalBill = formData[medicalBillFieldKey];
            const medicalBillsAttachment = formData[medicalBillsAttachmentFieldKey];
        }).filter(y => y).join(',');
    }


    const handleInput = (e, innerIndex) => {
        
        e.preventDefault();
        const name = e.target.value;


        const parts = e.target.name.split('');
        const lastValue = parts[parts.length - 1];
        const indexValue = parseInt(lastValue, 10);
        setMultipleMedicalProviderandFacitlityName((prevNames) => {
            const updatedNames = [...prevNames];
            // Ensure the index is within the bounds of the array
            // if (indexValue >= 0 && indexValue < updatedNames.length) {
            updatedNames[indexValue] = name;
            console.log(updatedNames)
            // }
            return updatedNames;
        });
    }



    const medicalProvidersObject = (medicalRecordsFile, multipleMedicalProviderandFacitlityName, medicalBills, values) => {
        
        const medicalFiles = medicalRecordsFile.filter(item => item !== undefined && item.length !== 0);
        let medicalProviderandFacilityValues = [];
        multipleMedicalProviderandFacitlityName = multipleMedicalProviderandFacitlityName.filter(item => item !== undefined)
        for (let i = 0; i <= 6; i++) {
            const key = `medicalProviderandFacility${i}`;
            if (key in values) {
                medicalProviderandFacilityValues.push(values[key]);
            }
        }
        let medicalType = [];
        for (let i = 0; i <= 30; i++) {
            const key = `medicalType${i}`;
            if (key in values) {
                medicalType.push(values[key]);
            }
        }
        
        if (multipleMedicalProviderandFacitlityName) {
            medicalProviderandFacilityValues = [...medicalProviderandFacilityValues, ...multipleMedicalProviderandFacitlityName]
        }

        let updatedErrors
        const pairedArray = medicalFiles.map((file, index) => {
            
            const medicalProviderNames = medicalProviderandFacilityValues[index] || '';
            const medicalTypes = medicalType[index] ? medicalType[index] : 'All Other Medical Records'
            if (!medicalProviderNames) {
                //Set an error for this specific index
                // setErrors((prevErrors) => ({
                //     ...prevErrors,
                //     [`medicalProviderNames_${index}`]: 'ProviderName Required if Medical File is uploaded.',
                // }));
            } else if (error[`medicalProviderNames_${index}`]) {
                // Clear the error for this specific index if it exists
                const updatedErrors = { ...error };
                delete updatedErrors[`medicalProviderNames_${index}`];
                setErrors(updatedErrors);
            }

            const medicalProviderBills = medicalBills ? medicalBills[index] : '';

            return {
                fileArray: file,
                medicalProviderNames,
                medicalProviderBills,
                medicalTypes
            };
        });
        // 
        return pairedArray;
    }


    const onMedicalBillFileSelect = (files) => {
        files.preventDefault()
        const selectedFiles = files.target.files
        
        const parts = files.target.id.split('');
        const lastValue = parts[parts.length - 1];
        const indexValue = parseInt(lastValue, 10);

        const newMedicalBillFile = [...medicalBills];
        const newMedicalBillFileName = [...medicalBillName];

        for (let i = 0; i < selectedFiles.length; i++) {
            newMedicalBillFile[indexValue + i] = selectedFiles[i];
            newMedicalBillFileName[indexValue + i] = selectedFiles[i].name;
        }

        setMedicalBills((prevArray) => {
            const newArray = [...prevArray];
            newArray[indexValue] = [
                ...(newArray[indexValue] || []),
                ...newMedicalBillFile.filter(item => item !== undefined)
            ];
            const isNestedArray = (element) => Array.isArray(element);
            let flattenedData = newArray?.map(sublist => sublist?.filter(item => !isNestedArray(item)));
            
            return flattenedData;
        });

        setMedicalBillName((prevArray) => {
            const newArray = [...prevArray];
            newArray[indexValue] = [
                ...(newArray[indexValue] || []),
                ...newMedicalBillFileName.filter(item => item !== undefined)
            ];
            const isNestedArray = (element) => Array.isArray(element);
            let flattenedData = newArray?.map(sublist => sublist?.filter(item => !isNestedArray(item)));
            
            return flattenedData;
        });

        console.log(medicalRecordsFile);
        console.log(medicalRecordFileName);

    }

    const onMedicalRecordsFile = async (files, name) => {

        files.preventDefault()
        console.log(medicalProviderName);
        console.log(files);
        const selectedFiles = files.target.files
        
        const parts = files.target.id.slice(9);
        const lastValue = parts
        const indexValue = parseInt(lastValue, 10);

        const newMedicalRecordsFile = [...medicalRecordsFile];
        const newMedicalRecordFileName = [...medicalRecordFileName];

        for (let i = 0; i < selectedFiles.length; i++) {
            newMedicalRecordsFile[indexValue + i] = selectedFiles[i];
            newMedicalRecordFileName[indexValue + i] = selectedFiles[i].name;

        }

        setMedicalRecordsFile((prevArray) => {
            const newArray = [...prevArray];
            
            newArray[indexValue] = [
                ...(newArray[indexValue] || []),
                ...newMedicalRecordsFile.filter(item => item !== undefined)
            ]
            const isNestedArray = (element) => Array.isArray(element);
            let flattenedData = newArray?.map(sublist => sublist?.filter(item => !isNestedArray(item)));

            return flattenedData;
        });

        setMedicalRecordFileName((prevArray) => {
            const newArray = [...prevArray];
            
            newArray[indexValue] = [
                ...(newArray[indexValue] || []),
                ...newMedicalRecordFileName.filter(item => item !== undefined)
            ]
            const isNestedArray = (element) => Array.isArray(element);
            let flattenedData = newArray?.map(sublist => sublist?.filter(item => !isNestedArray(item)));
            return flattenedData;
        });



    }


    const onClickAddBtn = (e) => {
        
        e.preventDefault()
        const uuid = GenerateUUID();
        setMedicalProviderCounter((prevCounter) => {
            const newCounter = prevCounter.concat(uuid);
            return newCounter.filter((item) => item !== ',');
        });
    }

    const onClickMinusBtn = (e, value, index, innerIndex) => {
        
        e.preventDefault()
        const dataIndex = medicalProviderCounter.findIndex((element) => element === value);
        const outerIndex = index
        
        if (medicalRecordsFile.length) {
            setMedicalRecordsFile((prevMedicalRecordsFiles) => {
                let updatedValues = [...prevMedicalRecordsFiles].map(subArray =>
                    subArray ? subArray.filter(value => value !== undefined) : []
                );
                
                if (updatedValues[outerIndex]?.length > 1) {
                    
                    updatedValues[outerIndex] = updatedValues[outerIndex].forEach((x, index) => [])
                    // return updatedValues[outerIndex] = []
                    
                } else {
                    updatedValues[outerIndex] = updatedValues[outerIndex]?.filter((_, i) => i !== innerIndex);
                }

                if (updatedValues[outerIndex]?.length === 0) {
                    updatedValues.splice(outerIndex, 1);
                }

                return updatedValues;
            });

        }


        if (multipleMedicalProviderandFacitlityName.length) {
            setMultipleMedicalProviderandFacitlityName((prevMedicalRecordsFiles) => {
                let updatedValues = [...prevMedicalRecordsFiles]
                updatedValues = updatedValues.filter((_, index) => index !== outerIndex)
                if (updatedValues[outerIndex]?.length === 0) {
                    updatedValues.splice(outerIndex, 1);
                    // setMultipleMedicalProviderandFacitlityName([])
                }

                return updatedValues;
            });
        }


        if (medicalRecordFileName.length) {
            setMedicalRecordFileName((prevMedicalRecordFileName) => {
                let updatedValues = [...prevMedicalRecordFileName].map(subArray =>
                    subArray ? subArray.filter(value => value !== undefined) : []
                );
                if (updatedValues[outerIndex]?.length > 1) {
                    
                    updatedValues[outerIndex] = updatedValues[outerIndex].forEach((x, index) => [])
                    //  return updatedValues[outerIndex] = []
                } else {
                    updatedValues[outerIndex] = updatedValues[outerIndex]?.filter((_, i) => i !== innerIndex);
                }

                if (updatedValues[outerIndex]?.length === 0) {
                    updatedValues?.splice(outerIndex, 1);
                }
                return updatedValues;
            });
        }

        if (medicalBills.length) {
            setMedicalBills((prevMedicalRecordsFiles) => {
                const updatedValues = [...prevMedicalRecordsFiles].map(subArray =>
                    subArray ? subArray.filter(value => value !== undefined) : []
                );
                if (updatedValues[outerIndex]?.length > 1) {
                    
                    updatedValues[outerIndex] = updatedValues[outerIndex].forEach((x, index) => [])
                    //  return updatedValues[outerIndex] = []
                } else {
                    updatedValues[outerIndex] = updatedValues[outerIndex]?.filter((_, i) => i !== innerIndex);
                }
                if (updatedValues[outerIndex]?.length === 0) {
                    updatedValues.splice(outerIndex, 1);
                    setMedicalBills([])
                }

                return updatedValues;
            });
        }

        if (medicalBillName.length) {

            setMedicalBillName((prevMedicalRecordFileName) => {
                const updatedValues = [...prevMedicalRecordFileName].map(subArray =>
                    subArray ? subArray.filter(value => value !== undefined) : []
                );
                if (updatedValues[outerIndex]?.length > 1) {
                    
                    updatedValues[outerIndex] = updatedValues[outerIndex].forEach((x, index) => [])
                    //   return updatedValues[outerIndex] = []
                } else {
                    updatedValues[outerIndex] = updatedValues[outerIndex]?.filter((_, i) => i !== innerIndex);
                }


                if (updatedValues[outerIndex]?.length === 0) {
                    updatedValues.splice(outerIndex, 1);
                    setMedicalBillName([])
                }
                return updatedValues;
            });
        }
        setMedicalProviderCounter((preValues) => {
            const updatedData = [...preValues].filter((_, innerIndex) => innerIndex !== undefined)
            const filteredData = updatedData?.filter((element, i) => i !== dataIndex);
            
            return filteredData
        })
    }


    const deleteMedicalBill = (e, outerIndex, index) => {
        
        e.preventDefault()

        setMedicalBills((prevMedicalRecordsFiles) => {
            const updatedValues = [...prevMedicalRecordsFiles];
            updatedValues[outerIndex] = updatedValues[outerIndex].filter((_, i) => i !== index);
            if (updatedValues[outerIndex].length === 0) {
                updatedValues.splice(outerIndex, 1);
            }

            return updatedValues;
        });

        setMedicalBillName((prevMedicalRecordFileName) => {
            const updatedValues = [...prevMedicalRecordFileName];
            updatedValues[outerIndex] = updatedValues[outerIndex].filter((_, i) => i !== index);
            if (updatedValues[outerIndex].length === 0) {
                updatedValues.splice(outerIndex, 1);
            }
            return updatedValues;
        });

    }

    const deleteMedicalRecord = (e, outerIndex, index) => {
        
        setMedicalRecordsFile((prevMedicalRecordsFiles) => {
            const updatedValues = [...prevMedicalRecordsFiles]

            updatedValues[outerIndex] = updatedValues[outerIndex].filter((item, i) => item !== undefined);
            updatedValues[outerIndex] = updatedValues[outerIndex].filter((item, i) => i !== index);
            
            // if (updatedValues[outerIndex].length === 0) {
            //     updatedValues.splice(outerIndex, 1);
            // }

            return updatedValues;
        });


        setMedicalRecordFileName((prevMedicalRecordFileName) => {
            const updatedValues = [...prevMedicalRecordFileName];
            updatedValues[outerIndex] = updatedValues[outerIndex].filter((item, i) => i !== index);
            // if (updatedValues[outerIndex].length === 0) {
            //     updatedValues.splice(outerIndex, 1);
            // }
            return updatedValues;
        });
    };


    const onToggleDialog = (isDialogOpen) => {
        setIsModalOpen(isDialogOpen)
    }
    const onToggleMedicalBillDialog = (isMedicalBillModalOpen) => {
        setMedicalBillModalOpen(isMedicalBillModalOpen)
    }

    const openMedicalFileModal = (indexValues) => {
        
        setIndex(indexValues);
        setIsModalOpen(true)

    }

    const openMedicalBillModal = (indexValues) => {
        
        setIndex(indexValues);
        setMedicalBillModalOpen(true)

    }
    const validatoionSchema = Yup.object().shape({
        amount: Yup.string().required('Amount is required'),
        gender: Yup.string().required('Gender is required'),
        age: Yup.string().required('Age is required'),
        // fileInput: Yup.string(), // Define fileInput field
        // medicalProviderandFacility1: Yup.string().when('medicalProviderandFacility2', {
        //     is: (value) => !!value, // Checking if fileInput has a value (non-empty string)
        //     then: Yup.string().required('File name is required when uploading a file'),
        //     otherwise: Yup.string(), // Validation if fileInput doesn't have a value
        // }),

    })


    return (
        <>
            <Formik
                initialValues={{
                    // injuredBodyParts: '',
                    // painLevel: '',
                    // impactOfInjuries: '',
                    // impactOnLife: '',
                    amount: '',
                    gender: '',
                    age: '',
                    medicalProviderandFacility1: '',
                    medicalProviderandFacility2: '',
                    medicalProviderandFacility3: '',
                    medicalProviderandFacility4: '',
                    medicalProviderandFacility5: '',
                    medicalProviderandFacility6: '',
                    // medicalRecordsFile: '',
                    accidentScenes2: '',
                    accidentScenes3: '',
                    accidentScenes4: '',
                    accidentScenes5: '',
                    medicalBills1: '',
                    medicalBills2: '',
                    medicalBills3: '',
                    medicalBills4: '',
                    medicalBills5: '',
                    medicalType1: '',
                    medicalType2: '',
                    medicalType3: '',
                    medicalType4: '',
                    medicalType5: '',
                    medicalType6: '',
                    // fileInput: '',
                    // fileInput0: '',
                    // fileInput1: '',
                    // fileInput2: '',
                    // fileInput3: '',
                    // fileInput4: '',
                    // fileInput5: '',
                    // fileInput6: '',

                }}
                enableReinitialize={true}
                validationSchema={validatoionSchema}

                onSubmit={(values, { setSubmitting, setErrors, errors }) => {
                    let allHaveMedicalProviderNames = true;
                    values.injuredBodyPartsWithPainLevel = parseInjuredBodyPartsControlsValues(values);
                    values.medicalBillsandMedicalProvidersandMedicalBillAttachment = parseMedicalBillsandMedicalProvideraValues(values);
                    values.medicalBillRecordsPdf = pdfFile;
                    values.medicalRecordsFile = medicalProvidersObject(medicalRecordsFile, multipleMedicalProviderandFacitlityName, medicalBills, values);
                    setValues({ injury: values })
                    

                    values.medicalRecordsFile.forEach(item => {
                        if (!item.medicalProviderNames) {
                            allHaveMedicalProviderNames = false;
                        }
                    });

                    if (allHaveMedicalProviderNames) {
                        values.medicalRecordsFile.forEach(item => {
                            onSubmit({ injury: values });
                        });
                    }


                    
                }}
            >

                {({ setFieldValue, initialValues }) => (
                    <Form>
                        <div className="add-form p-0">
                            <div className="card">
                                <h2 className="title">Injuries Analysis</h2>
                                <div className="row">
                                    <div className='row'>
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <Field name="age" placeholder="Write age..." label="Age" type="number" component={TextInput} />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <Field name="gender"
                                                    label="Gender"
                                                    component={Dropdown}
                                                    defaultOption="Select Gender"
                                                    options={Constants.Dropdowns.MrMrs}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-4">

                                            <div className="form-group">
                                                <Field name="amount"
                                                    label="Future Annual Non-Economic Amount"
                                                    placeholder="Enter amount"
                                                    component={TextInput}
                                                    shouldUserRenderIcon={<>   <span style={{ position: 'absolute', color: '#18479a', paddingLeft: '18px', paddingTop: '12px' }}>$</span>    </>}
                                                    shouldDollarRender={true}
                                                    isDollarSignRender={true}

                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* <div className='bd-card' style={{ width: '100%' }}>
                                        <InjuredBodyPartsControl
                                            bodyPartFieldLabel='Injured body part'
                                            bodyPartFieldName='injuredBodyParts'
                                            painLevelFieldLabel='Level of pain'
                                            painLevelFieldName='painLevel'
                                            onAddClick={() => appendDuplicateInjuredBodyPartControl(setFieldValue)}
                                        />

                                        {duplicateInjuredBodyPartsControls.map(x => x.element)}

                                    </div> */}

                                    {/* <div className="col-md-12 mt-4">
                                    <div className="form-group">
                                        <Field name="medicalProviders" placeholder="Enter here" label="Medical Providers & Dates of Service" component={TextInput} />
                                    </div>
                                </div> */}
                                    {/* <div className="col-md-6 mt-3">
                                        <div className="form-group">
                                            <Field name="impactOnLife" placeholder="Write here..." label="Describe All Ongoing Pains or Complaints Caused by the Incident" component={TextArea} />
                                        </div>
                                    </div>



                                    <div className="col-md-6 mt-3">
                                        <div className="form-group">
                                            <Field name="impactOfInjuries" placeholder="Write here..." label="Describe Injury’s Negative Impacts on Your Life" component={TextArea} />
                                        </div>
                                    </div> */}

                                </div>


                                <div className="row">
                                    <div className="col-md-3">
                                        <div className='mt-2'>
                                            {/* <button className='add-btn-style' onClick={(e) => addMultipleMedicalRecordsandMedicalBillsForSingleProvider(e, 0)} style={{ position: 'absolute', marginLeft: '20.6rem', marginTop: '2rem', width: '3.5rem', height: '3rem' }}><i style={{ color: 'white' }} className="fa-solid fa-plus"></i></button> */}
                                            <Field name="medicalProviderandFacility1" placeholder="Write Medical Provider Name" label="Medical Provider / Facitlity" component={TextInput} />
                                        </div>
                                        <span style={{ color: 'red' }}>{error.medicalProviderNames_0}</span>

                                    </div>
                                    {

                                    }
                                    <div className="col-md-3" style={{ paddingTop: '2px', paddingLeft: '5px' }}>
                                        <div className='mt-2' >
                                            <label>Upload Provider Medical Records <i className="fa-solid fa-upload" style={{ paddingLeft: '2rem' }}></i>
                                            </label><br></br>
                                            <RenderIf shouldRender={medicalRecordFileName[0]?.length}>
                                                <div style={{ marginLeft: '17rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => { deleteMedicalRecord(e, 0, 0) }}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInput0" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18.4rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {/* <RenderIf shouldRender={}></> */}
                                                        {medicalRecordFileName[0]?.length ? (medicalRecordFileName[0][1]?.length > 1 ? medicalRecordFileName[0][0] : medicalRecordFileName[0][0]) : 'Upload Medical Record'}
                                                    </div>

                                                    {/* </div> */}
                                                </div>
                                            </label>

                                            <Field
                                                type="file"
                                                id="fileInput0"
                                                name="fileInput0"
                                                style={{ display: 'none' }}
                                                multiple
                                                onChange={(e) => {

                                                    // setFieldValue('fileInput', e.currentTarget.files[0]);


                                                    onMedicalRecordsFile(e)
                                                }}
                                            />

                                        </div>
                                        <RenderIf shouldRender={medicalRecordFileName[0]?.length}>
                                            {
                                                medicalRecordsFile?.filter((item, filterIndex) => filterIndex === 0 && item !== undefined)?.map((values, outerIndex) => (
                                                    values?.slice(1).map((record, innerIndex) => (
                                                        record ? (
                                                            <>
                                                                <span style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</span>
                                                                <div style={{ marginLeft: '17rem' }}>
                                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => { deleteMedicalRecord(e, 0, innerIndex) }}></i>
                                                                </div>
                                                                <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>
                                                                </div>

                                                            </>
                                                        ) : ''
                                                    ))
                                                ))
                                            }
                                        </RenderIf >

                                    </div>
                                    <div className="col-md-3 mt-2" style={{ paddingTop: '2px', paddingLeft: '5px' }}>
                                        <Field name="medicalType1"
                                            label="Medical Record Type"
                                            component={Dropdown}
                                            defaultOption="Select Type"
                                            options={Constants.Dropdowns.FileType}
                                        />
                                    </div>

                                    <div className="col-md-3" style={{ paddingTop: '2px', paddingLeft: '5px' }}>
                                        <div className='mt-2'>
                                            <label style={{ width: '25rem' }}>Upload Medical Bills <i className="fa-solid fa-upload" style={{ paddingLeft: '7.4rem' }} ></i>
                                            </label><br></br>
                                            <RenderIf shouldRender={medicalBillName[0]?.length}>
                                                <div style={{ marginLeft: '16.5rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => { deleteMedicalBill(e, 0, 0) }}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInputBill0" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '17.9rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {/* {medicalBillName[0] ? medicalBillName[0] : 'Upload Medical Bill'} */}
                                                        {medicalBillName[0]?.length ? (medicalBillName[0]?.length > 1 ? medicalBillName[0][0] : medicalBillName[0][0]) : 'Upload Medical Bill'}

                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInputBill0"
                                                name="fileInputBill0"
                                                style={{ display: 'none' }}
                                                multiple
                                                onChange={(e) => onMedicalBillFileSelect(e)}
                                            />
                                            <RenderIf shouldRender={medicalBillName[0]?.length}>
                                                {
                                                    medicalBillName?.filter((item, filterIndex) => filterIndex === 0 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <>
                                                                    <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                    <div style={{ marginLeft: '16.5rem' }}>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => deleteMedicalBill(e, 0, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '17.9rem', height: '3rem', backgroundColor: '#F2F2F2', }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                                    </div>
                                                                </>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>

                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3" >
                                        <div className='' style={{ marginTop: '5px' }}>
                                            {/* <button className='add-btn-style' onClick={(e) => addMultipleMedicalRecordsandmedicalBillNameForSingleProvider(e, 1)} style={{ position: 'absolute', marginLeft: '20.6rem', width: '3.5rem', height: '3rem' }}><i style={{ color: 'white' }} className="fa-solid fa-plus"></i></button> */}
                                            <Field name={`medicalProviderandFacility2`} placeholder="Write Medical Provider Name" type="text" component={TextInput} />
                                            <span style={{ color: 'red' }}>{error.medicalProviderNames_1}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3" style={{ paddingTop: '2px', paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalRecordFileName[1]?.length}>
                                                <div style={{ marginLeft: '17rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.4rem' }} onClick={(e) => deleteMedicalRecord(e, 1, 0)}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInput1" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18.4rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalRecordFileName[1]?.length ? (medicalRecordFileName[1][0]?.length > 1 ? medicalRecordFileName[1]?.filter(item => item !== undefined)[0] : medicalRecordFileName[1]?.filter(item => item !== undefined)[0]) : 'Upload Medical Record'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInput1"
                                                name="fileInput1"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalRecordsFile(e)}
                                            />
                                            <RenderIf shouldRender={medicalRecordFileName[1]?.length}>
                                                {
                                                    medicalRecordsFile?.filter((item, filterIndex) => filterIndex === 1 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <span style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</span>
                                                                    <div style={{ marginLeft: '17rem' }}>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => { e.stopPropagation(); deleteMedicalRecord(e, 1, innerIndex) }}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>

                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mt-1" style={{ paddingLeft: '5px' }}>
                                        <Field name="medicalType2"
                                            // label="Medical Record Type"
                                            component={Dropdown}
                                            defaultOption="Select Type"
                                            options={Constants.Dropdowns.FileType}
                                        />
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalBillName[1]?.length}>
                                                <div style={{ marginLeft: '16.5rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => { deleteMedicalBill(e, 1, 0) }}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInputBill1" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '17.9rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalBillName[1]?.length ? (medicalBillName[1]?.length > 1 ? medicalBillName[1][0] : medicalBillName[1][0]) : 'Upload Medical Bill'}

                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInputBill1"
                                                name="fileInputBill1"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalBillFileSelect(e)}
                                            />
                                            <RenderIf shouldRender={medicalBillName[1]?.length}>
                                                {
                                                    medicalBillName?.filter((item, filterIndex) => filterIndex === 1 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ marginLeft: '16.5rem' }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => deleteMedicalBill(e, 1, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '17.9rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3">
                                        <div className='' style={{ marginTop: '4px' }}>

                                            <Field name={`medicalProviderandFacility3`} placeholder="Write Medical Provider Name" type="text" component={TextInput} />
                                            <span style={{ color: 'red' }}>{error.medicalProviderNames_2}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            {/* <i className="fa-solid fa-trash" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }} onClick={() => openMedicalFileModal(2)}></i> */}
                                            <RenderIf shouldRender={medicalRecordFileName[2]?.length}>
                                                <div style={{ marginLeft: '17rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 2, 0)}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInput2" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18.4rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalRecordFileName[2]?.length ? (medicalRecordFileName[2]?.length > 1 ? medicalRecordFileName[2][0] : medicalRecordFileName[2][0]) : 'Upload Medical Record'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInput2"
                                                name="fileInput2"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalRecordsFile(e)}
                                            />
                                            <RenderIf shouldRender={medicalRecordFileName[2]?.length}>
                                                {
                                                    medicalRecordsFile?.filter((item, filterIndex) => filterIndex === 2 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ display: 'none' }}>{innerIndex + 1}</div>
                                                                    <div style={{ marginLeft: '17rem' }}>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 2, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mt-1" style={{ paddingLeft: '5px' }}>
                                        <Field name="medicalType3"
                                            // label="Medical Record Type"
                                            component={Dropdown}
                                            defaultOption="Select Type"
                                            options={Constants.Dropdowns.FileType}
                                        />
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalBillName[2]?.length}>
                                                <div style={{ marginLeft: '16.5rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => { deleteMedicalBill(e, 2, 0) }}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInputBill2" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalBillName[2]?.length ? (medicalBillName[2]?.length > 1 ? medicalBillName[2][0] : medicalBillName[2][0]) : 'Upload Medical Bill'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInputBill2"
                                                name="fileInputBill2"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalBillFileSelect(e)}
                                            />
                                            <RenderIf shouldRender={medicalBillName[2]?.length}>
                                                {
                                                    medicalBillName?.filter((item, filterIndex) => filterIndex === 2 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ marginLeft: '16.5rem' }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => deleteMedicalBill(e, 2, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3">
                                        <div className='' style={{ marginTop: '4px' }}>
                                            <Field name={`medicalProviderandFacility4`} placeholder="Write Medical Provider Name" type="text" component={TextInput} />
                                            <span style={{ color: 'red' }}>{error.medicalProviderNames_3}</span>
                                        </div>

                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            {/* <i className="fa-solid fa-trash" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }} onClick={() => openMedicalFileModal(3)}></i> */}
                                            <RenderIf shouldRender={medicalRecordFileName[3]?.length}>
                                                <div style={{ marginLeft: '17rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 3, 0)}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInput3" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18.4rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalRecordFileName[3]?.length ? (medicalRecordFileName[3].length > 1 ? medicalRecordFileName[3][0] : medicalRecordFileName[3][0]) : 'Upload Medical Record'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInput3"
                                                name="fileInput3"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalRecordsFile(e)}
                                            />
                                            <RenderIf shouldRender={medicalRecordFileName[3]?.length}>
                                                {
                                                    medicalRecordsFile?.filter((item, filterIndex) => filterIndex === 3 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div>
                                                                        <span style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</span>
                                                                        <div style={{ marginLeft: '17rem' }}>
                                                                            <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 3, innerIndex)}></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex + 1}</div>
                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mt-1" style={{ paddingLeft: '5px' }}>
                                        <Field name="medicalType4"
                                            // label="Medical Record Type"
                                            component={Dropdown}
                                            defaultOption="Select Type"
                                            options={Constants.Dropdowns.FileType}
                                        />
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalBillName[3]?.length}>
                                                <div style={{ marginLeft: '16.4rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => { deleteMedicalBill(e, 3, 0) }}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInputBill3" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalBillName[3]?.length ? (medicalBillName[3]?.length > 1 ? medicalBillName[3][0] : medicalBillName[3][0]) : 'Upload Medical Bill'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInputBill3"
                                                name="fileInputBill3"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalBillFileSelect(e)}
                                            />
                                            <RenderIf shouldRender={medicalBillName[3]?.length}>
                                                {
                                                    medicalBillName?.filter((item, filterIndex) => filterIndex === 3 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ marginLeft: '16.4rem' }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => deleteMedicalBill(e, 3, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3" >
                                        <div className='' style={{ marginTop: '2px' }}>
                                            <Field name={`medicalProviderandFacility5`} placeholder="Write Medical Provider Name" type="text" component={TextInput} />
                                            <span style={{ color: 'red' }}>{error.medicalProviderNames_4}</span>
                                        </div>

                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalRecordFileName[4]?.length}>
                                                <div style={{ marginLeft: '17rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 4, 0)}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInput4" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18.4rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalRecordFileName[4]?.length ? (medicalRecordFileName[4].length > 1 ? medicalRecordFileName[4][0] : medicalRecordFileName[4][0]) : 'Upload Medical Record'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInput4"
                                                name="fileInput4"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalRecordsFile(e)}
                                            />
                                            <RenderIf shouldRender={medicalRecordFileName[4]?.length}>
                                                {
                                                    medicalRecordsFile?.filter((item, filterIndex) => filterIndex === 4 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ marginLeft: '17rem' }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex + 1}</div>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 4, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mt-1" style={{ paddingLeft: '5px' }}>
                                        <Field name="medicalType5"
                                            // label="Medical Record Type"
                                            component={Dropdown}
                                            defaultOption="Select Type"
                                            options={Constants.Dropdowns.FileType}
                                        />
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalBillName[4]?.length}>
                                                <div style={{ marginLeft: '16.4rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => { deleteMedicalBill(e, 4, 0) }}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInputBill4" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-1" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalBillName[4]?.length ? (medicalBillName[4]?.length > 1 ? medicalBillName[4][0] : medicalBillName[4][0]) : 'Upload Medical Bill'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInputBill4"
                                                name="fileInputBill4"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalBillFileSelect(e)}
                                            />
                                            <RenderIf shouldRender={medicalBillName[4]?.length}>
                                                {
                                                    medicalBillName?.filter((item, filterIndex) => filterIndex === 4 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ marginLeft: '16.4rem' }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.3rem' }} onClick={(e) => deleteMedicalBill(e, 4, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                </div>


                                <div className="row">
                                    <div className="col-md-3">
                                        <div className='mt-2'>
                                            <Field name={`medicalProviderandFacility6`} placeholder="Write Medical Provider Name" type="text" component={TextInput} ref={medicalProviderName} />
                                            <span style={{ color: 'red' }}>{error.medicalProviderNames_5}</span>
                                        </div>
                                        {/* onInput={(e) => handleInput(e)} */}
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <div className=''>
                                            <RenderIf shouldRender={medicalRecordFileName[5]?.length}>
                                                <div style={{ marginLeft: '17rem' }}>
                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 5, 0)}></i>
                                                </div>
                                            </RenderIf>
                                            <label htmlFor="fileInput5" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18.4rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalRecordFileName[5]?.length ? (medicalRecordFileName[5].length > 1 ? medicalRecordFileName[5][0] : medicalRecordFileName[5][0]) : 'Upload Medical Record'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInput5"
                                                name="fileInput5"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalRecordsFile(e)}
                                            />
                                            <RenderIf shouldRender={medicalRecordFileName[5]?.length}>
                                                {
                                                    medicalRecordsFile?.filter((item, filterIndex) => filterIndex === 5 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                    <div style={{ marginLeft: '17rem' }}>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.2rem' }} onClick={(e) => deleteMedicalRecord(e, 5, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mt-2" style={{ paddingLeft: '5px' }}>
                                        <Field name="medicalType6"
                                            // label="Medical Record Type"
                                            component={Dropdown}
                                            defaultOption="Select Type"
                                            options={Constants.Dropdowns.FileType}
                                        />
                                    </div>
                                    <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                        <RenderIf shouldRender={medicalBillName[5]?.length}>
                                            <div style={{ marginLeft: '12.5rem' }}>
                                                <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.4rem' }} onClick={(e) => { deleteMedicalBill(e, 5, 0) }}></i>
                                            </div>
                                        </RenderIf>
                                        <div className='' style={{ display: 'flex' }}>

                                            <label htmlFor="fileInputBill5" style={{ cursor: 'pointer' }}>
                                                <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                                <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '14rem' }}>
                                                    <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                        {medicalBillName[5]?.length ? (medicalBillName[5]?.length > 1 ? medicalBillName[5][0] : medicalBillName[5][0]) : 'Upload Medical Bill'}
                                                    </div>
                                                </div>
                                            </label>
                                            <Field
                                                type="file"
                                                id="fileInputBill5"
                                                name="fileInputBill5"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={(e) => onMedicalBillFileSelect(e)}
                                            />

                                            <div className='add-icon' style={{ marginLeft: '0.6rem' }}>
                                                <button className='add-btn-style' onClick={(e) => onClickAddBtn(e)}><i className="fa-solid fa-plus"></i></button>
                                            </div>
                                        </div>
                                        <div>
                                            <RenderIf shouldRender={medicalBillName[5]?.length}>
                                                {
                                                    medicalBillName?.filter((item, filterIndex) => filterIndex === 5 && item !== undefined)?.map((values, outerIndex) => (
                                                        values?.slice(1).map((record, innerIndex) => (
                                                            record ? (
                                                                <div>
                                                                    <div style={{ marginLeft: '17rem' }}>
                                                                        <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                        <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1rem' }} onClick={(e) => deleteMedicalBill(e, 5, innerIndex)}></i>
                                                                    </div>
                                                                    <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                                    </div>
                                                                </div>
                                                            ) : ''
                                                        ))
                                                    ))
                                                }
                                            </RenderIf>
                                        </div>
                                    </div>

                                </div>


                                <RenderIf shouldRender={medicalProviderCounter}>
                                    <MedicalProvidersControl
                                        data={medicalProviderCounter}
                                        handleInput={(e, innerIndex) => handleInput(e, innerIndex)}
                                        onMedicalBillFileSelect={onMedicalBillFileSelect}
                                        medicalBillName={medicalBillName}
                                        medicalRecordFileName={medicalRecordFileName}
                                        onMedicalRecordsFile={onMedicalRecordsFile}
                                        onAddClickBtn={onClickAddBtn}
                                        setMedicalProviderCounter={setMedicalProviderCounter}
                                        medicalProviderCounter={medicalProviderCounter}
                                        medicalRecordsFile={medicalRecordsFile}
                                        setMedicalBillName={setMedicalBillName}
                                        medicalBills={medicalBills}
                                        setMedicalBills={setMedicalBills}
                                        setMedicalRecordFileName={setMedicalRecordFileName}
                                        multipleMedicalProviderandFacitlityName={multipleMedicalProviderandFacitlityName}
                                        setMultipleMedicalProviderandFacitlityName={setMultipleMedicalProviderandFacitlityName}
                                        onClickMinusBtn={(e, value, index, innerIndex) => onClickMinusBtn(e, value, index, innerIndex)}
                                        setMedicalRecordsFile={setMedicalRecordsFile} // Pass the setMedicalRecordsFile prop
                                        error={error}
                                        deleteMedicalBill={(e, outerIndex, innerIndex) => deleteMedicalBill(e, outerIndex, innerIndex)}
                                        deleteMedicalRecord={(e, outerIndex, innerIndex) => deleteMedicalRecord(e, outerIndex, innerIndex)}

                                    />

                                </RenderIf>
                                {/* </div>
                                    </div> */}

                            </div>

                        </div>
                        <div className="btns text-center mt-4">
                            <button className="btn-theme btn-outline me-3" onClick={stepDecrement}>Previous</button>
                            <button className="btn-theme" type="submit">Next</button>
                        </div>

                    </Form>
                )
                }
            </Formik >
            <RenderIf shouldRender={isModalOpen}>
                <DialogBox isModalOpen={isModalOpen} onToggleDialog={onToggleDialog} setIsModalOpen={setIsModalOpen} onMedicalRecordsFile={onMedicalRecordsFile}
                    index={index}
                    onMedicalBillFileSelect={onMedicalBillFileSelect}
                    medicalRecordFileName={medicalRecordFileName}
                    medicalBillName={medicalBillName}
                    medicalRecordsFile={medicalRecordsFile}
                    deleteMedicalBill={(e, index) => deleteMedicalBill(e, index)}
                    deleteMedicalRecord={(e, index) => deleteMedicalRecord(e, index)} />

            </RenderIf>
            <RenderIf shouldRender={isMedicalBillModalOpen}>
                <MedicalDialogBox
                    isModalOpen={isMedicalBillModalOpen} onToggleDialog={onToggleMedicalBillDialog} setMedicalBillModalOpen={setMedicalBillModalOpen} onMedicalRecordsFile={onMedicalRecordsFile}
                    index={index}
                    onMedicalBillFileSelect={onMedicalBillFileSelect}
                    medicalRecordFileName={medicalRecordFileName}
                    medicalBillName={medicalBillName}
                    medicalRecordsFile={medicalRecordsFile}
                    deleteMedicalBill={(e, index) => deleteMedicalBill(e, index)}
                    deleteMedicalRecord={(e, index) => deleteMedicalRecord(e, index)} />

            </RenderIf>



        </>
    )

}



const MedicalProvidersControl = ({ data, handleInput, onClickMinusBtn, onMedicalBillFileSelect, medicalBillName, medicalRecordFileName, onMedicalRecordsFile, error, openMedicalFileModal, openMedicalBillModal,
    multipleMedicalProviderandFacitlityName,
    deleteMedicalBill,
    deleteMedicalRecord,
    medicalRecordsFile
}) => {

    const removeMedicalProvider = (e, value, index, innerIndex) => {
        e.preventDefault();
        onClickMinusBtn(e, value, index, innerIndex)
    };

    let innerIndex
    return (
        <>
            <RenderIf shouldRender={data.length}>

                {
                    data.length && data.map((value, index) => (
                        <>
                            {console.log(value, index + 7)}
                            <span style={{ display: 'none' }}>{innerIndex = index - 1}{index = index + 7}{value} </span>
                            {/* <span >{innerIndex = index}{index = index + 6} </span> */}

                            <div className="row">
                                <div className="col-md-3" >
                                    <div className='mt-3'>
                                        <input name={`medicalProviderandFacilitys${index}`}
                                            placeholder="Write Medical Provider Name"
                                            type="text"
                                            onBlur={(e) => { handleInput(e, innerIndex) }}
                                            style={{ width: '18rem', height: '3.1rem', padding: '0.5rem', border: 'none', backgroundColor: '#F2F2F2', borderRadius: '4px' }}
                                        />

                                        <span style={{ color: 'red' }}>{error.medicalProviderNames_5}</span>
                                    </div>
                                    {/* onInput={(e) => handleInput(e)} */}
                                </div>
                                <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                    <div className='mt-2'>
                                        <RenderIf shouldRender={medicalRecordFileName[index]?.length}>
                                            <div style={{ marginLeft: '16.5rem' }}>
                                                <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => { deleteMedicalRecord(e, index, 0) }}></i>
                                            </div>
                                        </RenderIf>
                                        <label htmlFor={`fileInput${index}`} style={{ cursor: 'pointer' }}>
                                            <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                            <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '18rem' }}>
                                                <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                    {medicalRecordFileName[index]?.length ? (medicalRecordFileName[index].length > 1 ? medicalRecordFileName[index][0] : medicalRecordFileName[index][0]) : 'Upload Medical Record'}    </div>
                                            </div>
                                        </label>
                                        <Field
                                            type="file"
                                            id={`fileInput${index}`}
                                            name={`fileInput${index}`}
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => onMedicalRecordsFile(e)}
                                        />
                                        <RenderIf shouldRender={medicalRecordFileName[index]?.length}>
                                            {
                                                medicalRecordsFile?.filter((item, filterIndex) => filterIndex === index && item !== undefined)?.map((values, outerIndex) => (
                                                    values?.slice(1).map((record, innerIndex) => (
                                                        record ? (
                                                            <div>
                                                                <div style={{ marginLeft: '16.5rem' }}>
                                                                    <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                    <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.5rem' }} onClick={(e) => deleteMedicalRecord(e, index, innerIndex)}></i>
                                                                </div>
                                                                <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                    <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record?.name}</div>
                                                                </div>
                                                            </div>
                                                        ) : ''
                                                    ))
                                                ))
                                            }
                                        </RenderIf>
                                    </div>
                                </div>
                                <div className="col-md-3 mt-3" style={{ paddingLeft: '5px' }}>
                                    <Field name={`medicalType${index}`}
                                        // label="Medical Record Type"
                                        component={Dropdown}
                                        defaultOption="Select Type"
                                        options={Constants.Dropdowns.FileType}
                                    />
                                </div>
                                <div className="col-md-3" style={{ paddingLeft: '5px' }}>
                                    <RenderIf shouldRender={medicalBillName[index]?.length}>
                                        <div style={{ marginLeft: '12.5rem' }}>
                                            <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '2rem' }} onClick={(e) => { deleteMedicalBill(e, index, 0) }}></i>
                                        </div>
                                    </RenderIf>
                                    <div className='mt-2' style={{ display: 'flex' }}>
                                        <label htmlFor={`fileInputBill${index}`} style={{ cursor: 'pointer' }}>
                                            <i className="fa-solid fa-plus" style={{ position: 'absolute', paddingTop: '1.3rem', paddingLeft: '1rem' }}></i>
                                            <div className="fileInputStyle mt-2" style={{ backgroundColor: '#F2F2F2', borderRadius: '5px', height: '3rem', width: '14rem' }}>
                                                <div style={{ textAlign: 'center', height: '1px', paddingTop: '10px' }}>
                                                    {medicalBillName[index]?.length ? (medicalBillName[index].length > 1 ? medicalBillName[index][0] : medicalBillName[index][0]) : 'Upload Medical Bill'}
                                                </div>
                                            </div>
                                        </label>
                                        <Field
                                            type="file"
                                            id={`fileInputBill${index}`}
                                            name={`fileInputBill${index}`}
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => onMedicalBillFileSelect(e)}
                                        />
                                        <div className='add-icon' style={{ marginLeft: '1rem' }}>
                                            <button className='add-btn-style' onClick={(e) => removeMedicalProvider(e, value, index, innerIndex)}><i className="fa-solid fa-minus"></i></button>  </div>
                                    </div>

                                    <RenderIf shouldRender={medicalBillName[index]?.length}>
                                        {
                                            medicalBillName?.filter((item, filterIndex) => filterIndex === index && item !== undefined)?.map((values, outerIndex) => (
                                                values?.slice(1).map((record, innerIndex) => (
                                                    record ? (
                                                        <div>
                                                            <div style={{ marginLeft: '17rem' }}>
                                                                <div style={{ display: 'none' }}>{innerIndex = innerIndex + 1}</div>
                                                                <i className='fa-solid fa-trash' style={{ position: 'absolute', width: '20px', height: '20px', paddingTop: '1.1rem' }} onClick={(e) => deleteMedicalBill(e, index, innerIndex)}></i>
                                                            </div>
                                                            <div className='mt-2' key={`${outerIndex}_${innerIndex}`} style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '18.5rem', height: '3rem', backgroundColor: '#F2F2F2', }}>

                                                                <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', marginTop: '0.7rem', }}>{record}</div>
                                                            </div>
                                                        </div>
                                                    ) : ''
                                                ))
                                            ))
                                        }
                                    </RenderIf>
                                </div>

                            </div>

                        </>
                    ))

                }
            </RenderIf>
        </>
    )



}



const DialogBox = ({
    isModalOpen, onToggleDialog, setIsModalOpen, onMedicalRecordsFile,
    onMedicalBillFileSelect,
    medicalRecordFileName,
    medicalBillName,
    deleteMedicalBill,
    deleteMedicalRecord,
    medicalRecordsFile,
    index
}) => {
    return (<>
        <Dialog
            isModalOpen={isModalOpen}
            onToggleDialog={(isDialogOpen) => onToggleDialog(isDialogOpen)}
            mode="semi-half"
            isCloseIconHidden={true}
        >

            <div className="row">
                <div className="col-md-12 mt-2">
                    <h4>Medical Providers/Facility Name</h4>
                    {
                        medicalRecordsFile?.length ?
                            <table id="myTable" class="display dataTable no-footer mt-4" aria-describedby="myTable_info">
                                <thead >
                                    <tr >
                                        <th style={{ width: "5px" }}>S.No</th>
                                        <th style={{ width: "200px" }}>ProvidersName</th>
                                        <th style={{ width: "50px" }}>Action</th>

                                    </tr>
                                </thead>
                                <tbody>

                                    {
                                        // medicalRecordsFile?.length && medicalRecordsFile?.map((values, index1) => {
                                        //     return <tr>
                                        //         <td>{index1 + 1}</td>
                                        //         <td>{values.name}</td>
                                        //         <td>{<i className='fa-solid fa-trash' onClick={() => deleteMedicalRecord(index, index1)}></i>}</td>
                                        //     </tr>
                                        // })
                                        medicalRecordsFile?.filter((item, filterIndex) => filterIndex === index && item !== undefined)?.map((values, outerIndex) => (
                                            values?.map((record, innerIndex) => (
                                                record ? ( // Check if 'record' is defined
                                                    <tr key={`${outerIndex}_${innerIndex}`}>
                                                        <td>{innerIndex + 1}</td>
                                                        <td>{record?.name}</td>
                                                        <td>
                                                            <i className='fa-solid fa-trash' onClick={() => deleteMedicalRecord(index, innerIndex)}></i>
                                                        </td>
                                                    </tr>
                                                ) : ''
                                            ))
                                        ))
                                    }
                                </tbody>
                            </table>

                            : "No List"
                    }
                    <button className="btn-theme btn-outline" style={{ marginLeft: '10px' }} onClick={() => setIsModalOpen(false)}>Close</button>
                </div>
            </div>

        </Dialog >
    </>)
}



const MedicalDialogBox = ({
    isModalOpen, onToggleDialog, setMedicalBillModalOpen,
    onMedicalRecordsFile,
    index,
    onMedicalBillFileSelect,
    medicalRecordFileName,
    medicalBillName,
    medicalRecordsFile,
    deleteMedicalBill,
    deleteMedicalRecord
}) => {
    return (<>
        <Dialog
            isModalOpen={isModalOpen}
            onToggleDialog={(isDialogOpen) => onToggleDialog(isDialogOpen)}
            mode="semi-half"
            isCloseIconHidden={true}
        >

            <div className="row">
                <div className="col-md-12 mt-2">
                    <h4>Medical Providers Bills</h4>
                    {
                        medicalBillName?.length ?
                            <table id="myTable" class="display dataTable no-footer mt-4" aria-describedby="myTable_info">
                                <thead >
                                    <tr >
                                        <th style={{ width: "5px" }}>S.No</th>
                                        <th style={{ width: "200px" }}>ProvidersName</th>
                                        <th style={{ width: "50px" }}>Action</th>

                                    </tr>
                                </thead>
                                <tbody>

                                    {
                                        // medicalBillName?.length && medicalBillName?.map((values, index1) => {
                                        //     return <tr>
                                        //         <td>{index1 + 1}</td>
                                        //         <td>{values.name}</td>
                                        //         <td>{<i className='fa-solid fa-trash' onClick={() => deleteMedicalRecord(index, index1)}></i>}</td>
                                        //     </tr>
                                        // })
                                        medicalBillName?.filter((item, filterIndex) => filterIndex === index && item !== undefined)?.map((values, outerIndex) => (
                                            values?.map((record, innerIndex) => (
                                                record ? ( // Check if 'record' is defined
                                                    <tr key={`${outerIndex}_${innerIndex}`}>
                                                        <td>{innerIndex + 1}</td>
                                                        <td>{record}</td>
                                                        <td>
                                                            <i className='fa-solid fa-trash' onClick={() => deleteMedicalBill(index, innerIndex)}></i>
                                                        </td>
                                                    </tr>
                                                ) : ''
                                            ))
                                        ))
                                    }
                                </tbody>
                            </table>

                            : "No Bill"
                    }
                    <button className="btn-theme btn-outline" style={{ marginLeft: '10px' }} onClick={() => setMedicalBillModalOpen(false)}>Close</button>
                </div>
            </div>

        </Dialog >
    </>)
}




const MedicalRecordItem = ({ index, onMedicalRecordsFile, medicalRecordFileName, deleteMedicalRecord }) => {
    return (
        <div className="col-md-6">
            <button
                className="add-btn-style"
                type="button"
                onClick={() => deleteMedicalRecord(index)}
                style={{ position: "absolute", marginLeft: "25.6rem", width: "3.5rem", height: "3rem" }}
            >
                <i style={{ color: "white" }} className="fa-solid fa-trash"></i>
            </button>
            <div style={{ marginLeft: "29.4rem", marginBottom: "0.5rem" }}>
                <label htmlFor={`fileInput${index}`} style={{ cursor: "pointer" }}>
                    <div className="fileInputStyle" style={{ backgroundColor: "#F2F2F2", borderRadius: "5px", height: "3rem", width: "20.8rem" }}>
                        <div style={{ textAlign: "center", height: "1px", paddingTop: "10px" }}>
                            {medicalRecordFileName[index] ? medicalRecordFileName[index] : "Upload Medical Record"}
                        </div>
                    </div>
                </label>
                <Field
                    key={index}
                    type="file"
                    id={`fileInput${index}`}
                    name={`fileInput${index}`}
                    style={{ display: "none" }}
                    onChange={(e) => onMedicalRecordsFile(e, index)}
                />
            </div>
        </div>
    );
};





const MedicalBillItem = ({ index, onMedicalBillFileSelect, medicalBillName, deleteMedicalBill, deleteDuplicateFormFields }) => {
    return (
        <div className="col-md-6">
            <div style={{ marginLeft: "12.8rem" }}>
                <button
                    className="add-btn-style"
                    type="button"
                    onClick={() => deleteMedicalBill(index)}
                    style={{ position: "absolute", marginLeft: "0.2rem", width: "3.5rem", height: "3rem" }}
                >
                    <i style={{ color: "white" }} className="fa-solid fa-trash"></i>
                </button>
                <button
                    className="add-btn-style"
                    type="button"
                    onClick={() => deleteDuplicateFormFields(index)}
                    style={{ position: "absolute", marginLeft: "21rem", marginBottom: "5rem", width: "3.5rem", height: "3rem" }}
                >
                    <i style={{ color: "white" }} className="fa-solid fa-minus"></i>
                </button>

                <label htmlFor={`fileInputBill${index}`} style={{ cursor: "pointer" }}>
                    <div className="fileInputStyle" style={{ backgroundColor: "#F2F2F2", borderRadius: "5px", height: "3rem", width: "18rem" }}>
                        <div style={{ textAlign: "center", height: "1px", paddingTop: "10px" }}>
                            {medicalBillName[index] ? medicalBillName[index] : "Upload Medical Bill"}
                        </div>
                    </div>
                </label>

                <Field
                    key={index}
                    type="file"
                    id={`fileInputBill${index}`}
                    name={`fileInputBill${index}`}
                    style={{ display: "none" }}
                    onChange={(e) => onMedicalBillFileSelect(e, index)}
                />
            </div>
        </div>
    );
};

const AddMultipleMedicalRecordsandMedicalBillsForSingleProvider = ({
    multipleMedicalRecordsandMedicalBillsForSingleProviderCounter,
    onMedicalRecordsFile,
    onMedicalBillFileSelect,
    medicalRecordFileName,
    medicalBillName,
    deleteMedicalBill,
    deleteMedicalRecord,
    deleteDuplicateFormFields,
    addMultipleMedicalRecordsandMedicalBillsForSingleProvider

}) => {

    return (
        <div>
            {multipleMedicalRecordsandMedicalBillsForSingleProviderCounter.length > 0 && (
                multipleMedicalRecordsandMedicalBillsForSingleProviderCounter.map((value, index) => (
                    <div key={index} className="row" style={{ display: "flex", width: "77rem" }}>
                        <MedicalRecordItem index={index} onMedicalRecordsFile={onMedicalRecordsFile} medicalRecordFileName={medicalRecordFileName} deleteMedicalRecord={deleteMedicalRecord} />
                        <MedicalBillItem index={index} onMedicalBillFileSelect={onMedicalBillFileSelect} medicalBillName={medicalBillName} deleteMedicalBill={deleteMedicalBill} deleteDuplicateFormFields={deleteDuplicateFormFields} />
                    </div>
                ))
            )}
        </div>
    );
};


const InjuredBodyPartsControl = ({ bodyPartFieldName, bodyPartFieldLabel, painLevelFieldName, painLevelFieldLabel, onAddClick, onMinusClick, id }) => {
    return <div className='row' style={{ display: 'flex', alignItems: 'center' }}>
        <div className="col-md-7">
            <div className="form-group" style={{ width: '95%' }} >
                <Field name={bodyPartFieldName}
                    label={bodyPartFieldLabel}
                    component={Dropdown}
                    defaultOption="Select body part"
                    options={Constants.Dropdowns.BodyParts}
                />
            </div>

        </div>
        <div className='col-md-3'>
            <div className="form-group">
                <Field name={painLevelFieldName}
                    label={painLevelFieldLabel}
                    component={Dropdown}
                    defaultOption="Select level of pain"
                    options={Constants.Dropdowns.LevelOfPain}
                />

            </div>
        </div>

        <RenderIf shouldRender={onAddClick}>
            <div className="col-md-2" style={{ maxWidth: "70px", position: 'absolute', right: '9.4rem', top: '9.7rem' }}>
                <div className="add-icon" >
                    <button type='button' className="add-btn-style" onClick={onAddClick}><i className="fa-solid fa-plus"></i></button>
                </div>
            </div>
        </RenderIf>

        <RenderIf shouldRender={onMinusClick}>
            <div className="col-md-2" style={{ maxWidth: "70px", paddingBottom: '2rem' }}>
                <div className="add-icon" >
                    <button type='button' className="add-btn-style" onClick={() => onMinusClick(id)}><i className="fa-solid fa-minus"></i></button>
                </div>
            </div>
        </RenderIf>
    </div>
}

const MedicalBillsandMedicalProviders = ({ MedicalProviderLabel, MedicalBillAmountLabel, nameOfMedicalProvider, medicalBillsAmount, medicalBillsAttachment, onInjuryFileSelect, medicalBillName }) => {
    return (
        <>
            <div className="col-md-6">
                <div className="form-group">
                    <Field name={nameOfMedicalProvider} placeholder="Write here..." label={MedicalProviderLabel} component={TextInput} />
                </div>
                <div className="form-group">
                    <Field name={medicalBillsAmount} placeholder="Write here..." label={MedicalBillAmountLabel} component={TextInput} />
                </div>
                <div className="form-group">
                    <button className="btn-theme " >Add More Bills</button>
                </div>
            </div>
            <div className="col-md-6">
                <div className="form-group mb-0">
                    <label for="exampleFormControlTextarea1" className="form-label">{medicalBillsAttachment}
                    </label>
                    <div className="file-upload">
                        <div className="text text-center">
                            <Field name="medicalBillsAttachment" component={FileUpload} onFileSelected={onInjuryFileSelect} documentName='injuryFile' />
                            <i className="fa-solid fa-upload"></i>
                            <p>{medicalBillName ? medicalBillName : "Upload file type .pdf, .jpg, .png"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default InjuriesAnalysisForm;