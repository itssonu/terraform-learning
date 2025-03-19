import React from 'react'
import { Route, Routes } from 'react-router-dom';
import { Dashboard, Cases, Users, Profile,TemplateList } from '../pages/admin'
import ResetPassword from '../pages/admin/ResetPassword';
import { useSelector } from 'react-redux';
import { TemplateProvider } from '../pages/template-builder/TemplateContext';

const Home = (props) => {
    const { isAdmin = false } = useSelector((state) => state.users || {});

    return <Routes>
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="cases/:caseId?" element={<Cases />} />
        <Route path="users" element={<Users />} />
        <Route path="profile" element={<Profile />} />
        <Route path="forgot-password" element={<ResetPassword />} />
        {isAdmin && <Route path="template-builder" element={
            <TemplateProvider>
                <TemplateList />
            </TemplateProvider>
        } />}
    </Routes>
}

export default Home;