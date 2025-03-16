import { Route } from 'react-router-dom';
import { BrowserRouter, Routes } from 'react-router-dom';
import { Home as HomeLayout, Account as AccountLayout, SuperAdminLayout } from './route-layouts';
import AccountRoutes from './routes/Account'
import HomeRoutes from './routes/Home';
import ApiTestComponent from './ApiTestComponent';
import PublicRoute from './routes/publicRoute';
import ProtectedRoute from './routes/protactiveRoute';
import SuperAdminRoutes from './routes/SuperAdminRoutes';

const Routess = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="api-test" element={<ApiTestComponent />} />
        <Route path="/" element={<ProtectedRoute />} >
          
          <Route path="/" element={<HomeLayout />} >
            <Route path="*" element={<HomeRoutes />} />
          </Route>

          <Route path="/super" element={<SuperAdminLayout />} >
            <Route path="*" element={<SuperAdminRoutes />} />
          </Route>
        </Route>
        <Route path="account" element={<PublicRoute />}>
          <Route element={<AccountLayout />}>
            <Route path="*" element={<AccountRoutes />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Routess;