import React, { useState, useEffect } from "react";

import { AddEditUserDialog } from "./components";
import ReactPagination from "../../../components/common/Pagination";
import useSortableData from "../../../components/customHook/SortableTable";
import { useNavigate } from "react-router-dom";
import useAxios from "../../../hooks/useAxios";
import Constants from "../../../Constants";

const SuperUsers = () => {

    const [isAddUserDialogOpened, setIsAddUserDialogOpened] = useState(false);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [usersList, setusersList] = useState([]);
    const { items: listUsers, requestSort, sortConfig } = useSortableData(usersList, { direction: "sorting_asc", key: "firstName.lastName" });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, settotalCount] = useState("");
    const [totalPages, settotalPages] = useState(0);
    const [searchText, setsearchText] = useState("")
    const [showEntries, setshowEntries] = useState(10)
    const navigate = useNavigate();
    const { getData, postData } = useAxios()

    useEffect(() => {
        getUsers();
    }, [currentPage, searchText, showEntries, isSubmittingForm])

    const getUsers = () => {
        getData(`${Constants.ApiUrl.user.getUsers}?pageNumber=${currentPage}&limit=${showEntries}&searchText=${searchText}`).then(resp => {
            setusersList(resp?.data.users);
            settotalPages(resp?.data?.totalPages);
            settotalCount(resp?.data?.totalCount)
            console.log(resp, "resp");
        }).catch((err) => {
            if (err?.response?.status === 401) {
                localStorage.clear();
                navigate('/account/login')
            }
        })

    }
    const onAddEditUserSubmit = (isAdd, formData, setErrors) => {

        setIsSubmittingForm(true);
        if (isAdd) {
            addUser(formData, setErrors);
            return;
        }
    }

    const addUser = (formData, setErrors) => {

        postData(Constants.ApiUrl.user.add, formData).then(resp => {
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

    return (
        <section className='content-wrapper'>
            <div class="container layout-container case-form">
                <div className="listing">
                    <div class="title d-flex justify-content-between align-items-center">
                        <span>List of all users</span>
                        {/* <button class="btn btn-theme" onClick={() => setIsAddUserDialogOpened(true)}><i class="fa-solid fa-plus me-2"></i> Add User</button> */}
                    </div>
                    <AddEditUserDialog
                        isDialogOpened={isAddUserDialogOpened}
                        onToggleDialog={setIsAddUserDialogOpened}
                        onSubmit={onAddEditUserSubmit}
                        isSubmittingForm={isSubmittingForm}
                    />
                    <div id="myTable_wrapper" class="dataTables_wrapper no-footer">
                        <div class="dataTables_length" id="myTable_length">
                            <label>
                                Show
                                <select value={showEntries} onChange={(e) => setshowEntries(parseInt(e.target.value))} name="myTable_length" aria-controls="myTable" class="">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                entries
                            </label>
                        </div>
                        <div id="myTable_filter" class="dataTables_filter"><label>Search:<input value={searchText} onChange={(e) => setsearchText(e.target.value)} type="search" class="" placeholder="" aria-controls="myTable" /></label></div>
                        <table id="myTable" class="display dataTable no-footer" aria-describedby="myTable_info">
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort('firstName.lastName')} className={`sorting ${getClassNamesFor("firstName.lastName")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "370.875px" }}>Name</th>
                                    <th onClick={() => requestSort('email')} className={`sorting ${getClassNamesFor("email")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "310.038px" }}>Email Address</th>
                                    <th onClick={() => requestSort('mobileNumber')} className={`sorting ${getClassNamesFor("mobileNumber")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "250.475px" }} >Phone Number</th>
                                    <th onClick={() => requestSort('firstName')} className={`sorting ${getClassNamesFor("firstName")}`} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} style={{ width: "219.012px" }}>Added Cases</th></tr>
                            </thead>
                            <tbody>
                                {
                                    listUsers?.map((user, i) => (
                                        <tr class="odd">
                                            <td class="user-name sorting_1">
                                                {/* <img src="images/user.png" class="img-fluid me-2" /> */}
                                                <span>{user?.firstName} {user?.lastName}</span>
                                            </td>
                                            <td>{user?.email}</td>
                                            <td>{user?.mobileNumber}</td>
                                            <td>{user?.numCases}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                        <div class="dataTables_info" id="myTable_info" role="status" aria-live="polite">Showing 1 to {showEntries} of {totalCount} entries</div>
                        {totalPages > 1 && <div class="dataTables_paginate paging_simple_numbers" id="myTable_paginate">
                            <ReactPagination
                                activePage={currentPage}
                                totalItemCount={totalPages}
                                onChange={handlePageChange}
                            />
                        </div>}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SuperUsers;
