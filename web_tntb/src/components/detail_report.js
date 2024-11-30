import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where, updateDoc,getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { sendNotification } from '../components/Notification';
import { useParams, useNavigate } from 'react-router-dom'; 
import '../css/Detail_report.css';

const DetailReport = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Khai báo useNavigate
  const [booking, setBooking] = useState(null);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [staffTasks, setStaffTasks] = useState({});

  // Lắng nghe thay đổi từ Firestore cho booking
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'bookings', id), (docSnap) => {
      if (docSnap.exists()) {
        setBooking(docSnap.data());
      } else {
        console.error('No such document!');
      }
    });

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, [id]);

  // Lắng nghe thay đổi từ Firestore cho staff
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'user'), where('role', '==', 'Nhân viên')), (staffSnapshot) => {
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.data().teacherId,
        name: doc.data().name
      }));
      setStaff(staffData);
    });

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, []);

  // Hàm để lấy công việc của nhân viên
  useEffect(() => {
    const fetchStaffTasks = () => {
      const staffTasksData = {};
      const bookingsQuery = query(collection(db, 'bookings'), where('status', 'in', ['Đã tiếp nhận', 'Đang xử lý', 'Đang sửa chữa']));
      const unsubscribe = onSnapshot(bookingsQuery, (bookingsSnapshot) => {
        bookingsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.employeCode) {
            if (!staffTasksData[data.employeCode]) {
              staffTasksData[data.employeCode] = [];
            }
            staffTasksData[data.employeCode].push({
              assetName: data.assetName,
              qrCodeValue: data.qrCodeValue
            });
          }
        });
        setStaffTasks(staffTasksData);
      });

      return () => unsubscribe(); // Clean up the subscription on unmount
    };

    fetchStaffTasks();
  }, []);

  const handleStaffSelect = (teacherId) => {
    setSelectedStaff(prevSelected =>
      prevSelected.includes(teacherId)
        ? prevSelected.filter(id => id !== teacherId)
        : [...prevSelected, teacherId]
    );
  };

  const handleSaveStaff = async () => {
    if (selectedStaff.length > 0) {
        const selectedStaffMember = staff.find(member => member.id === selectedStaff[0]);
        if (selectedStaffMember) {
            console.log('Selected Staff Member:', selectedStaffMember); // Kiểm tra thông tin nhân viên
            const bookingRef = doc(db, 'bookings', id);

            try {
                // Truy vấn tài liệu nhân viên dựa trên teacherId
                const staffQuery = query(
                    collection(db, 'user'),
                    where('teacherId', '==', selectedStaffMember.id)
                );
                const staffSnapshot = await getDocs(staffQuery);

                if (!staffSnapshot.empty) {
                    const staffDoc = staffSnapshot.docs[0];
                    const expoPushToken = staffDoc.data().expoPushToken;

                    

                    // Cập nhật tài liệu booking
                    await updateDoc(bookingRef, {
                        employeCode: selectedStaffMember.id,
                        employeName: selectedStaffMember.name,
                    });

                    alert('Nhân viên đã được phân công thành công!');
                    navigate('/report'); // Chuyển hướng đến trang /report

                    // Gửi thông báo
                    sendNotification(
                        expoPushToken,
                        'Thông báo sửa chữa',
                        `Bạn đã được phân công sự cố mới.`
                    );
                } else {
                    console.error('Không tìm thấy tài liệu nhân viên!');
                }
            } catch (error) {
                console.error('Lỗi khi cập nhật tài liệu hoặc gửi thông báo: ', error);
                alert('Có lỗi xảy ra khi phân công nhân viên.');
            }
        } else {
            console.error('Nhân viên không hợp lệ hoặc không tồn tại.');
        }
    } else {
        alert('Vui lòng chọn ít nhất một nhân viên!');
    }
};

  
  
  if (!booking) return <div className="loading">Đang tải...</div>;

  return (
    <div className="detail-report-container">
      {/* <h1 className="detail-report-title">Chi tiết tài sản</h1> */}
      <div className="detail-report-content">
        <div className="detail-report-info">
          <div class="detail-report-image-container">
            <img src={booking.imageUrl} alt={booking.serviceName} className="detail-report-image" />
          </div>
          <div className="detail-report-info-container">
            <div className="detail-report-info-content">
              <div className="asset-section">
                <p className="detail-report-asset"><strong>Tài sản</strong></p>
                <p className="detail-report-asset"><strong>Tên</strong></p>
                <p className="detail-report-date"><strong>Ngày báo hỏng</strong></p>
                <p className="detail-report-priority"><strong>Mức độ</strong></p>
                <p className="detail-report-room"><strong>Phòng</strong></p>
                <p className="detail-report-status"><strong>Trạng thái</strong></p>
                <p className="detail-report-employee"><strong>Nhân viên</strong></p>
              </div>
              <div className="info-section">
                <p className="detail-report-asset">{booking.assetName}</p>
                <p className="detail-report-asset">{booking.name}</p>
                <p className="detail-report-date">{booking.bookingDate}</p>
                <p className="detail-report-priority">{booking.priority}</p>
                <p className="detail-report-room">{booking.qrCodeValue}</p>
                <p className="detail-report-status">{booking.status}</p>
                <p className="detail-report-employee">{booking.employeName || 'Chưa phân công'}</p>
              </div>
            </div>
        </div>

        </div>

        {/* Form mô tả sự cố nằm bên phải */}
        <div className="report-description-form">
          <h2 className="description-title">Mô tả sự cố</h2>
          <p className="description-content">{booking.bookingTime}</p>
        </div>
      </div>

      {/* bảng phân công */}
      {!booking.employeName && (
        <>
        <div className="staff-table-container">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Chọn</th>
                <th>Tên nhân viên</th>
                <th>Công việc đang thực hiện</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(staffMember => {
                const isSelected = selectedStaff.includes(staffMember.id);
                return (
                  <tr key={staffMember.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleStaffSelect(staffMember.id)} // Gọi hàm chọn nhân viên
                        disabled={selectedStaff.length >= 1 && !isSelected} // Vô hiệu hóa checkbox nếu đã chọn một nhân viên khác
                      />
                    </td>
                    <td>{staffMember.name}</td>
                    <td>
                      {staffTasks[staffMember.id]
                        ? staffTasks[staffMember.id].map((task, index) => (
                            <p key={index}>{task.assetName} - {task.qrCodeValue}</p>
                          ))
                        : 'Không có công việc nào'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="button-container">
          <button className="save-staff-button" onClick={handleSaveStaff} style={{fontSize:15, fontWeight:"600"}}>Phân công</button>
        </div>
        </>
      )}
    </div>
  );
};

export default DetailReport;
