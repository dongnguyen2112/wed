import React, { useEffect, useState } from 'react';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../css/Details_room.css';

const DetailsRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [asset, setAsset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const roomRef = doc(db, 'rooms', id);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          setRoom(roomSnap.data());
          setNewRoomName(roomSnap.data().nameRoom);
          const assetsIds = roomSnap.data().assets;

          if (assetsIds && assetsIds.length > 0) {
            const assetPromises = assetsIds.map(async (assetId) => {
              const assetRef = doc(db, 'asset', assetId);
              const assetSnap = await getDoc(assetRef);
              if (assetSnap.exists()) {
                return { id: assetSnap.id, ...assetSnap.data() };
              }
              return null;
            });

            const assets = await Promise.all(assetPromises);
            const validAssets = assets.filter(asset => asset !== null);
            setAsset(validAssets);
          }
        }
      } catch (error) {
        console.error('Error fetching room details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa phòng này không?');
    if (!confirmDelete) return;

    try {
      const roomRef = doc(db, 'rooms', id);
      await deleteDoc(roomRef);
      alert('Phòng đã được xóa thành công!');
      navigate('/detail_room');
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(newRoomName);
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();

      const storageRef = ref(storage, `qrCodes/${id}.png`);
      await uploadBytes(storageRef, blob);

      const newQrImageUrl = await getDownloadURL(storageRef);
      const roomRef = doc(db, 'rooms', id);
      
      await updateDoc(roomRef, {
        nameRoom: newRoomName,
        qrImageUrl: newQrImageUrl
      });

      setRoom(prevRoom => ({
        ...prevRoom,
        nameRoom: newRoomName,
        qrImageUrl: newQrImageUrl
      }));

      alert('Phòng đã được cập nhật thành công!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (room) {
      setNewRoomName(room.nameRoom);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải chi tiết phòng...</div>;
  }

  if (!room) {
    return <div className="error">Không tìm thấy phòng với ID đã cho.</div>;
  }

  return (
    <div className="details-room-container">
      <Tabs>
        <TabList>
          <Tab>Chi tiết phòng</Tab>
          <Tab>Thông tin tài sản</Tab>
        </TabList>

        <TabPanel className="tab_panel_room_detail" >
          {/* <h2 className="room-title">Chi Tiết Phòng</h2> */}
          <div className="room-info">
            <p><strong>ID Phòng: {room.idRoom}</strong></p>
            <p><strong>Tên phòng: 
            {isEditing ? (
              <input
                type="text"
                className="room-input"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            ) : (
              <span className="room-name"> {room.nameRoom}</span>
            )}</strong></p>
            {room.qrImageUrl ? (
              <img className="qr-image" src={room.qrImageUrl} alt={`Mã QR của phòng ${room.nameRoom}`} />
            ) : (
              <p>Chưa có mã QR</p>
            )}
            <div className="button-group">
              {isEditing ? (
                <>
                  <button className="btn update-btn" onClick={handleUpdate}>Cập nhật</button>
                  <button className="btn cancel-btn" onClick={handleCancel}>Hủy</button>
                </>
              ) : (
                <button className="btn edit-btn" onClick={() => setIsEditing(true)}>Sửa</button>
              )}
              <button className="btn delete-btn" onClick={handleDelete}>Xóa phòng</button>
            </div>
          </div>
        </TabPanel>

        <TabPanel className="tab_panel_room_asset">
  <div className="assets-table-container">
    {asset.length > 0 ? (
      <table className="assets-table">
        <thead>
          <tr>
            <th>Mã tài sản</th>
            <th>Tên tài sản</th>
            <th>Mô tả tài sản</th>
            <th>Ảnh</th>
          </tr>
        </thead>
        <tbody>
          {asset.map(assetItem => (
            <tr key={assetItem.id}>
              <td>{assetItem.assetCode}</td>
              <td>{assetItem.assetName}</td>
              <td>{assetItem.assetDescription}</td>
              <td>
                <img className="asset-image" src={assetItem.imageUrl} alt={assetItem.assetName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>Không có tài sản nào liên kết với phòng này.</p>
    )}
  </div>
</TabPanel>


      </Tabs>
    </div>
  );  
};

export default DetailsRoom;
