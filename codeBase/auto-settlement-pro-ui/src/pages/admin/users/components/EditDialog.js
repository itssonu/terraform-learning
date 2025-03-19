import React from 'react';

import AddEditUserForm from './AddEditUserForm';

const EditDialog = ({ isDialogOpened, onToggleDialog, onSubmit, isSubmittingForm, selectedUser }) => {

    return (
        <>
            {isDialogOpened && (
                <div className="modal user-modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit User</h5>
                                <button type="button" onClick={() => onToggleDialog(false)} className="close-btn d-flex align-items-center">
                                    Close <i className="fa fa-times ms-2" aria-hidden="true"></i>
                                </button>
                            </div>
                            <AddEditUserForm
                                isSubmittingForm={isSubmittingForm}
                                onSubmit={onSubmit}
                                onCancel={() => onToggleDialog(false)}
                                selectedUser={selectedUser}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )

}

export default EditDialog;