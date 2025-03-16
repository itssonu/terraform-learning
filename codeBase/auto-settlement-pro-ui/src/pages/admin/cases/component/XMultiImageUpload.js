import { useState, useEffect } from 'react';
import { Field } from 'formik';
import { FileUpload } from '../../../../components';
import './XMultiImageUpload.css';

const XMultiImageUpload = ({
    label,
    acceptedFileTypes = ".jpg,.jpeg,.png",
    name,
    initialFiles = [],
    onChange
}) => {
    const [filesData, setFilesData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (initialFiles?.length > 0) {
            const initialFileObjects = initialFiles.map(v => ({
                id: Math.random().toString(36).substr(2, 9),
                url: v?.url,
                name: v?.name,
                isSelected: !!v?.isSelected,
                s3UrlPath: v?.s3UrlPath,
                file: v?.file,
            }));
            setFilesData(initialFileObjects);
        }
    }, [initialFiles]);

    const handleFiles = (files) => {
        const newFiles = Array.from(files.file).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            url: URL.createObjectURL(file),
            name: file.name,
            isSelected: false,
        }));

        // Filter out duplicates based on filename
        const uniqueNewFiles = newFiles.filter(newFile =>
            !filesData.some(existingFile => existingFile.name === newFile.name)
        );

        const updatedFiles = [...filesData, ...uniqueNewFiles];
        setFilesData(updatedFiles);
        onChange(updatedFiles);
    };

    const handleSelectFile = (id) => {
        const updatedFiles = filesData.map(fileData =>
            fileData.id === id
                ? { ...fileData, isSelected: !fileData.isSelected }
                : fileData
        );
        setFilesData(updatedFiles);
        onChange(updatedFiles);
    };

    const removeFile = (id) => {
        const updatedFiles = filesData.filter(fileData => fileData.id !== id);
        setFilesData(updatedFiles);
        onChange(updatedFiles);
    };


    const nextImage = () => {
        setCurrentIndex((currentIndex + 1) % filesData.length);
    };

    const previousImage = () => {
        setCurrentIndex((currentIndex - 1 + filesData.length) % filesData.length);
    };


    const openModal = (i) => {
        setCurrentIndex((currentIndex + i) % filesData.length);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentIndex(0);
        setIsModalOpen(false);
    };

    return (
        <>
            {isModalOpen &&
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header justify-content-between">
                                <h6 className="modal-title">{filesData[currentIndex]?.name}</h6>
                                <button type="button" className="btn-close" onClick={() => { closeModal() }}></button>
                            </div>
                            <div className="modal-body">
                                <img src={filesData[currentIndex]?.url} alt={`${currentIndex + 1}`} className="img-fluid mx-auto d-block" />
                            </div>
                            <div className="modal-footer d-flex align-items-center justify-content-between">
                                <button type='button' className="btn btn-link" onClick={previousImage}>Previous</button>
                                <span className="footer-text">{`${currentIndex + 1} of ${filesData.length} ${label}`}</span>
                                <button type='button' className="btn btn-link" onClick={nextImage}>Next</button>
                            </div>
                        </div>
                    </div>
                </div>}
            <div className="form-group mb-0">
                <div className='report-section'>
                    {filesData.length > 0 && (
                        <div class="row g-3 mb-3">
                            <div class="col-md-12 col-sm-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                                {filesData.map((fileData, index) => (
                                    <div class="image-card position-relative me-3 mb-3">
                                        <img key={fileData} src={fileData.url} alt={fileData?.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                        <div class="hover-action-icons">
                                            <button onClick={() => removeFile(fileData.id)} type='button' class="btn btn-sm btn-light me-2"><svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.8335 15.5C2.37516 15.5 1.9828 15.3368 1.65641 15.0104C1.33002 14.684 1.16683 14.2917 1.16683 13.8333V3H0.333496V1.33333H4.50016V0.5H9.50016V1.33333H13.6668V3H12.8335V13.8333C12.8335 14.2917 12.6703 14.684 12.3439 15.0104C12.0175 15.3368 11.6252 15.5 11.1668 15.5H2.8335ZM11.1668 3H2.8335V13.8333H11.1668V3ZM4.50016 12.1667H6.16683V4.66667H4.50016V12.1667ZM7.8335 12.1667H9.50016V4.66667H7.8335V12.1667Z" fill="#686C74" />
                                            </svg>
                                            </button>
                                            <button onClick={() => { openModal(index) }} type='button' class="btn btn-sm btn-light"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0 14V7.77778H1.55556V11.3556L11.3556 1.55556H7.77778V0H14V6.22222H12.4444V2.64444L2.64444 12.4444H6.22222V14H0Z" fill="#686C74" />
                                            </svg>
                                            </button>
                                        </div>
                                        <div className='image-info'>
                                            <div style={{ gap: 4, display: 'inline-flex', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                <input type='checkbox' checked={fileData.isSelected} onChange={() => handleSelectFile(fileData.id)} />
                                                <div style={{ color: '#686C74', fontSize: 14, fontFamily: 'Open Sans', fontWeight: '400', wordWrap: 'break-word' }}>{fileData.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div class="upload-area">
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
                        <Field name="files" component={FileUpload} accept={acceptedFileTypes} multiplefileUpload={true} onFileSelected={handleFiles} />

                    </div>
                </div>
            </div>
        </>
    );
};

export default XMultiImageUpload;