import React from 'react';

import AddEditUserForm from './AddEditUserForm';
import { ClipLoader } from 'react-spinners';

const AddEditUserDialog = ({ isDialogOpened, onToggleDialog, onSubmit, isSubmittingForm }) => {

    return (
        <>
            {isDialogOpened && (
                <div className="modal user-modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add User</h5>
                                <button type="button" onClick={() => onToggleDialog(false)} className="close-btn d-flex align-items-center">
                                    Close <i className="fa fa-times ms-2" aria-hidden="true"></i>
                                </button>
                            </div>
                            <ClipLoader
                                color={'#18479A'}
                                loading={isSubmittingForm}
                                size={30}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                                cssOverride={{ position: 'absolute', left: '50%', top: '50%' }}
                            />
                            <AddEditUserForm
                                isSubmittingForm={isSubmittingForm}
                                onSubmit={onSubmit}
                                onCancel={() => onToggleDialog(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default AddEditUserDialog;