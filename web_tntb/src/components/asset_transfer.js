import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firestore
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore'; // Import Firestore functions
import '../css/Asset_transfer.css';

const AssetTransfer = () => {
  const [transferId] = useState(generateRandomId());
  const [currentDate] = useState(new Date().toLocaleDateString("vi-VN"));
  const [currentPosition, setCurrentPosition] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [assets, setAssets] = useState([]);
  const [rooms, setRooms] = useState([]); // State for room list
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [users, setUsers] = useState({ sender: '', receiver: '' });
  const [senderCode, setSenderCode] = useState(''); // Separate state for senderCode
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [noAssetsMessage, setNoAssetsMessage] = useState(''); // Message when no assets are found
  const [userList, setUserList] = useState([]);

  // Set up real-time listener for assets and rooms
  useEffect(() => {
    const unsubscribeAssets = onSnapshot(collection(db, 'asset'), (snapshot) => {
      const assetList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssets(assetList);
    });

    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
    });
    const unsubscribeUsers = onSnapshot(collection(db, 'user'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => doc.data());
      setUserList(usersList);
    });
    // Cleanup listeners on unmount
    return () => {
      unsubscribeAssets();
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    if (currentPosition) {
      const currentRoom = rooms.find(room => room.nameRoom === currentPosition);
      if (currentRoom && (!currentRoom.assets || currentRoom.assets.length === 0)) {
        setNoAssetsMessage(`Phòng ${currentPosition} chưa có tài sản nào.`);
      } else {
        setNoAssetsMessage('');
      }
    } else {
      setNoAssetsMessage('');
    }
  }, [currentPosition, rooms]);

  const handleAssetSelection = (assetId) => {
    setSelectedAssets((prevSelectedAssets) =>
      prevSelectedAssets.includes(assetId)
        ? prevSelectedAssets.filter(id => id !== assetId)
        : [...prevSelectedAssets, assetId]
    );
  };

  const handleTransferAssets = async () => {
    if (!newPosition || selectedAssets.length === 0 || !users.receiver) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const transferDoc = {
        transferId,          // Include hidden transferId
        currentDate,         // Include hidden currentDate
        currentPosition,
        senderCode,
        newPosition,
        selectedAssets,
        sender: users.sender, // Lưu trực tiếp sender
        receiver: users.receiver, // Lưu trực tiếp receiver
        notes,
      };

      const currentRoom = rooms.find(room => room.nameRoom === currentPosition);
      if (currentRoom) {
        const updatedCurrentRoomRef = doc(db, 'rooms', currentRoom.id);
        const updatedAssets = currentRoom.assets.filter(id => !selectedAssets.includes(id));
        await updateDoc(updatedCurrentRoomRef, { assets: updatedAssets });
      }

      const newRoom = rooms.find(room => room.nameRoom === newPosition);
      if (newRoom) {
        const updatedNewRoomRef = doc(db, 'rooms', newRoom.id);
        await updateDoc(updatedNewRoomRef, {
          assets: [...(newRoom.assets || []), ...selectedAssets]
        });
      }

      for (const assetId of selectedAssets) {
        const assetRef = doc(db, 'asset', assetId);
        await updateDoc(assetRef, { position: newPosition });
      }

      await addDoc(collection(db, 'transfer_history'), transferDoc);

      alert('Điều chuyển tài sản thành công!');
      // Reset form 
      setCurrentPosition('');
      setNewPosition('');
      setSelectedAssets([]);
      setUsers({ sender: '', receiver: '' });
      setNotes('');
      setSearchTerm('');
    } catch (error) {
      console.error('Error transferring assets: ', error);
      alert('Đã xảy ra lỗi khi điều chuyển tài sản.');
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.assetName.toLowerCase().includes(searchTerm.toLowerCase())
    && (currentPosition === 'Tài sản mới' ? asset.position === 'Tài sản mới' : rooms.find(room => room.nameRoom === currentPosition)?.assets?.includes(asset.id))
  );

  return (
    <div className="asset-transfer-container">

  <div className="form-row">
    <div className="form-group">
      <label>Vị Trí Hiện Tại</label>
      <select value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)}>
        <option value="">Chọn vị trí hiện tại</option>
        {rooms.map(room => (
          <option key={room.id} value={room.nameRoom}>{room.nameRoom}</option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label>Vị Trí Chuyển</label>
      <select value={newPosition} onChange={(e) => setNewPosition(e.target.value)}>
        <option value="">Chọn vị trí chuyển</option>
        {rooms.map(room => (
          <option key={room.id} value={room.nameRoom}>{room.nameRoom}</option>
        ))}
      </select>
    </div>
  </div>

  
      <div className="form-row">
        <div className="form-group">
          <label>Người Nhận</label>
          <select
            value={users.receiver}
            onChange={(e) => setUsers({ ...users, receiver: e.target.value })}
          >
            <option value="">Chọn người nhận</option>
            {userList.map((user, index) => (
              <option key={index} value={user.name}>{user.name}</option>
            ))}
          </select>
      </div>

    <div className="form-group">
      <label>Ghi Chú</label>
      <input
        type="text"
        placeholder="Ghi chú"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  </div>

  {/* Tách ô tìm kiếm ra khỏi các ô khác */}
  <div className="form-row">
    <div className="form-group full-width">
      <input
        type="text"
        placeholder="Tìm kiếm tên tài sản..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  </div>

  <div className="asset-list">
    <div className="asset-header">
        <span className="header-item">Chọn</span>
        <span className="header-item">ID</span>
        <span className="header-item">Tên Tài Sản</span>
    </div>
    {filteredAssets.map(asset => (
        <div key={asset.id} className="asset-row">
            <input
                type="checkbox"
                checked={selectedAssets.includes(asset.id)}
                onChange={() => handleAssetSelection(asset.id)}
            />
            <span>{asset.assetCode}</span>
            <span>{asset.assetName}</span>
        </div>
    ))}
    {noAssetsMessage && <p className="no-assets-message">{noAssetsMessage}</p>}
</div>


  <button onClick={handleTransferAssets}className='btn-transfer'>Điều Chuyển</button>
</div>
  )
};

const generateRandomId = () => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

export default AssetTransfer;
