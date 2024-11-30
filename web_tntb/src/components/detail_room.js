import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/Detail_room.css';
import QRCode from 'qrcode';
import { PDFDownloadLink, Document, Page, Text, View, Image, Font } from '@react-pdf/renderer';

// Register custom fonts
Font.register({
  family: 'NotoSans',
  src: '/fonts/NotoSans-VariableFont_wdth,wght.ttf',
});

Font.register({
  family: 'NotoSansItalic',
  src: '/fonts/NotoSans-Italic-VariableFont_wdth,wght.ttf',
});

const DetailRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState([]); // We will directly handle the selected rooms
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsCollection = collection(db, 'rooms');
        const roomSnapshot = await getDocs(roomsCollection);
        const roomList = roomSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRooms(roomList);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu phòng:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleCheckboxChange = (roomId) => {
    setSelectedRooms((prevSelected) =>
      prevSelected.includes(roomId)
        ? prevSelected.filter((id) => id !== roomId)
        : [...prevSelected, roomId]
    );
  };

  const generateQRCode = async (roomName) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(roomName);
      if (!qrCodeDataUrl) {
        console.error('Không thể tạo QR Code cho phòng:', roomName);
        return null;
      }
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Lỗi khi tạo QR code:', error);
      return null;
    }
  };
  const handleExportComplete = () => {
    // Reset selected rooms after export
    setSelectedRooms([]);
  };
  const MyDocument = ({ rooms, selectedRooms }) => (
    <Document>
      <Page size="A4" style={{ padding: 20 }}>
        {selectedRooms.map((roomId) => {
          const room = rooms.find((room) => room.id === roomId);
          return room ? (
            <View
              key={roomId}
              style={{
                marginBottom: 20,
                textAlign: 'center',
                borderWidth: 1,  // Add border
                borderColor: '#000', // Border color
                borderRadius: 8, // Optional: rounded corners for the border
                padding: 10, // Padding inside the border
                width: 120,  // Fixed width to ensure the box is smaller
                alignItems: 'center', // Center the QR and text inside the border
                marginLeft: 'auto',  // Align to the center horizontally
                marginRight: 'auto', // Align to the center horizontally
              }}
            >
              <Image
                src={generateQRCode(room.nameRoom)} // Generate QR code for the room name
                style={{
                  width: 100, // QR Code width
                  height: 100, // QR Code height
                  marginBottom: 5, // Space between QR code and room name
                }}
              />
              <Text
                style={{
                  fontFamily: 'NotoSans',
                  fontSize: 12,
                  marginTop: 5, // Optional: space between the text and QR code
                  textAlign: 'center', // Ensure the room name is also centered
                }}
              >
                {`Tên phòng: ${room.nameRoom}`}
              </Text>
            </View>
          ) : null;
        })}
      </Page>
    </Document>
  );
  
  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  const handleDetailClick = (roomId) => {
    navigate(`/details_room/${roomId}`);
  };

  return (
    <div className="room-list">
      {/* <h2 className="header_room" style={{ marginTop: 0 }}>Danh sách phòng</h2> */}

      {/* Tạo liên kết tải xuống PDF ở góc phải dưới cùng của bảng */}
      <div className="pdf-download-btn">
        <PDFDownloadLink
          document={<MyDocument rooms={rooms} selectedRooms={selectedRooms} />}
          onClick={handleExportComplete}
          fileName="DanhSachPhong_QRCode.pdf"
        >
          {({ loading }) => (loading ? 'Đang tạo PDF...' : 'Xuất QR Code')}
        </PDFDownloadLink>
      </div>
      <table className="room-table" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th>Chọn</th>
            <th>Số thứ tự</th>
            <th>ID Phòng</th>
            <th>Tên Phòng</th>
            <th>Mã QR</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, index) => (
            <tr key={room.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room.id)}
                  onChange={() => handleCheckboxChange(room.id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{room.idRoom}</td>
              <td>{room.nameRoom}</td>
              <td>
                <img
                  src={room.qrImageUrl}
                  alt={`Mã QR của phòng ${room.nameRoom}`}
                  className="qr-image1"
                />
              </td>
              <td>
                <button
                  className="detail-btn"
                  style={{ fontSize: 16, fontWeight: '600' }}
                  onClick={() => handleDetailClick(room.id)}
                >
                  Xem Chi Tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default DetailRoom;
