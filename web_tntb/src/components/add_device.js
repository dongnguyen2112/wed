import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firestore
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import Firebase Storage
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion,deleteDoc } from "firebase/firestore"; // Import Firestore functions
import Modal from 'react-modal';
import bwipjs from 'bwip-js'; // Import bwip-js for barcode generation
import QRCode from 'qrcode'; // Import QRCode generator library
import '../css/Add_device.css';
Modal.setAppElement(document.getElementById('root'));

const AddDevice = () => {
  const [assetCode, setAssetCode] = useState(''); // Mã tài sản sẽ được sinh ngẫu nhiên
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetImage, setAssetImage] = useState(null);
  const [category, setCategory] = useState('nội thất');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [position, setPosition] = useState('Tài sản mới');
  const [depreciationRate, setDepreciationRate] = useState('');
  const [remainingvalue, setRemainingvalue] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [maintenanceInterval, setMaintenanceInterval] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]); 
  const [newType, setNewType] = useState(''); 
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const storage = getStorage();

  const generateUniqueAssetCode = async () => {
    let uniqueCode = '';
    let isDuplicate = true;
    
    while (isDuplicate) {
      // Generate random 6-digit number
      const randomNumber = Math.floor(100000 + Math.random() * 900000); 
      uniqueCode = 'TS_' + randomNumber; 
      
      // Kiểm tra trùng lặp trong Firestore
      const q = query(collection(db, 'asset'), where('assetCode', '==', uniqueCode));
      const querySnapshot = await getDocs(q);
      isDuplicate = !querySnapshot.empty;
    }
    
    return uniqueCode;
  };

  // Upload image to Firebase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAssetImage(file);
  };

  const uploadImageToStorage = async () => {
    if (!assetImage) return null;
    const storageRef = ref(storage, `assets/${assetImage.name}`);
    await uploadBytes(storageRef, assetImage);
    return await getDownloadURL(storageRef);
  };


   // Fetch danh sách các loại tài sản từ Firestore
   useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'asset_type'));
        const types = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssetTypes(types);
      } catch (error) {
        console.error("Lấy dữ liệu thất bại!: ", error);
      }
    };
    fetchAssetTypes();
  }, []); // Chạy khi component được render lần đầu

  // Hàm chọn loại tài sản
  const handleSelectType = (id) => {
    if (selectedTypes.includes(id)) {
      setSelectedTypes(selectedTypes.filter((typeId) => typeId !== id));
    } else {
      setSelectedTypes([...selectedTypes, id]);
    }
  };
  const handleAddNewType = async () => {
    if (newType.trim() === '') {
      alert("Vui lòng nhập tên loại tài sản!");
      return;
    }
  
    try {
      // Thêm loại tài sản mới vào Firestore
      const docRef = await addDoc(collection(db, 'asset_type'), {
        type: newType,
      });
  
      // Cập nhật lại danh sách tài sản trong state
      setAssetTypes(prevTypes => [...prevTypes, { id: docRef.id, type: newType }]);
      alert("Thêm thành công loại tài sản!")
      // Reset giá trị input sau khi thêm
      setNewType('');
    } catch (error) {
      console.error("Lỗi thêm: ", error);
    }
  };
  // Hàm xóa loại tài sản đã chọn từ Firestore
  const handleDeleteSelected = async () => {
    try {
      for (const typeId of selectedTypes) {
        const typeDocRef = doc(db, 'asset_type', typeId);
        await deleteDoc(typeDocRef);  // Xóa tài sản khỏi Firestore
      }
      alert("Xóa thành công loại tài sản!")
      // Cập nhật lại danh sách loại tài sản trong state sau khi xóa
      setAssetTypes(prevTypes => prevTypes.filter(type => !selectedTypes.includes(type.id)));
      setSelectedTypes([]);  // Reset selectedTypes
    } catch (error) {
      console.error("Lỗi xóa: ", error);
    }
  };

  // Hàm đóng mở modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handlePriceChange = (e) => {
    // Giữ lại các số khi người dùng nhập, bỏ qua các ký tự không phải số
    let value = e.target.value.replace(/[^0-9]/g, '');
  
    // Nếu có số nhập vào, định dạng thành chuỗi số có dấu phẩy cho hàng nghìn
    if (value) {
      value = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
  
    setPrice(value);
  };
  
  // Generate and upload QR code to Firebase Storage
  const generateAndUploadQRCode = async (assetCode) => {
    const qrDataURL = await QRCode.toDataURL(assetCode); // Generate QR code
    const blob = await (await fetch(qrDataURL)).blob(); // Convert to Blob
    const qrRef = ref(storage, `qrcodes/${assetCode}.png`);
    await uploadBytes(qrRef, blob);
    return await getDownloadURL(qrRef); // Return QR code URL
  };

  // Generate and upload barcode to Firebase Storage
  const generateAndUploadBarcode = async (assetCode) => {
    const canvas = document.createElement('canvas');
    await bwipjs.toCanvas(canvas, {
      bcid: 'code128',       // Barcode type
      text: assetCode,       // Text to encode
      scale: 3,              // 3x scaling factor
      height: 10,            // Bar height, in millimeters
      includetext: true,     // Show human-readable text
      textxalign: 'center',  // Always good to set this
    });
    
    // Convert canvas to Blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve);
    });

    const barcodeRef = ref(storage, `barcodes/${assetCode}.png`);
    await uploadBytes(barcodeRef, blob);
    return await getDownloadURL(barcodeRef); // Return barcode URL
  };
  
  
  const handleAddAsset = async () => {
    if (!assetName || !price || !purchaseDate || !warrantyEndDate || !depreciationRate || !assetDescription || !quantity || !maintenanceInterval) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
  
    if (maintenanceInterval < 1 || maintenanceInterval > 12) {
      alert('Thời gian bảo trì định kỳ chỉ cho phép nhập giá trị từ 1 đến 12.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const imageUrl = await uploadImageToStorage(); // Upload image and get URL
      const currentDate = new Date().toISOString().slice(0, 10); // Get current date
      const currentTime = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
  
      for (let i = 1; i <= quantity; i++) {
        const newAssetCode = await generateUniqueAssetCode(); // Generate new 6-digit asset code
        const numericPrice = parseInt(price.replace(/[.,]/g, ''), 10)
        const qrAssetUrl = await generateAndUploadQRCode(newAssetCode); // Generate and upload QR code
        const barcodeUrl = await generateAndUploadBarcode(newAssetCode); // Generate and upload barcode
  
        // Add asset to Firestore and get the document ID
        const assetRef = await addDoc(collection(db, 'asset'), {
          assetCode: newAssetCode,
          assetName,
          assetDescription,
          imageUrl,
          category,
          price: numericPrice,
          purchaseDate,
          warrantyEndDate,
          position,
          depreciationRate: parseFloat(depreciationRate),
          maintenanceInterval: parseInt(maintenanceInterval), 
          remainingvalue:parseFloat(remainingvalue),
          qrAsset: qrAssetUrl, // Store QR code URL
          barcodeAsset: barcodeUrl, // Store barcode URL
          quantity: 1,
          addedDate: currentDate,
          maintenanceDay: currentDate,
          maintenanceTime: currentTime,
        });
  
        const assetDocumentId = assetRef.id; // Get the document ID of the new asset
  
        // Find the room with nameRoom "Tài sản mới" and add the assetDocumentId to its "assets" field
        const roomQuery = query(collection(db, 'rooms'), where('nameRoom', '==', 'Tài sản mới'));
        const roomSnapshot = await getDocs(roomQuery);
  
        if (!roomSnapshot.empty) {
          const roomDoc = roomSnapshot.docs[0]; // Assume there's only one document with nameRoom "Tài sản mới"
          const roomId = roomDoc.id;
  
          // Update the "assets" field in the room document by adding the new assetDocumentId
          await updateDoc(doc(db, 'rooms', roomId), {
            assets: arrayUnion(assetDocumentId), // Add assetDocumentId to the "assets" array field
          });
        }
      }
  
      alert(`Thêm ${quantity} tài sản thành công!`);
  
      // Reset form
      setAssetName('');
      setAssetDescription('');
      setAssetImage(null);
      setPrice('');
      setPurchaseDate('');
      setWarrantyEndDate('');
      setDepreciationRate('');
      setRemainingvalue('');
      setQuantity(1);
      setPosition('Tài sản mới');
      setCategory('nội thất');
      setMaintenanceInterval('');
    } catch (error) {
      console.error('Error adding asset: ', error);
      alert('Đã xảy ra lỗi khi thêm tài sản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-device-container">
      <div className="form-group">
        <label htmlFor="assetName"style={{ fontWeight: 'bold' }}>Tên tài sản</label>
        <input
          type="text"
          id="assetName"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          placeholder="Nhập tên tài sản"
        />
      </div>

      <div className="form-group">
        <label htmlFor="assetImage"className="bold-label">Ảnh tài sản</label>
        <input type="file" id="assetImage" onChange={handleImageUpload} />
      </div>
      <div className="form-group">
        <label htmlFor="quantity"className="bold-label">Số lượng</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Nhập số lượng"
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="purchaseDate"className="bold-label">Ngày mua</label>
        <input
          type="date"
          id="purchaseDate"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="warrantyEndDate"className="bold-label">Ngày hết bảo hành</label>
        <input
          type="date"
          id="warrantyEndDate"
          value={warrantyEndDate}
          onChange={(e) => setWarrantyEndDate(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="category" className="bold-label">Phân loại tài sản</label>
        <select
          id="category"
          value={category}
          onChange={(e) => {
            if (e.target.value === 'add-new') {
              openModal(); 
            } else {
              setCategory(e.target.value); 
            }
          }}
        >
          <option value="" disabled>Chọn loại tài sản</option>
          {assetTypes.map((type) => (
            <option key={type.id} value={type.type}>{type.type}</option>
          ))}
          <option value="add-new">Thêm loại tài sản</option> {/* Thêm option cho "Thêm loại tài sản" */}
        </select>
      </div>


      <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Add New Asset Type"
          className="asset-modal"
          overlayClassName="asset-modal-overlay"
        >
          <h2 className="modal-title">Thêm Loại Tài Sản Mới</h2>
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Nhập tên loại tài sản"
            className="modal-input"
          />
          <div className="type-table-wrapper">
            <table className="type-table">
              <thead>
                <tr>
                  <th className="type-table-header">Chọn</th>
                  <th className="type-table-header">Loại Tài Sản</th>
                </tr>
              </thead>
              <tbody>
                {assetTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="type-table-cell">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.id)}
                        onChange={() => handleSelectType(type.id)}
                      />
                    </td>
                    <td className="type-table-cell">{type.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Các nút Thêm và Đóng  */}
          <div className="modal-button-container">
            <button onClick={handleAddNewType} className="modal-button">
              Thêm loại
            </button>
            {/* Nút Xóa cho các loại tài sản đã chọn */}
            <button
              onClick={handleDeleteSelected}
              className="modal-button-delete"
              disabled={selectedTypes.length === 0}
            >
              Xóa
            </button>
          </div>
          <div className="modal-button-container">
            <button onClick={closeModal} className="modal-button-close">
              Đóng
            </button>
          </div>
        </Modal>
      <div className="form-group">
        <label htmlFor="price"className="bold-label">Giá tiền</label>
        <input
          type="text"
          id="price"
          value={price}
          onChange={handlePriceChange}
          placeholder="Nhập giá tiền (VND)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="depreciationRate"className="bold-label">Tỷ lệ khấu hao hằng năm (%)</label>
        <input
          type="number"
          id="depreciationRate"
          value={depreciationRate}
          onChange={(e) => setDepreciationRate(e.target.value)}
          placeholder="Nhập tỷ lệ khấu hao"
        />
      </div>

      <div className="form-group">
        <label htmlFor="maintenanceInterval"className="bold-label">Thời gian bảo trì định kỳ (tháng)</label>
        <input
          type="number"
          id="maintenanceInterval"
          value={maintenanceInterval}
          onChange={(e) => setMaintenanceInterval(e.target.value)}
          placeholder="Nhập thời gian bảo trì (1-12 tháng)"
          min="1"
          max="12"
        />
      </div>
      <div className="form-group">
        <label htmlFor="remainingvalue"className="bold-label">Thanh lý tài sản (%)</label>
        <input
          type="number"
          id="remainingvalue"
          value={remainingvalue}
          onChange={(e) => setRemainingvalue(e.target.value)}
          placeholder="Nhập tỷ lệ thanh lý"
        />
      </div>
      <div className="form-group1">
        <label htmlFor="assetDescription"style={{ fontWeight: 'bold' }}>Mô tả tài sản</label>
        <textarea
          id="assetDescription"
          value={assetDescription}
          onChange={(e) => setAssetDescription(e.target.value)}
          placeholder="Nhập mô tả tài sản"
        />
      </div>
      <div className="add-btn1">
        <button
        className="add-btn-device"
        onClick={handleAddAsset}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang thêm...' : 'Thêm mới'}
      </button>
      </div>
      
    </div>
  );
};

export default AddDevice;