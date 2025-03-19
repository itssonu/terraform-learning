import React, { useState, useEffect } from "react";

import useSortableData from "../../../components/customHook/SortableTable";
import { useNavigate } from "react-router-dom";
import AddCompaniesForm from "./components/AddCompaniesForm";
import { RenderIf } from "../../../components";
import { ReactComponent as EditButtonIcon } from "../../../assets/icons/EditButtonIcon.svg";

import EditCompaniesForm from "./components/EditCompaniesForm";
import { parseAndFormatUtcDate } from "../../../Utils";
import { debounce } from "../../../utils/helper";
import Constants from "../../../Constants";
import useAxios from "../../../hooks/useAxios";
import { toaster } from "../../../utils/toast";
import { ReactComponent as NextArrowIcon } from "../../../../src/assets/icons/NextArrowIcon.svg";
import { ReactComponent as BackArrowIcon } from "../../../../src/assets/icons/BackArrowIcon.svg";

const Companies = () => {

   const [isSubmittingForm, setIsSubmittingForm] = useState(false);
   const [companiesList, setcompaniesList] = useState([]);
   const { items: listCompanies, requestSort, sortConfig } = useSortableData(companiesList, { direction: "sorting_asc", key: "firstName.lastName" });
   const [currentPage, setCurrentPage] = useState(1);
   const [totalCount, settotalCount] = useState("");
   const [totalPages, settotalPages] = useState(0);
   const [searchText, setsearchText] = useState("")
   const [showEntries, setshowEntries] = useState(10)
   const [selectedUser, setSelectedUser] = useState(null);
   const { getData: geCompaniesFetchData, postData } = useAxios()

   const navigate = useNavigate();

   useEffect(() => {
      if (!isSubmittingForm) {
         getCompanies();
      }
   }, [currentPage, searchText, showEntries, isSubmittingForm])

   const getCompanies = async () => {
      const url = `${Constants.ApiUrl.companies.getCompanies}?pageNumber=${currentPage}&limit=${showEntries}&searchText=${searchText}`;
      const { success, data, message } = await geCompaniesFetchData(url);
      if (success) {
         const { companies, totalCount, totalPages } = data;
         setcompaniesList(companies);
         settotalPages(totalPages);
         settotalCount(totalCount)
      } else {
         toaster({ message, success });
      }
   }

   const onAddEditUserSubmit = (isAdd, formData, setErrors) => {

      setIsSubmittingForm(true);
      if (isAdd) {
         addUser(formData, setErrors);
         return;
      }
   }
   const onCloseform = () => {
      setTimeout(() => {
         postData(Constants.ApiUrl.logout.logout).then((res) => {
            console.log(res, "res in  master databse switch");
            getCompanies();

         }).catch(err => {

         })
      }, 5000);

      setIsSubmittingForm(false);
      setSelectedUser(false);

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
      setSelectedUser(user);
   };
   const launchCompanyWebsite = () => {
      localStorage.clear();
      navigate('/account/login')
   };

   const handleSearchInputChange = (e) => {
      setsearchText(e.target.value)
   };

   const debouncedHandleSearchChange = debounce(handleSearchInputChange, 500);

   const getPages = () => {
      if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
      return [1, 2, 3, "...", totalPages - 1, totalPages];
   };

   return (
      <section className='content-wrapper'>
         <div class="container layout-container case-form">
            <div className='listing template-listing'>
               <RenderIf shouldRender={!isSubmittingForm && !selectedUser}>
                  <div class="row align-items-center">
                     <div class="col-md-6">
                        <span style={{ fontSize: '40px', color: 'black', fontFamily: 'Baskerville', fontWeight: 'bold' }}>Companies</span>
                     </div>
                     <div class="col-md-6 d-flex">
                        <div className="position-relative" style={{ width: '75%' }}>
                           <input
                              onChange={debouncedHandleSearchChange}
                              type="search"
                              className="form-control"
                              placeholder="Search Companies"
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
                        <button onClick={() => setIsSubmittingForm(true)} class="btn btn-theme ms-2" style={{ height: '50px', width: '175px' }}>
                           <i class="fa-solid fa-plus me-2"></i>Add Companies</button>
                     </div>
                  </div>
               </RenderIf>
               <RenderIf shouldRender={isSubmittingForm}>

                  <AddCompaniesForm
                     onSubmit={onAddEditUserSubmit}
                     isSubmittingForm={onCloseform}
                  />
               </RenderIf>
               <RenderIf shouldRender={!isSubmittingForm && !selectedUser}>
                  <table class="table table-bordered case-list-table mt-5">
                     <thead>
                        <tr>
                           <th onClick={() => requestSort('firstName.lastName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Company Name</th>
                           <th onClick={() => requestSort('firstName.lastName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>First Name</th>
                           <th onClick={() => requestSort('firstName.lastName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Last Name</th>
                           <th onClick={() => requestSort('email')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Contact Email Address</th>
                           <th onClick={() => requestSort('mobileNumber')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Company Phone Number</th>
                           <th onClick={() => requestSort('firstName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Company Address</th>
                           <th onClick={() => requestSort('firstName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Subscription Renewal Date</th>
                           <th onClick={() => requestSort('firstName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Edit</th>
                           {/* <th onClick={() => requestSort('firstName')} tabindex="0" aria-controls="myTable" rowspan="1" colspan="1" aria-sort={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"} aria-label={sortConfig?.direction === "sorting_asc" ? "ascending" : "descending"}>Launch Company</th> */}
                        </tr>
                     </thead>
                     <tbody>
                        {listCompanies?.map((user, i) => (
                           <tr>
                              <td>
                                 {/* <img src="images/user.png" class="img-fluid me-2" /> */}
                                 <span>{user?.companyName}</span>
                              </td>
                              <td>
                                 <span>{user?.firstName}</span>
                              </td>
                              <td>
                                 <span>{user?.lastName}</span>
                              </td>
                              <td>{user?.contactEmail}</td>
                              <td>{user?.companyPhoneNumber}</td>
                              <td>{user?.companyAddress}</td>
                              <td>{parseAndFormatUtcDate(user?.subscription?.subscriptionRenewalDate)}</td>
                              <td>
                                 <button className='outline-btn-hover btn btn-theme btn-border btn-sm me-3' type='button' onClick={() => handleEdit(user)} style={{ minWidth: "auto" }}>
                                    <EditButtonIcon />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  <div class="d-flex justify-content-between align-items-center">
                     <div class="d-flex gap-6 align-items-center">
                        <span class="page-count">Showing 1 - {showEntries} of {totalCount}</span>
                        <div>
                           <select value={showEntries} onChange={(e) => setshowEntries(parseInt(e.target.value))} className='form-select d-inline w-auto rounded-pill'>
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
                                       <BackArrowIcon />
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
                                       <NextArrowIcon />
                                    </span>
                                 </li>
                              </ul>
                           )}
                        </ul>
                     </nav>
                  </div>
                  {/* <div id="myTable_wrapper" class="dataTables_wrapper no-footer">
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
                     <div id="myTable_filter" class="dataTables_filter"><label>Search:<input onChange={debouncedHandleSearchChange} type="search" class="" placeholder="" aria-controls="myTable" /></label></div>
                     <div class="dataTables_info" id="myTable_info" role="status" aria-live="polite">Showing 1 to {showEntries} of {totalCount} entries</div>
                     {totalPages > 1 && <div class="dataTables_paginate paging_simple_numbers" id="myTable_paginate">
                        <ReactPagination
                           activePage={currentPage}
                           totalItemCount={totalPages}
                           onChange={handlePageChange}
                        />
                     </div>}

                  </div> */}
               </RenderIf>
               <RenderIf shouldRender={selectedUser}>
                  <EditCompaniesForm
                     selectedUser={selectedUser}
                     onSubmit={(formData, setErrors) => onAddEditUserSubmit(false, formData, setErrors)}
                     isSubmittingForm={onCloseform}
                  />
               </RenderIf>
            </div>
         </div>
      </section >
   )

}

export default Companies;