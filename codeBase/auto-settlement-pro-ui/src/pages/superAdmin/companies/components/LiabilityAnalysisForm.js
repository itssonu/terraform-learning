import React, { useRef, useState, useEffect } from 'react';
import { Field, Formik, Form } from 'formik'
import * as Yup from 'yup'
import { TextInput, DatePicker, Dropdown, FileUpload, TextArea, RenderIf } from '../../../components';
import Constants from '../../../../Constants';
import { Checkbox } from '@mui/material';
import { storeLiablityEstern } from '../../../../redux/actions/liabilty';
import { useSelector, useDispatch } from 'react-redux';


const LiabilityAnalysisForm = ({ onSubmit, onPoliceReportUpload, onAccidentSecnesUpload, onBodyInjuryUpload }) => {
  const accidentSceneFilesName = useRef([]);
  const bodyInjuryFilesName = useRef([]);
  const dispatch = useDispatch();
  const liability = useSelector(state => state.liability.liability);
  const [caseName, setcaseName] = useState('');
  const [description, setdescription] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [ssn, setSsn] = useState('');
  const [faulterName, setFaulterName] = useState('');
  const [policeReportUpload, setPoliceReportUpload] = useState([]);
  const [fileName, setFileName] = useState('');

  const [accidentFilesUpload, seAccidentFilesUpload] = useState([]);
  const [accidentSceneFiles, setAccidentSceneFiles] = useState([]);
  const [selectedAccidentFiles, setSelectedAccidentFiles] = useState([]);
  const [bodyInjuryFilesUpload, setBodyInjuryFilesUpload] = useState([]);
  const [renderBodyInjury, setRenderBodyInjury] = useState([]);
  const [selectedBodyInjury, setSelectedBodyInjury] = useState([]);

  const [formValues, setFormValues] = useState({})
  const [shouldRenderIncindentDescription, setShouldRenderIncidentDescription] = useState(false)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log(liability, "libality");

    if (liability.length > 0) {
      setFormValues(liability[0]);
      setcaseName(liability[0].caseName);
      setDate(liability[0].date);
      setName(liability[0].name);
      setSsn(liability[0].ssn);
      setFaulterName(liability[0].faulterName)
      setAccidentSceneFiles(liability[0].accidentPic)
      seAccidentFilesUpload(liability[0].accidentScenes)
      setFileName(liability[0].policeReport[0]?.name);
      accidentSceneFilesName.current = liability[0].accidentSceneFilesName?.current;
      setSelectedAccidentFiles(liability[0].selectedAccidentFiles);
      bodyInjuryFilesName.current = liability[0].bodyInjuryFilesName?.current;
      setBodyInjuryFilesUpload(liability[0].bodyInjuryFilesUpload);
      setRenderBodyInjury(liability[0].renderBodyInjury);
      setSelectedBodyInjury(liability[0].selectedBodyInjury);
      
      if (liability[0].policeReport.length === 0) {
        setShouldRenderIncidentDescription(true)
        setdescription(liability[0].description)
      } else {
        setPoliceReportUpload(liability[0].policeReport)
        setShouldRenderIncidentDescription(false)
      }
    }
  }, [liability]);

  const onFileSelected = async (files) => {
    const requiredType = "pdf"
    const fileType = files?.path?.split('.').pop()

    if (files?.file?.length > 1) {
      setFileName('Multiple Police Reports is selected');
    } else {
      setFileName(files?.file[0]?.name);
    }
    setPoliceReportUpload(files.file)
    setdescription("")

  }


  const onAccidentSecnesFile = (files) => {
    const newFilesArray = [];
    const filesNamesArray = [];
    const uploadedFiles = [];
    for (let i = 0; i < files.file.length; i++) {
      const file = files.file[i];
      if (accidentSceneFilesName.current.includes(file.name)) {
        continue;
      }
      uploadedFiles.push(file)
      filesNamesArray.push(file.name)
      if (file instanceof Blob || file instanceof File) {
        newFilesArray.push(URL.createObjectURL(file));
      }
    }
    setAccidentSceneFiles([...accidentSceneFiles, ...newFilesArray]);
    accidentSceneFilesName.current = [...accidentSceneFilesName.current, ...filesNamesArray]
    seAccidentFilesUpload([...accidentFilesUpload, ...uploadedFiles])

  }

  const handleSelectAccidentFile = (fileName) => {
    if (selectedAccidentFiles.includes(fileName)) {
      setSelectedAccidentFiles(selectedAccidentFiles.filter(item => item !== fileName));
    } else {
      setSelectedAccidentFiles([...selectedAccidentFiles, fileName]);
    }
  }
  const removeAccidentFile = (indexNumber, fileName) => {
    const updatedAccidentSceneFiles = accidentSceneFiles.filter((_, index) => index !== indexNumber);
    const updatedAccidentFilesUpload = accidentFilesUpload.filter((_, index) => index !== indexNumber);
    accidentSceneFilesName.current = accidentSceneFilesName.current.filter((file) => file !== fileName);
    setAccidentSceneFiles(updatedAccidentSceneFiles);
    seAccidentFilesUpload(updatedAccidentFilesUpload);
    setSelectedAccidentFiles(selectedAccidentFiles.filter(item => item !== fileName));
  }


  const handlebodyInjuryFiles = (files) => {
    const newFilesArray = [];
    const filesNamesArray = [];
    const uploadedFiles = [];

    for (let i = 0; i < files.file.length; i++) {
      const file = files.file[i];
      if (bodyInjuryFilesName.current.includes(file.name)) {
        continue;
      }
      uploadedFiles.push(file)
      filesNamesArray.push(file.name)
      if (file instanceof Blob || file instanceof File) {
        newFilesArray.push(URL.createObjectURL(file));
      }
    }
    setRenderBodyInjury([...renderBodyInjury, ...newFilesArray]);
    bodyInjuryFilesName.current = [...bodyInjuryFilesName.current, ...filesNamesArray];
    setBodyInjuryFilesUpload([...bodyInjuryFilesUpload, ...uploadedFiles])
  }

  const handleSelectBodyInjuryFile = (fileName) => {
    if (selectedBodyInjury.includes(fileName)) {
      setSelectedBodyInjury(selectedBodyInjury.filter(item => item !== fileName));
    } else {
      setSelectedBodyInjury([...selectedBodyInjury, fileName]);
    }
  }
  const removeBodyInjuryFile = (indexNumber, fileName) => {
    const renderFiles = renderBodyInjury.filter((_, index) => index !== indexNumber);
    const updateFilesUpload = bodyInjuryFilesUpload.filter((_, index) => index !== indexNumber);
    bodyInjuryFilesName.current = bodyInjuryFilesName.current.filter((file) => file !== fileName);
    setRenderBodyInjury(renderFiles);
    setBodyInjuryFilesUpload(updateFilesUpload);
    setSelectedBodyInjury(selectedBodyInjury.filter(item => item !== fileName));
  }

  let formvalues = {};
  const validatoionSchema = Yup.object().shape({

    date: Yup.string().required('Date of Incident is required'),
    state: Yup.string().required('State of incident is required'),
    name: Yup.string().required('Name is required'),
    ssn: Yup.string().required('SSN is required'),
    description: shouldRenderIncindentDescription ? Yup.string().required('Description is required') : '',
    faulterName: Yup.string().required('At-Fault Party Name is Required')
  })


  return (
    <Formik
      initialValues={{
        caseName: caseName === "" ? values.caseName : caseName,
        caseType: values ? values.caseType : 'Individual',
        date: date === "" ? values.date : date,
        state: 'California',
        name: name === "" ? values.name : name,
        description: description === "" ? "" : description,
        faulterName: faulterName === "" ? values.faulterName : faulterName,
        policeReport: values ? values.policeReport : policeReportUpload,
        accidentScenes: '',
        insuranceCompanyName: values ? values.insuranceCompanyName : '',
        ssn: ssn === "" ? values.ssn : ssn,
      }}
      enableReinitialize={true}
      validationSchema={validatoionSchema}
      onSubmit={async (values) => {
        setFormValues(values)
        formvalues = { ...formvalues, ...values }
        console.log(values, "values");

        const updatedFormValues = {
          ...formValues, ...values,
          policeReport: values?.description !== "" ? [] : policeReportUpload,
          accidentScenes: accidentFilesUpload,
          accidentPic: accidentSceneFiles,
          accidentSceneFilesName: accidentSceneFilesName,
          selectedAccidentFiles: selectedAccidentFiles, // Replace 'paramNameToUpdate' with the parameter name you want to update
          bodyInjuryFilesName: bodyInjuryFilesName,
          bodyInjuryFilesUpload: bodyInjuryFilesUpload,
          renderBodyInjury: renderBodyInjury,
          selectedBodyInjury: selectedBodyInjury,
        };
        console.log(formvalues, updatedFormValues, policeReportUpload, "formvalues")
        dispatch(storeLiablityEstern([
          updatedFormValues
        ]));
        setValues({ liability: values })
        onSubmit({ liability: { ...values, selectedAccidentFiles, selectedBodyInjury } })
        onPoliceReportUpload(policeReportUpload)
        onAccidentSecnesUpload(accidentFilesUpload)
        onBodyInjuryUpload(bodyInjuryFilesUpload)
      }}
    >
      {() => (
        <Form>
          <div className="add-form p-0">
            <div className="card">
              <h2 className="title">Liability Analysis
              </h2>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <Field name="caseName" placeholder="Enter Case Name" label="Case Name" component={TextInput} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <Field name="caseType"
                      label="Individual/Multiple"
                      component={Dropdown}
                      defaultOption={'Individual'}
                      options={Constants.Dropdowns.CaseTypes}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <Field name="date" label="Date of Incident" component={DatePicker}
                    />

                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <Field name="state"
                      label="State Where Incident Occurred"
                      component={Dropdown}
                      defaultOption="California"
                      options={Constants.Dropdowns.States}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <Field name="name" placeholder="Enter Name" label="Name (Plaintiff Name)" component={TextInput} />
                  </div>
                  <div className="form-group">
                    <Field name="faulterName" placeholder="Enter Name" label="Name of At-Fault Party" component={TextInput} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <Field name="ssn" placeholder="Write SSN" label="SSN" component={TextInput} isSSN={true} />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-0">
                    <RenderIf shouldRender={!shouldRenderIncindentDescription}>
                      <label for="exampleFormControlTextarea1" className="form-label">Attach Police Report (If Available)</label>
                      <div style={{ marginLeft: '41.8rem', marginTop: '-32px' }}>
                        No Police Report
                        <button onClick={() => { setShouldRenderIncidentDescription(true) }} style={{
                          marginLeft: '15px',
                          marginBottom: '5px', width: '100px', border: 'none', borderRadius: '20px', backgroundColor: '#18479A', color: 'white'
                        }}>Click here</button>
                      </div>
                      <div className="file-upload">
                        <div className="text text-center">
                          <Field name="policeReport" component={FileUpload} multiplefileUpload={true} onFileSelected={onFileSelected} documentName='policeReport' />
                          <i className="fa-solid fa-upload"></i>
                          {errors.policeReport && <div style={{ color: 'red' }}>{errors.policeReport}</div>}
                          <p>{fileName ? fileName.length > 1 ? fileName : 'Multiple Files Selected' : "Upload file type .pdf, .jpg, .png"}</p>
                        </div>
                      </div>
                    </RenderIf>
                    <div className="form-group">
                      <RenderIf shouldRender={shouldRenderIncindentDescription}>
                        <div className="form-group">
                          <span style={{ position: 'absolute', marginLeft: '43.4rem' }}>
                            Police Report
                            <button onClick={() => { setShouldRenderIncidentDescription(false) }} style={{
                              marginLeft: '15px',
                              width: '100px', border: 'none', borderRadius: '20px', backgroundColor: '#18479A', color: 'white'
                            }}>Click here</button>
                          </span>
                          <Field name="description" placeholder="Write here..." label="Describe Incident (if no police report)" component={TextArea} height={20.6} />
                        </div>
                      </RenderIf>
                    </div>
                  </div>
                </div>

                {/* Police Report images */}
                <div className="col-md-6">
                  <div className="form-group mb-0">
                    <label for="exampleFormControlTextarea1" className="form-label">Attach Photographs of Accident Scene and Property Damage (If Available)</label>
                    <div className="file-upload" >
                      {accidentSceneFiles.length > 0 &&
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', border: "2px solid rgb(24, 71, 154)", gap: "10px", maxHeight: "330px", overflowY: "scroll", padding: "10px", marginBottom: "20px" }}>
                          {accidentSceneFiles.map((fileUrl, index) => (
                            <div key={`img-${index}`} style={{ background: "#fff", border: "1px solid #000" }}>
                              <div key={`img-${index}`} style={{ textAlign: "end" }}>
                                <button type='button' style={{ backgroundColor: "#18479a", color: "#fff" }} onClick={() => removeAccidentFile(index, accidentSceneFilesName.current[index])}>
                                  X
                                </button>
                              </div>
                              <label >
                                <div style={{ display: 'flex', alignItems: "center" }}>
                                  <Checkbox id={`img-${index}`} color="success"
                                    sx={{
                                      '& .MuiSvgIcon-root': { fontSize: 28 }
                                    }}
                                    checked={selectedAccidentFiles.includes(accidentSceneFilesName.current[index])}
                                    onChange={() => handleSelectAccidentFile(accidentSceneFilesName.current[index])}
                                  />

                                  <p style={{ margin: '0' }}>{accidentSceneFilesName.current[index]}</p>
                                </div>
                                <img key={index} src={fileUrl} alt={`Preview ${index}`} style={{ width: '100%', objectFit: 'contain' }} />
                              </label>
                            </div>
                          ))}
                        </div>
                      }
                      <div className="text text-center" style={{ position: 'relative' }}>
                        <Field name="accidentScenes" component={FileUpload} accept=".jpg,.jpeg,.png" multiplefileUpload={true} onFileSelected={onAccidentSecnesFile} documentName='accidentScenes' />
                        <i className="fa-solid fa-upload"></i>
                        {accidentSceneFiles.length > 0 ?
                          accidentSceneFiles.map((fileUrl, index) => (
                            <p style={{ margin: '0' }}>{accidentSceneFilesName.current[index]}</p>
                          ))
                          :
                          <p>Upload file type .jpg, .png</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Injury Report images */}
                <div className="col-md-6">
                  <div className="form-group mb-0">
                    <label for="exampleFormControlTextarea1" className="form-label">Attach Bodily Injury Photographs</label>
                    <div className="file-upload" >
                      {renderBodyInjury.length > 0 &&
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', border: "2px solid rgb(24, 71, 154)", gap: "10px", maxHeight: "330px", overflowY: "scroll", padding: "10px", marginBottom: "20px" }}>
                          {renderBodyInjury.map((fileUrl, index) => (
                            <div key={`img-${index}`} style={{ background: "#fff", border: "1px solid #000" }}>
                              <div key={`img-${index}`} style={{ textAlign: "end" }}>
                                <button type='button' style={{ backgroundColor: "#18479a", color: "#fff" }} onClick={() => removeBodyInjuryFile(index, bodyInjuryFilesName.current[index])}>
                                  X
                                </button>
                              </div>
                              <label >
                                <div style={{ display: 'flex', alignItems: "center" }}>
                                  <Checkbox id={`img-${index}`} color="success"
                                    sx={{
                                      '& .MuiSvgIcon-root': { fontSize: 28 }
                                    }}
                                    checked={selectedBodyInjury.includes(bodyInjuryFilesName.current[index])}
                                    onChange={() => handleSelectBodyInjuryFile(bodyInjuryFilesName.current[index])}
                                  />

                                  <p style={{ margin: '0' }}>{bodyInjuryFilesName.current[index]}</p>
                                </div>
                                <img key={index} src={fileUrl} alt={`Preview ${index}`} style={{ width: '100%', objectFit: 'contain' }} />
                              </label>
                            </div>
                          ))}
                        </div>
                      }
                      <div className="text text-center" style={{ position: 'relative' }}>
                        <Field name="accidentScenes" component={FileUpload} accept=".jpg,.jpeg,.png" multiplefileUpload={true} onFileSelected={handlebodyInjuryFiles} documentName='InjuryPhoto' />
                        <i className="fa-solid fa-upload"></i>
                        {renderBodyInjury.length > 0 ?
                          renderBodyInjury.map((fileUrl, index) => (
                            <p style={{ margin: '0' }}>{bodyInjuryFilesName.current[index]}</p>
                          ))
                          :
                          <p>Upload file type .jpg, .png</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div className="btns text-center">
              <button className="btn-theme" type="submit">Next</button>
            </div>
          </div>
        </Form>
      )
      }
    </Formik>
  )


}

export default LiabilityAnalysisForm;