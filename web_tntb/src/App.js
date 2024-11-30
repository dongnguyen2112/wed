import React from 'react';
import'../src/css/content.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginForm from '../src/components/login';
import ForgotPassword from '../src/components/forgot_password';
import Slidebar from '../src/components/slidebar';
import Chart from'../src/components/chart'
import User from '../src/components/user';
import DetailsUser from '../src/components/details_user';
import AddDevice from '../src/components/add_device';
import DetailsDevice from '../src/components/details_device';
import DetailDevice from '../src/components/detail_device';
import Room from '../src/components/room';
import DetailRoom from '../src/components/detail_room';
import DetailsRoom from '../src/components/details_room'; 
import AssetTransfer from '../src/components/asset_transfer'
import HistoryTransfer from '../src/components/transfer_history'
import DetailHistoryTransfer from '../src/components/detail_transfer_history'
import Report from '../src/components/report'
import DetailReport from '../src/components/detail_report'
import RegisterExcel from'../src/components/register_excel'
import ReportHistory from '../src/components/report_history';
import Maintenance from '../src/components/maintenance';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Tuyến đường cho Slidebar và các trang con */}
        <Route path="/*" element={
          <div className="app">
            <Slidebar />
            <div className="content">
              <Routes>
                <Route path="chart" element={<Chart />} />
                <Route path="user" element={<User />} />
                <Route path="register_excel" element={<RegisterExcel />} />
                <Route path="details_user" element={<DetailsUser />} />
                <Route path="Add_device" element={<AddDevice />} />
                <Route path="details_device" element={<DetailsDevice />} />
                <Route path="/device/:id" element={<DetailDevice />} />
                <Route path="room" element={<Room />} />
                <Route path="detail_room" element={<DetailRoom />} />
                <Route path="details_room/:id" element={<DetailsRoom />} /> 
                <Route path="asset_transfer" element={<AssetTransfer />} /> 
                <Route path="history_transfer" element={<HistoryTransfer />} /> 
                <Route path="detail_history_transfer/:id" element={<DetailHistoryTransfer />} /> 
                <Route path="report" element={<Report />} /> 
                <Route path="detail_report/:id" element={<DetailReport />} /> 
                <Route path="report_history" element={<ReportHistory />} /> 
                <Route path="maintenance" element={<Maintenance />} /> 
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
