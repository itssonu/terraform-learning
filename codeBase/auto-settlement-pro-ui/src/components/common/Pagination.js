import React from 'react'
import { Pagination } from '@mui/material';

const ReactPagination = ({ activePage, totalItemCount, onChange }) => {
  return (
    <Pagination
      page={activePage}
      count={totalItemCount}
      onChange={onChange}
      color="primary"
      shape="circle"
      
    />
  )
}

export default ReactPagination