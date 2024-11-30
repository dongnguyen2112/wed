import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { peopleOutline ,logInOutline ,swapHorizontalOutline ,businessOutline ,constructOutline , cogOutline, desktopOutline, chevronDownOutline, chevronUpOutline,barChartOutline  } from 'ionicons/icons';
import '../css/slidebar.css';

const Slidebar = () => {
  const [isDeviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const [isRoomMenuOpen, setRoomMenuOpen] = useState(false);
  const [isTransferMenuOpen, setTransferMenuOpen] = useState(false);
  const [isreportMenuOpen, setreportMenuOpen] = useState(false);
  const [isimportMenuOpen, setimportMenuOpen] = useState(false);
  const toggleDeviceMenu = () => {
    setDeviceMenuOpen(!isDeviceMenuOpen);
  };

  const toggleRoomMenu = () => {
    setRoomMenuOpen(!isRoomMenuOpen);
  };

  const toggleTransferMenu = () => {
    setTransferMenuOpen(!isTransferMenuOpen);
  };
  const togglereportMenu = () => {
    setreportMenuOpen(!isreportMenuOpen);
  };
  const toggleimportMenu = () => {
    setimportMenuOpen(!isimportMenuOpen);
  };
  return (
    <div className="sidebar">
      <div className="brand">
        <h2 style={{color:'white'}}>Xin chào! Đông </h2>
      </div>
      <ul className="menu">
        <li>
          <a href="/chart">
            <IonIcon icon={barChartOutline } size="large" />
            <span>Thống kê</span>
          </a>
        </li>
        <li>
          <a href="#" onClick={toggleimportMenu}>
            <IonIcon icon={peopleOutline } size="large"  />
            <span>Quản lý Tài khoản</span>
            <IonIcon icon={isimportMenuOpen ? chevronUpOutline : chevronDownOutline} className="dropdown-icon" />
          </a>
          {isimportMenuOpen && (
            <ul className="submenu">
              <li><a href="/user">Quản lý người dùng</a></li>
              <li><a href="/register_excel">Đăng ký tài khoản nhanh </a></li>
            </ul>
          )}
        </li>
        <li>
          <a href="#" onClick={toggleDeviceMenu}>
            <IonIcon icon={desktopOutline} size="large" />
            <span>Danh mục tài sản</span>
            <IonIcon icon={isDeviceMenuOpen ? chevronUpOutline : chevronDownOutline} className="dropdown-icon" />
          </a>
          {isDeviceMenuOpen && (
            <ul className="submenu">
              <li><a href="/Add_device">Thêm mới tài sản</a></li>
              <li><a href="/details_device">Chi tiết tài sản</a></li>
              <li><a href="/maintenance">Bảo trì định kỳ</a></li>
            </ul>
          )}
        </li>
        <li>
          <a href="#" onClick={toggleRoomMenu}>
            <IonIcon icon={businessOutline } size="large" />
            <span>Quản lý phòng</span>
            <IonIcon icon={isRoomMenuOpen ? chevronUpOutline : chevronDownOutline} className="dropdown-icon" />
          </a>
          {isRoomMenuOpen && (
            <ul className="submenu">
              <li><a href="/room">Thêm mới phòng học</a></li>
              <li><a href="/detail_room">Chi tiết phòng học</a></li>
            </ul>
          )}
        </li>
        <li>
          <a href="#" onClick={toggleTransferMenu}>
            <IonIcon icon={swapHorizontalOutline } size="large" />
            <span>Quản lý điều chuyển</span>
            <IonIcon icon={isTransferMenuOpen ? chevronUpOutline : chevronDownOutline} className="dropdown-icon" />
          </a>
          {isTransferMenuOpen && (
            <ul className="submenu">
              <li><a href="/asset_transfer">Điều chuyển tài sản</a></li>
              <li><a href="/history_transfer">Lịch sử điều chuyển</a></li>
            </ul>
          )}
        </li>
        <li>
          <a href="#" onClick={togglereportMenu}>
              <IonIcon icon={constructOutline } size="large" />
              <span>Quản lý sự cố</span>
              <IonIcon icon={isreportMenuOpen ? chevronUpOutline : chevronDownOutline} className="dropdown-icon" />
            </a>
            {isreportMenuOpen && (
              <ul className="submenu">
                <li><a href="/report">Quản lý sự cố</a></li>
                <li><a href="/report_history">Lịch sử sửa chữa</a></li>
              </ul>
            )}
        </li>
        <li>
          <a href="#">
            <IonIcon icon={cogOutline} size="large" />
            <span>Cài đặt</span>
          </a>
        </li>
        <li>
          <a href="/">
            <IonIcon icon={logInOutline} size="large" />
            <span>Đăng xuất</span>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Slidebar;
