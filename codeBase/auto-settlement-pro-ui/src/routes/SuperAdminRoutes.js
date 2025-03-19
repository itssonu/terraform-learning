import React from 'react'
import { Route, Routes } from 'react-router-dom';
import { Companies, ResetPassword, SuperDashboard, SuperProfile } from '../pages/superAdmin';
import { Users, Dashboard } from '../pages/admin';

const SuperAdminRoutes = (props) => {

    return <Routes>
            <Route path="dashboard" element={<SuperDashboard />} />
            <Route path="companies" element={<Companies />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<SuperProfile />} />
        <Route path="forgot-password" element={<ResetPassword />} />
        <Route path="firm-dashboard/:firm" element={<Dashboard />} />

        {/* <Route path="pdf-converter" element={<PdfConverter />} /> */}
    </Routes>
}

export default SuperAdminRoutes;