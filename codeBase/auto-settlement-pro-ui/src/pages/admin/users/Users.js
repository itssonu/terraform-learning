import React, { useState, useEffect } from "react";

import { AddEditUserDialog } from "./components";
import useSortableData from "../../../components/customHook/SortableTable";
import LoggedInUserService from "../../../services/AuthService";
import { RenderIf } from "../../../components";
import EditDialog from "./components/EditDialog";
import '../style.css';
import { useDispatch, useSelector } from "react-redux";
import { confirm } from "../../../utils/swal";
import { userLimitReachedHtml } from "../../../utils/constant";
import { setUser } from "../../../redux/actions/users";
import useAxios from "../../../hooks/useAxios";
import Constants from "../../../Constants";
import { toaster } from "../../../utils/toast";
import XLoader from "../../../components/common/XLoader";
import { debounce } from "../../../utils/helper";
import { ReactComponent as EditButtonIcon } from "../../../assets/icons/EditButtonIcon.svg";

const Users = () => {
    const [isAddUserDialogOpened, setIsAddUserDialogOpened] = useState(false);
    const [isEditUserDialogOpened, setisEditUserDialogOpened] = useState(false);
    const [AddDialog, setAddDialog] = useState(false);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const { items: listUsers, requestSort, sortConfig } = useSortableData(usersList, { direction: "sorting_asc", key: "firstName.lastName" });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState("")
    const [showEntries, setShowEntries] = useState(10)
    const [selectedUser, setSelectedUser] = useState(null);
    const { isAdmin = false, subscription = {} } = useSelector((state) => state.users || {});
    const remainingUser = subscription?.remainingUser || 0;
    const dispatch = useDispatch();
    const { getData: getUserFetchData, isLoading: getUserIsLoading, postData } = useAxios()

    useEffect(() => {
        getUsers();
    }, [currentPage, searchText, showEntries, isSubmittingForm])

    const getUsers = async () => {
        const url = `${Constants.ApiUrl.user.getUsers}?pageNumber=${currentPage}&limit=${showEntries}&searchText=${searchText}`;
        const { success, data, message } = await getUserFetchData(url);
        if (success) {
            const { users, totalCount, totalPages, subscription } = data;
            setUsersList(users);
            setTotalPages(totalPages);
            setTotalCount(totalCount);
            dispatch(setUser({ subscription }));
        } else {
            toaster({ message, success });
        }
    };

    const onAddEditUserSubmit = (isAdd, formData, setErrors) => {

        setIsSubmittingForm(true);
        if (isAdd) {
            addUser(formData, setErrors);
            return;
        }
    }
    const onEditUserSubmit = (isAdd, formData, setErrors, selectedUser) => {

        setIsSubmittingForm(true);
        if (isAdd) {
            editUser(formData, setErrors, selectedUser);
            return;
        }
    }

    const editUser = (formData, setErrors, selectedUser) => {

        const data = LoggedInUserService.GetLoggedInUserData();
        const values = {
            confirmPassword: formData.confirmPassword,
            email: formData.email,
            firstName: formData.firstName,
            isAdmin: formData.isAdmin,
            lastName: formData.lastName,
            mobileNumber: formData.mobileNumber,
            password: formData.password,
            _id: selectedUser?._id,
            domainName: data.domainName,
        }
        console.log(formData, data, values, "formData in edit user");
        postData(Constants.ApiUrl.user.updateUser, values).then(resp => {
            onFormSubmitted();
        }).catch(err => {
            setErrors({ ...err?.response?.data?.message })
            setIsSubmittingForm(false);
            setSelectedUser(false);

        })


    }
    const addUser = (formData, setErrors) => {
        const data = LoggedInUserService.GetLoggedInUserData();
        const values = {
            confirmPassword: formData.confirmPassword,
            email: formData.email,
            firstName: formData.firstName,
            isAdmin: formData.isAdmin,
            lastName: formData.lastName,
            mobileNumber: formData.mobileNumber,
            password: formData.password,
            domainName: data.domainName ? data.domainName : "",
        }
        console.log(formData, data, values, "formData");

        postData(Constants.ApiUrl.user.add, values).then(resp => {
            onFormSubmitted();
        }).catch(err => {
            setErrors({ ...err?.response?.data?.message })
            setIsSubmittingForm(false);
            //  onFormSubmitted();
        })

    }

    const onFormSubmitted = () => {
        setIsSubmittingForm(false);
        setIsAddUserDialogOpened(false);
        setSelectedUser(false);
    }
    const handlePageChange = (event, pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getClassNamesFor = (name) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };
    const handleEdit = (user) => {
        console.log(user, "UpdateUser");
        setisEditUserDialogOpened(true);
        setSelectedUser(user);
        setIsSubmittingForm(false);
    };

    const openAddDialog = async () => {

        if (remainingUser <= 0) {
            const result = await confirm({ title: 'Subscription Limit Reached', html: userLimitReachedHtml });
            if (result.isConfirmed) {
                setIsAddUserDialogOpened(true);
                setAddDialog(true)
            }
        } else {
            setIsAddUserDialogOpened(true);
            setAddDialog(true)
        }
    }

    const handleSearchInputChange = (e) => {
        setSearchText(e.target.value)
    };

    const debouncedHandleSearchChange = debounce(handleSearchInputChange, 500);

    const getPages = () => {
        if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
        return [1, 2, 3, "...", totalPages - 1, totalPages];
    };

    return (
        <section className='content-wrapper'>
            <div class="container layout-container case-form">
                <div className="listing template-listing">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <span style={{ fontSize: '40px', color: 'black', fontFamily: 'Baskerville', fontWeight: 'bold' }}>Users</span>
                        </div>
                        <div class="col-md-6 d-flex">
                            <div className="position-relative" style={{ width: '75%' }}>
                                <input
                                    onChange={debouncedHandleSearchChange}
                                    type="search"
                                    className="form-control"
                                    placeholder="Search Users"
                                    aria-controls="myTable"
                                    style={{
                                        height: '50px',
                                        color: '#292B2E',
                                        fontSize: '16px',
                                        borderRadius: '5px',
                                        paddingLeft: '10px'
                                    }}
                                />
                                <i
                                    className="fa-solid fa-magnifying-glass position-absolute"
                                    style={{
                                        left: '90%',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'blue'
                                    }}
                                ></i>
                            </div>
                            {isAdmin && <button onClick={() => openAddDialog()} class="btn btn-theme ms-2" style={{ height: '50px', width: '120px' }}>
                                <i class="fa-solid fa-plus me-2"></i> Add User</button>}
                        </div>
                    </div>
                    <RenderIf shouldRender={AddDialog}>
                        <AddEditUserDialog
                            isDialogOpened={isAddUserDialogOpened}
                            onToggleDialog={setIsAddUserDialogOpened}
                            onSubmit={onAddEditUserSubmit}
                            isSubmittingForm={isSubmittingForm}
                        />
                    </RenderIf>
                    {getUserIsLoading && <div className='tableLoader'>
                        <XLoader />
                    </div>}
                    <RenderIf shouldRender={!getUserIsLoading}>
                        <table class="table table-bordered case-list-table mt-5">
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort('firstName.lastName')} className={`sorting ${getClassNamesFor("firstName.lastName")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "370.875px" }}>Name</th>
                                    <th onClick={() => requestSort('email')} className={`sorting ${getClassNamesFor("email")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "310.038px" }}>Email Address</th>
                                    <th onClick={() => requestSort('mobileNumber')} className={`sorting ${getClassNamesFor("mobileNumber")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "250.475px" }} >Phone Number</th>
                                    <th onClick={() => requestSort('firstName')} className={`sorting ${getClassNamesFor("firstName")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "219.012px" }}>Added Cases</th>
                                    {isAdmin && <th onClick={() => requestSort('firstName')} className={`sorting ${getClassNamesFor("firstName")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "219.012px" }}>Edit</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    listUsers?.map((user, i) => (
                                        <tr>
                                            <td>
                                                {/* <img src="images/user.png" class="img-fluid me-2" /> */}
                                                <span>{user?.firstName} {user?.lastName}</span>
                                            </td>
                                            <td>{user?.email}</td>
                                            <td>{user?.mobileNumber}</td>
                                            <td>{user?.casesCount}</td>
                                            {isAdmin && <td>
                                                <button className='outline-btn-hover btn btn-theme btn-border btn-sm me-3' type='button' onClick={() => handleEdit(user)} style={{ minWidth: "auto" }}>
                                                    <EditButtonIcon />
                                                </button>
                                            </td>}
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex gap-6 align-items-center">
                                <span class="page-count">Showing 1 to {showEntries} of {totalCount} entries</span>
                                <div>
                                    <select value={showEntries} onChange={(e) => setShowEntries(parseInt(e.target.value))} className='form-select d-inline w-auto'>
                                        <option value="10">10 per page</option>
                                        <option value="25">25 per page</option>
                                        <option value="50">50 per page</option>
                                        <option value="100">100 per page</option>
                                    </select>
                                </div>
                            </div>
                            <nav>
                                <ul className="pagination mb-0 gap-2">
                                    {totalPages > 1 && (
                                        <ul className="pagination mb-0 d-flex align-items-center">
                                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                                <span className="page-link" onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}>
                                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M2.86875 7.25H12V5.75H2.86875L7.06875 1.55L6 0.5L0 6.5L6 12.5L7.06875 11.45L2.86875 7.25Z" fill="#2277C9" />
                                                    </svg>
                                                </span>
                                            </li>
                                            {getPages().map((page, index) => (
                                                <li key={index} className={`page-item ${currentPage === page ? "active" : ""}`}>
                                                    <span style={{ cursor: 'pointer' }} className="page-link" onClick={() => typeof page === "number" && handlePageChange(page)}>
                                                        {page}
                                                    </span>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                                <span className="page-link" onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}>
                                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9.13125 7.25H0V5.75H9.13125L4.93125 1.55L6 0.5L12 6.5L6 12.5L4.93125 11.45L9.13125 7.25Z" fill="#2277C9" />
                                                    </svg>
                                                </span>
                                            </li>
                                        </ul>
                                    )}
                                </ul>
                            </nav>
                        </div>
                    </RenderIf>
                    <RenderIf shouldRender={selectedUser}>
                        <EditDialog
                            isDialogOpened={isEditUserDialogOpened}
                            onToggleDialog={setisEditUserDialogOpened}
                            onSubmit={onEditUserSubmit}
                            isSubmittingForm={isSubmittingForm}
                            selectedUser={selectedUser}
                        />
                    </RenderIf>
                </div>
            </div>
        </section>

    )
}

export default Users;