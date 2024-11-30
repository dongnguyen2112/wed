import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firebase firestore config
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Cập nhật import từ Firebase v9
import '../css/Report_history.css';

const ReportHistory = () => {
  const [bookings, setBookings] = useState([]);

  // Hàm chuyển đổi ngày tháng từ "DD/MM/YYYY" sang đối tượng Date
  const convertToDate = (dateStr) => {
    if (dateStr) {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day); // Tạo Date object từ ngày, tháng, năm
    }
    return null;
  };

 // Hàm sắp xếp các booking theo ngày hoàn tất từ lớn đến bé
const sortBookings = (bookingsData) => {
  return bookingsData.sort((a, b) => {
    // Chuyển đổi addedDate thành thời gian tính bằng milliseconds
    const dateA = a.addedDate ? a.addedDate.getTime() : 0;
    const dateB = b.addedDate ? b.addedDate.getTime() : 0;

    // So sánh thời gian
    return dateB - dateA; // Sắp xếp từ lớn đến bé
  });
};


  useEffect(() => {
    const bookingsRef = collection(db, 'bookings'); // Lấy tham chiếu đến collection 'bookings'
    const q = query(
      bookingsRef,
      where('status', 'in', ['Đạt Yêu Cầu', 'Thay mới']) // Lọc các mục có status là "Đạt Yêu Cầu" hoặc "Thay mới"
    );

    // Lắng nghe các thay đổi trong Firestore
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Chuyển đổi ngày tháng từ định dạng "DD/MM/YYYY" thành Date object
      bookingsData.forEach(booking => {
        booking.addedDate = convertToDate(booking.addedDate); // Chuyển đổi ngày
      });

      // Sắp xếp dữ liệu theo ngày hoàn tất
      const sortedBookings = sortBookings(bookingsData);
      setBookings(sortedBookings);
    }, (error) => {
      console.error("Error fetching bookings:", error);
    });

    // Dọn dẹp khi component bị hủy
    return () => unsubscribe();
  }, []);

  return (
    <div className="report-history">
      <div className="report-history-table-wrapper">
        <table className="report-history-table">
          <thead className="report-history-header">
            <tr>
              <th>Số thứ tự</th>
              <th>Mã tài sản</th>
              <th>Tên tài sản</th>
              <th>Vị trí</th>
              <th>Giảng viên</th>
              <th>Thời gian</th>
              <th>Hoàn tất</th>
              <th>Nhân viên</th>
              <th>Trạng thái</th>
              <th>Minh chứng</th>
            </tr>
          </thead>
          <tbody className="report-history-list">
            {bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <tr className="report-history-row" key={booking.id}>
                  <td>{index + 1}</td>
                  <td>{booking.assetCode}</td>
                  <td>{booking.assetName}</td>
                  <td>{booking.qrCodeValue}</td>
                  <td>{booking.name}</td>
                  <td>{booking.bookingDate} {booking.currentTime}</td>
                  <td>{booking.addedDate ? booking.addedDate.toLocaleDateString() : 'N/A'} {booking.addedTime}</td>
                  <td>{booking.employeName}</td>
                  <td>{booking.status}</td>
                  <td className="report-history-image-cell">
                    <img src={booking.proofphoto} alt={booking.serviceName} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>Không có báo cáo sự cố nào!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportHistory;
