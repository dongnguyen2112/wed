import React, { useState } from 'react';
import { db } from '../firebase'; // Kết nối tới Firestore
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage
import { collection, addDoc } from 'firebase/firestore'; // Firestore
import QRCode from 'qrcode'; // Thư viện để tạo mã QR
import '../css/Room.css';

const Room = () => {
  const [nameRoom, setNameRoom] = useState(''); // Tên phòng
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm sinh mã ID ngẫu nhiên 5 chữ số
  const generateRoomId = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // Hàm tạo mã QR từ nameRoom
  const generateQR = async (text) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(text);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Lỗi khi tạo mã QR: ', error);
      return null;
    }
  };

  // Hàm upload hình ảnh mã QR lên Firebase Storage
  const uploadQRCodeToStorage = async (qrCodeDataURL, roomId) => {
    const storage = getStorage();
    const storageRef = ref(storage, `room_qr_codes/${roomId}.png`);
    
    const response = await fetch(qrCodeDataURL);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // Hàm xử lý thêm phòng mới
  const handleAddRoom = async () => {
    if (!nameRoom) {
      alert('Vui lòng nhập tên phòng.');
      return;
    }

    setIsSubmitting(true);

    const roomId = generateRoomId(); // Tạo mã ID Room tự động
    const qrCodeDataURL = await generateQR(nameRoom); // Tạo mã QR từ tên phòng

    if (!qrCodeDataURL) {
      alert('Lỗi khi tạo mã QR.');
      setIsSubmitting(false);
      return;
    }

    try {
      const qrImageUrl = await uploadQRCodeToStorage(qrCodeDataURL, roomId); // Upload mã QR lên Firebase Storage

      // Lưu thông tin phòng vào Firestore
      await addDoc(collection(db, 'rooms'), {
        idRoom: roomId,
        nameRoom: nameRoom,
        qrImageUrl: qrImageUrl,
      });

      alert('Thêm phòng thành công!');
      setNameRoom(''); // Reset tên phòng
    } catch (error) {
      console.error('Lỗi khi thêm phòng: ', error);
      alert('Đã xảy ra lỗi khi thêm phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="room-container-new">
  <h2 className="room-title">Thêm Phòng Mới</h2>
  <div className="form-group-new">
    <input
      type="text"
      id="nameRoom"
      value={nameRoom}
      onChange={(e) => setNameRoom(e.target.value)}
      placeholder="Nhập tên phòng (ví dụ:I1-309,...)"
      className="form-input"
    />
  </div>
  <button className="add-btn-new" onClick={handleAddRoom} disabled={isSubmitting}>
    {isSubmitting ? 'Đang thêm...' : 'Thêm Phòng'}
  </button>
</div>

  );
};

export default Room;
