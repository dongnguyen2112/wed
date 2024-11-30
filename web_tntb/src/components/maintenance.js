import React, { useState, useEffect } from "react";
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { sendMaintenanceNotification } from '../components/Notification';
import 'react-tabs/style/react-tabs.css';
import '../css/Maintenance.css';

const Maintenance = () => {
  const [assets, setAssets] = useState([]);
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [maintenanceAssets, setMaintenanceAssets] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'asset'), (snapshot) => {
      const assetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssets(assetData);
    }, (error) => {
      console.error("Error fetching assets:", error);
    });

    const q = query(collection(db, 'user'), where("role", "==", "Nhân viên"));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const employeeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeeData);
    }, (error) => {
      console.error("Error fetching employees:", error);
    });

    const unsubscribeMaintenance = onSnapshot(collection(db, 'maintenance'), (snapshot) => {
      const maintenanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceAssets(maintenanceData);
    }, (error) => {
      console.error("Error fetching maintenance data:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
      unsubscribeMaintenance();
    };
  }, []);

  useEffect(() => {
    const today = new Date();
    const maintenanceList = [];

    assets.forEach(asset => {
      const { maintenanceInterval, maintenanceDay, assetCode } = asset;

      if (maintenanceInterval && maintenanceDay) {
        let maintenanceDayObj;

        if (typeof maintenanceDay === 'string') {
          maintenanceDayObj = new Date(maintenanceDay);
        } else if (maintenanceDay.seconds) {
          maintenanceDayObj = new Date(maintenanceDay.seconds * 1000);
        }

        if (!maintenanceDayObj) return;

        const dueDate = new Date(maintenanceDayObj);
        dueDate.setDate(dueDate.getDate() + (maintenanceInterval * 30));

        const startDate = new Date(dueDate);
        startDate.setDate(dueDate.getDate() - 7);

        const isAlreadyAssigned = maintenanceAssets.some(
          maintenance => maintenance.assetCode === assetCode && maintenance.maintenanceStatus === "Đã phân công"
        );

        // Chỉ thêm vào maintenanceList nếu ngày hiện tại lớn hơn hoặc bằng startDate
        if (!isAlreadyAssigned && (today >= startDate)) {
          maintenanceList.push({
            ...asset,
            startDate,
            dueDate,
            isOverdue: today > dueDate,
          });
        }
      }
    });

    setMaintenanceItems(maintenanceList);
  }, [assets, maintenanceAssets]);

  const handleAssetSelect = (asset) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter(a => a !== asset));
    } else if (selectedAssets.length < 3) {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${d.getFullYear().toString().slice(-2)}`;
  };

  const assignEmployee = async () => { 
    const selectedAssetCodes = selectedAssets.map(asset => asset.assetCode);

    for (const assetCode of selectedAssetCodes) {
        const asset = assets.find(asset => asset.assetCode === assetCode);
        const dueDate = formatDate(new Date(asset.maintenanceDay));

        await addDoc(collection(db, 'maintenance'), {
            assetCode,
            assetName: asset.assetName,
            imgasset: asset.imageUrl,
            position: asset.position,
            employeeName: selectedEmployee.name,
            teacherId: selectedEmployee.teacherId,
            maintenanceDay: dueDate,
            addedDate: formatDate(new Date()),
            maintenanceStatus: "Đã phân công",
        });

       // Gửi thông báo đến nhân viên
       const employeeWithToken = employees.find(emp => emp.teacherId === selectedEmployee.teacherId);
       if (employeeWithToken && employeeWithToken.expoPushToken) {
           await sendMaintenanceNotification(
               employeeWithToken.expoPushToken, 
               'Thông báo bảo trì', 
               `Bạn đã được phân công bảo trì tài sản!\n${asset.assetName} tại phòng ${asset.position}`
           );
       }
   }

    alert('Phân công thành công!');
    setSelectedAssets([]);
    setSelectedEmployee(null);
    setIsAssigned(true);
    setTimeout(() => {
        setNotification('');
        setIsAssigned(false);
    }, 3000);
};


  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(selectedEmployee === employee ? null : employee);
  };

  const isAssignButtonDisabled = selectedAssets.length === 0 || !selectedEmployee || isAssigned;

  return (
    <div className="maintenance-container-custom">
      <Tabs>
        <TabList>
          <Tab>Danh sách bảo trì tài sản</Tab>
          <Tab>Trạng thái bảo trì</Tab>
          <Tab>Lịch sử bảo trì</Tab>
        </TabList>
  
        <TabPanel>
          {/* <h2>Ngày bảo trì sắp tới & Quá hạn bảo trì</h2> */}
          {notification && <div className="notification-custom">{notification}</div>} 
        <div className="maintenance-table-scroll-container">
          <table className="maintenance-table-custom">
            <thead className="maintenance-table-header-custom">
              <tr>
                <th className="maintenance-table-cell-custom">Chọn</th>
                <th className="maintenance-table-cell-custom">Mã tài sản</th>
                <th className="maintenance-table-cell-custom">Tên tài sản</th>
                <th className="maintenance-table-cell-custom">Thời gian bảo trì</th>
                <th className="maintenance-table-cell-custom">Vị trí</th>
              </tr>
            </thead>
              <tbody>
                {maintenanceItems.map(asset => (
                  <tr key={asset.id} className={asset.isOverdue ? 'overdue-custom' : ''}>
                    <td className="maintenance-table-cell-custom">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset)}
                        onChange={() => handleAssetSelect(asset)}
                        disabled={isAssigned}
                      />
                    </td>
                    <td className="maintenance-table-cell-custom">{asset.assetCode}</td>
                    <td className="maintenance-table-cell-custom">{asset.assetName}</td>
                    <td className="maintenance-table-cell-custom">
                      {`${formatDate(asset.startDate)} - ${formatDate(asset.dueDate)}`}
                    </td>
                    <td className="maintenance-table-cell-custom">{asset.position}</td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
          <h3 style={{textAlign:'center',marginBottom:15, marginTop:30, fontWeight:'700', fontSize:20}}>Danh sách nhân viên</h3>
        <div className="maintenance-table-scroll-container">
          <table className="maintenance-table-custom">
            <thead className="maintenance-table-header-custom">
              <tr>
                <th className="maintenance-table-header-cell-custom">Chọn</th>
                <th className="maintenance-table-header-cell-custom">Tên nhân viên</th>
                <th className="maintenance-table-header-cell-custom">Công việc đang thực hiện</th>
              </tr>
            </thead>
            <tbody className="maintenance-table-body-custom">
              {employees.map(employee => {
                const assignedTasks = maintenanceAssets.filter(
                  maintenance => maintenance.teacherId === employee.teacherId && maintenance.maintenanceStatus === "Đã phân công"
                );
  
                return (
                  <tr key={employee.id}>
                    <td className="maintenance-table-cell-custom">
                      <input
                        type="checkbox"
                        checked={selectedEmployee === employee}
                        onChange={() => handleEmployeeSelect(employee)}
                        disabled={isAssigned}
                      />
                    </td>
                    <td className="maintenance-table-cell-custom">{employee.name}</td>
                    <td className="maintenance-table-cell-custom">
                      {assignedTasks.length > 0 ? (
                        assignedTasks.map(task => (
                          <div key={task.id}>
                            {task.assetName} - {task.position}
                          </div>
                        ))
                      ) : (
                        <span>Không có</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          <div className="assign-button-container-custom">
            <button
              className={`assign-button-custom ${isAssignButtonDisabled ? 'disabled-custom' : ''}`}
              onClick={assignEmployee}
              disabled={isAssignButtonDisabled}
            >
              Phân công
            </button>
          </div>

        </TabPanel>
        <TabPanel>
          {/* <h2>Trạng thái bảo trì</h2> */}
          <table className="maintenance-table-custom">
            <thead className="maintenance-table-header-custom">
              <tr>
                <th className="maintenance-table-header-cell-custom">Mã tài sản</th>
                <th className="maintenance-table-header-cell-custom">Tên tài sản</th>
                <th className="maintenance-table-header-cell-custom">Vị trí</th>
                <th className="maintenance-table-header-cell-custom">Hạn bảo trì</th>
                <th className="maintenance-table-header-cell-custom">Ngày phân công</th>
                <th className="maintenance-table-header-cell-custom">Nhân viên</th>
                <th className="maintenance-table-header-cell-custom">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="maintenance-table-body-custom">
              {maintenanceAssets
                .filter(asset => asset.maintenanceStatus === "Đã phân công")
                .map(asset => (
                  <tr key={asset.id} className="maintenance-table-row-custom">
                    <td className="maintenance-table-cell-custom">{asset.assetCode}</td>
                    <td className="maintenance-table-cell-custom">{asset.assetName}</td>
                    <td className="maintenance-table-cell-custom">{asset.position}</td>
                    <td className="maintenance-table-cell-custom">{asset.maintenanceDay}</td>
                    <td className="maintenance-table-cell-custom">{asset.addedDate}</td>
                    <td className="maintenance-table-cell-custom">{asset.employeeName}</td>
                    <td className="maintenance-table-cell-custom">{asset.maintenanceStatus}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TabPanel>
        <TabPanel>
          {/* <h2>Lịch sử bảo trì</h2> */}
          <table className="maintenance-table-custom">
            <thead className="maintenance-table-header-custom">
              <tr>
                <th className="maintenance-table-header-cell-custom">Mã tài sản</th>
                <th className="maintenance-table-header-cell-custom">Tên tài sản</th>
                <th className="maintenance-table-header-cell-custom">Vị trí</th>
                <th className="maintenance-table-header-cell-custom">Hạn bảo trì</th>
                <th className="maintenance-table-header-cell-custom">Ngày hoàn thành</th>
                <th className="maintenance-table-header-cell-custom">Nhân viên</th>
                <th className="maintenance-table-header-cell-custom">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="maintenance-table-body-custom">
              {maintenanceAssets
                .filter(asset => asset.maintenanceStatus === "Hoàn tất bảo trì")
                .map(asset => (
                  <tr key={asset.id} className="maintenance-table-row-custom">
                    <td className="maintenance-table-cell-custom">{asset.assetCode}</td>
                    <td className="maintenance-table-cell-custom">{asset.assetName}</td>
                    <td className="maintenance-table-cell-custom">{asset.position}</td>
                    <td className="maintenance-table-cell-custom">{asset.maintenanceDay}</td>
                    <td className="maintenance-table-cell-custom">{formatDate(asset.completionDate)}</td>
                    <td className="maintenance-table-cell-custom">{asset.employeeName}</td>
                    <td className="maintenance-table-cell-custom">{asset.maintenanceStatus}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TabPanel>
      </Tabs>
    </div>
  );  
};

export default Maintenance;
