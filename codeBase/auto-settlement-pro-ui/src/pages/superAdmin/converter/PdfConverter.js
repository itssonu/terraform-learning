import React, { useState } from 'react'
import { Field, Formik, Form  } from 'formik'
import * as Yup from 'yup'
import { FileUpload } from '../../../components'
import { useNavigate } from 'react-router-dom'
import { PdfConverterService } from '../../../api-services'
import Loader from '../../../components/common/Loader'

const PdfConverter = () => {
    let navigate = useNavigate();
    const [fileUploading, setfileUploading] = useState(false)
    const validationSchema = Yup.object().shape({
        filesReport: Yup.mixed()
            .required("File is required")
            .test("type", "Only the following formats are accepted: .pdf ", (value) => {
                return value && value[0].type === 'application/pdf'
            }),
    });
    const onProfileUpload = (files, setFieldValue) => {
        setFieldValue('filesReport', files?.file)

    }
    const onSubmit = (values , resetForm ) => {
        console.log(values.filesReport);
        let formData = new FormData();
        let files = [...values.filesReport]
        if (Array.isArray(files)) {
            files.forEach((file, index) => {
                formData.append(`filesReport`, file);
            });
        }
        setfileUploading(true);
        PdfConverterService.pdfConverter(formData)
            .then((res) => {
                console.log(res?.data)
                handleDownload(res?.data)
                setfileUploading(false);
                resetForm();
                
            })
            .catch((err) => {
                setfileUploading(false);
            });
    };

    const handleDownload = (pdfUrl) => {
        fetch(pdfUrl)
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = "generated.pdf";
            link.click();
            window.URL.revokeObjectURL(link.href);
        })
        .catch(error => {
            console.error('Error downloading PDF:', error);
        });
       
    };  

    if (fileUploading)
        return <Loader isGeneratingPdf={fileUploading} />
    return (
        <Formik
            initialValues={{
                filesReport: ""
            }}
            validationSchema={validationSchema}
            enableReinitialize={true}
            onSubmit={(values , {resetForm }) => {
                onSubmit(values , resetForm )
            }}
        >
            {({ errors, touched, isSubmitting, setFieldValue }) => {
                return (
                    <Form>
                        <div className="wrapper add-form">
                            <div className="content">
                                <div className="title">
                                    <h2>Upload Pdf</h2>
                                </div>
                                <div className="card mb-5">
                                    <div className="col-md-12">
                                        <div className="file-upload bd-card profile">
                                            <div className="position-relative">
                                                <Field name="filesReport" component={FileUpload} multiplefileUpload={true} onFileSelected={(files) => onProfileUpload(files, setFieldValue)} />
                                                <div className="text text-center">
                                                    <i className="fa-solid fa-upload"></i>
                                                    <p>Upload only file type .pdf</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="content">
                            <div className="btns text-end">
                                <a href="javascript:void(0)" onClick={() => navigate('/cases')} className="btn btn-theme btn-outline me-3">Cancel</a>
                                <button type='submit' className="btn btn-theme">Save</button>
                            </div>
                        </div>
                    </Form>
                )
            }}
        </Formik>
    )
}

export default PdfConverter