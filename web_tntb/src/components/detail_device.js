import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../css/Detail_device.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DetailDevice = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { device } = location.state || {};
    const [isEditing, setIsEditing] = useState(false);
    const [updatedDevice, setUpdatedDevice] = useState(device);
    const [repairHistory, setRepairHistory] = useState([]);
    const [maintenanceHistory, setMaintenanceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deviceLoaded, setDeviceLoaded] = useState(false);

    useEffect(() => {
        if (device) {
            setUpdatedDevice(device);
            setDeviceLoaded(true);
        }
    }, [device]);

    useEffect(() => {
        if (deviceLoaded && device && device.id) {
            const deviceRef = doc(db, 'asset', device.id);
            const unsubscribeDevice = onSnapshot(deviceRef, (deviceSnapshot) => {
                if (deviceSnapshot.exists()) {
                    const deviceData = deviceSnapshot.data();
                    setUpdatedDevice(deviceData);
                    console.log("Updated device data:", deviceData);
                } else {
                    console.log("Device not found");
                }
            });

            const unsubscribeRepairHistory = onSnapshot(doc(db, 'asset', device.id), (deviceSnapshot) => {
                if (deviceSnapshot.exists()) {
                    const deviceData = deviceSnapshot.data();
                    if (Array.isArray(deviceData.history)) {
                        setRepairHistory(deviceData.history);
                    }
                }
            });

            const unsubscribeMaintenanceHistory = onSnapshot(doc(db, 'asset', device.id), (deviceSnapshot) => {
                if (deviceSnapshot.exists()) {
                    const deviceData = deviceSnapshot.data();
                    if (Array.isArray(deviceData.HistoryMaintenance)) {
                        setMaintenanceHistory(deviceData.HistoryMaintenance);
                    }
                }
            });

            return () => {
                unsubscribeDevice();
                unsubscribeRepairHistory();
                unsubscribeMaintenanceHistory();
            };
        }
    }, [deviceLoaded, device]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedValue = (name === "maintenanceInterval" || name === "depreciationRate")
            ? value === "" ? "" : parseFloat(value) 
            : value;

        setUpdatedDevice((prevState) => ({
            ...prevState,
            [name]: updatedValue,
        }));
    };

    const handleSave = async () => {
        try {
            const deviceRef = doc(db, 'asset', device.id);
            await updateDoc(deviceRef, updatedDevice);
            toast.success("Cập nhật thiết bị thành công!");
            setIsEditing(false);
        } catch (error) {
            toast.error("Lỗi cập nhật thiết bị: " + error.message);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này không?")) {
            try {
                const deviceRef = doc(db, 'asset', device.id);
                await deleteDoc(deviceRef);
                toast.success("Xóa thiết bị thành công!");
                navigate('/details_device');
            } catch (error) {
                toast.error("Lỗi xóa thiết bị: " + error.message);
            }
        }
    };

    if (!device) {
        return <div>Không tìm thấy thông tin thiết bị.</div>;
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="device-detail-container">
            <Tabs>
                <TabList>
                    <Tab>Chi tiết thiết bị</Tab>
                    <Tab>Lịch sử sửa chữa</Tab>
                    <Tab>Lịch sử bảo trì</Tab>
                </TabList>

                <TabPanel>
                    <table className="device-detail-table">
                        <tbody>
                            <tr>
                                <th>ID thiết bị</th>
                                <td>{updatedDevice.assetCode}</td>
                            </tr>
                            <tr>
                                <th>Tên thiết bị</th>
                                <td>{updatedDevice.assetName}</td>
                            </tr>
                            <tr>
                                <th>Hình ảnh</th>
                                <td>
                                    <img src={updatedDevice.imageUrl} alt={updatedDevice.assetName} className="device-image" />
                                </td>
                            </tr>
                            {isEditing ? (
                                <>
                                    <tr>
                                        <th>Mô tả tài sản:</th>
                                        <td>
                                            <input
                                                type="text"
                                                name="assetDescription"
                                                value={updatedDevice.assetDescription}
                                                onChange={handleChange}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Thời gian bảo trì (tháng)</th>
                                        <td>
                                            <input
                                                type="number"
                                                name="maintenanceInterval"
                                                value={updatedDevice.maintenanceInterval || ''}
                                                onChange={handleChange}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Khấu hao mỗi năm(%):</th>
                                        <td>
                                            <input
                                                type="number"
                                                name="depreciationRate"
                                                value={updatedDevice.depreciationRate || ''}
                                                onChange={handleChange}
                                            />
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                    <tr>
                                        <th>Tên tài sản</th>
                                        <td>{updatedDevice.assetName}</td>
                                    </tr>
                                    <tr>
                                        <th>Danh mục</th>
                                        <td>{updatedDevice.category}</td>
                                    </tr>
                                    <tr>
                                        <th>Mô tả tài sản</th>
                                        <td>{updatedDevice.assetDescription}</td>
                                    </tr>
                                    <tr>
                                        <th>Ngày mua</th>
                                        <td>{formatDate(updatedDevice.purchaseDate)}</td>
                                    </tr>
                                    <tr>
                                        <th>Ngày hết hạn bảo hành</th>
                                        <td>{formatDate(updatedDevice.warrantyEndDate)}</td>
                                    </tr>
                                    <tr>
                                        <th>Giá tiền (VNĐ)</th>
                                        <td>{formatPrice(updatedDevice.price)}</td>
                                    </tr>
                                    <tr>
                                        <th>Khấu hao mỗi năm (%)</th>
                                        <td>{updatedDevice.depreciationRate}</td>
                                    </tr>
                                    <tr>
                                        <th>Vị trí</th>
                                        <td>{updatedDevice.position}</td>
                                    </tr>
                                </>
                            )}
                            <tr>
                                <td colSpan="2">
                                    <div className="btn-group">
                                        {isEditing ? (
                                            <>
                                                <button className="btn btn-close" onClick={() => setIsEditing(false)}>Đóng</button>
                                                <button className="btn btn-save" onClick={handleSave}>Lưu</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn btn-delete" onClick={handleDelete}>Xóa</button>
                                                <button className="btn btn-edit" onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </TabPanel>

                <TabPanel>
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : (
                        <table className="repair-history-table">
                            <thead>
                                <tr>
                                    <th>Số thứ tự</th> {/* Cột Số thứ tự */}
                                    <th>Ngày sửa chữa</th>
                                    <th>Nhân viên sửa chữa</th>
                                    <th>Vị trí</th>
                                    <th>Mô tả</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repairHistory.map((historyItem, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{historyItem.bookingDate}</td>
                                        <td>{historyItem.employeeName}</td>
                                        <td>{historyItem.qrCodeValue}</td>
                                        <td>{historyItem.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TabPanel>

                <TabPanel>
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : (
                        <table className="maintenance-history-table">
                            <thead>
                                <tr>
                                    <th>Số thứ tự</th> 
                                    <th>Hạn bảo trì</th>
                                    <th>Ngày phân công</th>
                                    <th>Ngày bảo trì</th>
                                    <th>Nhân viên bảo trì</th>
                                    <th>Vị trí</th>
                                    <th>Hiện trạng (%)</th>
                                    <th>Mô tả</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenanceHistory.map((maintenanceItem, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{formatDate(maintenanceItem.maintenanceDay)}</td>
                                        <td>{maintenanceItem.addedDate}</td>
                                        <td>{formatDate(maintenanceItem.completionDate)}</td>
                                        <td>{maintenanceItem.employeeName}</td>
                                        <td>{maintenanceItem.position}</td>
                                        <td>{maintenanceItem.percentage}</td>
                                        <td>{maintenanceItem.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TabPanel>

            </Tabs>
            <ToastContainer />
        </div>
    );
};

export default DetailDevice;
