import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/Details_device.css';
import { PDFDownloadLink, Document, Page, Text, View, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode'; // Thêm thư viện QRCode
import JsBarcode from 'jsbarcode'; // Thêm thư viện jsBarcode

// Register custom fonts
Font.register({
  family: 'NotoSans',
  src: '/fonts/NotoSans-VariableFont_wdth,wght.ttf',
});

Font.register({
  family: 'NotoSansItalic',
  src: '/fonts/NotoSans-Italic-VariableFont_wdth,wght.ttf',
});

const DetailsDevice = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [assetTypes, setAssetTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const deviceCollection = collection(db, 'asset');
                const deviceSnapshot = await getDocs(deviceCollection);
                const deviceList = deviceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                deviceList.sort((a, b) => new Date(b.addedDate)-new Date(a.addedDate));
                setDevices(deviceList);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu thiết bị:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);
   // Lấy danh sách loại tài sản
  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const typeCollection = collection(db, 'asset_type');
        const typeSnapshot = await getDocs(typeCollection);
        const typeList = typeSnapshot.docs.map((doc) => doc.data().type);
        setAssetTypes(typeList);
      } catch (error) {
        console.error('Lỗi khi lấy loại tài sản:', error);
      }
    };

    fetchAssetTypes();
  }, []);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };
    const calculateDepreciationDate = (price, depreciationRate, remainingValue) => {
        // Kiểm tra đầu vào
        if (isNaN(price) || isNaN(depreciationRate) || isNaN(remainingValue) || price <= 0 || depreciationRate <= 0 || remainingValue <= 0) {
            console.error('Giá trị không hợp lệ:', { price, depreciationRate, remainingValue });
            return null; // Nếu có giá trị không hợp lệ, trả về null
        }
    
        const depreciationFactor = 1 - depreciationRate / 100;
        const remainingPrice = (remainingValue / 100) * price;
    
        // Tính toán số năm cần để giảm giá trị xuống giá trị còn lại
        const years = Math.log(remainingPrice / price) / Math.log(depreciationFactor);
    
        if (isNaN(years) || years < 0) {
            console.error('Số năm tính toán không hợp lệ:', years);
            return null;
        }
    
        const currentDate = new Date();
        const yearsPart = Math.floor(years); // Số năm nguyên
        const monthsPart = Math.round((years - yearsPart) * 12); // Số tháng còn lại từ phần thập phân của năm
    
        currentDate.setFullYear(currentDate.getFullYear() + yearsPart); // Cộng số năm nguyên
        currentDate.setMonth(currentDate.getMonth() + monthsPart); // Cộng số tháng còn lại
    
        // Kiểm tra nếu ngày tính toán không hợp lệ
        if (isNaN(currentDate)) {
            console.error('Ngày tính toán thanh lý không hợp lệ:', currentDate);
            return null;
        }
    
        return currentDate;
    };
    
    const getDepreciationDate = (device) => {
        const { price, depreciationRate, remainingvalue } = device;
        const depreciationDate = calculateDepreciationDate(price, depreciationRate, remainingvalue);
    
        if (depreciationDate === null) {
            return 'Không xác định';  // Nếu không có ngày hợp lệ, trả về "Không xác định"
        }
    
        return formatDate(depreciationDate); // Chuyển đổi ngày hợp lệ sang định dạng ISO
    };
    
    

    if (loading) {
        return <div>Đang tải thông tin thiết bị...</div>;
    }

    const handleViewDetails = (device) => {
        navigate(`/device/${device.id}`, { state: { device } });
    };

    const filteredDevices = devices.filter((device) => {
        // Điều kiện tìm kiếm
        const matchesSearchTerm = device.assetCode
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
    
        // Lọc theo ngày
        const addedDate = new Date(device.addedDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const matchesDateRange =
          (start ? addedDate >= start : true) && (end ? addedDate <= end : true);
    
        // Lọc theo loại tài sản
        const matchesType = selectedType
          ? device.category === selectedType
          : true;
    
        return matchesSearchTerm && matchesDateRange && matchesType;
      });

    const handleCheckboxChange = (device) => {
        setSelectedDevices(prevSelected =>
            prevSelected.includes(device)
                ? prevSelected.filter(d => d !== device)
                : [...prevSelected, device]
        );
    };
    const handleExportComplete = () => {
        // Reset selected rooms after export
        setSelectedDevices([]);
      };
    // Hàm tạo QR code từ assetCode
    const generateQRCode = async (assetCode) => {
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(assetCode);
            return qrCodeDataUrl;
        } catch (error) {
            console.error("Lỗi khi tạo QR code:", error);
            return null;
        }
    };
    const handleDeleteDevices = async () => {
        if (selectedDevices.length === 0) {
            alert('Chưa chọn thiết bị để xóa');
            return;
        }
    
        try {
            // Xóa từng thiết bị được chọn trong Firestore
            for (const device of selectedDevices) {
                await deleteDoc(doc(db, 'asset', device.id)); // Xóa thiết bị khỏi Firestore
            }
    
            // Sau khi xóa, reset lại selectedDevices
            setSelectedDevices([]);
            // Cập nhật lại danh sách thiết bị
            const deviceCollection = collection(db, 'asset');
            const deviceSnapshot = await getDocs(deviceCollection);
            const deviceList = deviceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDevices(deviceList);
    
            alert('Đã xóa thiết bị thành công');
        } catch (error) {
            console.error('Lỗi khi xóa thiết bị:', error);
            alert('Có lỗi khi xóa thiết bị');
        }
    };
    // Hàm tạo Barcode từ assetCode
    const generateBarcode = (assetCode) => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, assetCode, {
            format: "CODE128",
            displayValue: true,
        });
        return canvas.toDataURL('image/png');
    };

    // Tạo PDF với QR Code
    const QRCodeDocument = ({ devices }) => {
        const rowsPerPage = 5; // Number of rows per page
        const columnsPerPage = 2; // Number of columns per page
    
        return (
            <Document>
                {devices.map((device, index) => {
                    // Start a new page if the number of devices reaches the limit per page
                    if (index % (rowsPerPage * columnsPerPage) === 0) {
                        return (
                            <Page key={`page-${index}`} style={{ padding: 10 }}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        marginBottom: 10,
                                    }}
                                >
                                    {/* Start rendering devices from here */}
                                    {devices.slice(index, index + rowsPerPage * columnsPerPage).map((device, subIndex) => (
                                        <View
                                            key={device.id}
                                            style={{
                                                padding: 10,
                                                border: '1px solid #000',
                                                borderRadius: 5,
                                                marginBottom: 10,
                                                marginRight: '2%',
                                                width: '48%',
                                                minHeight: 150,
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {/* Left content */}
                                            <View style={{ flex: 1, marginRight: 10 }}>
                                                <Text style={{ fontFamily: 'NotoSans' }}>{device.assetCode}</Text>
                                                <Text style={{ fontFamily: 'NotoSans' }}>{device.assetName}</Text>
                                                <Text style={{ fontFamily: 'NotoSans' }}>{device.position}</Text>
                                            </View>
    
                                            {/* QR Code */}
                                            <View>
                                                <Image
                                                    src={generateQRCode(device.assetCode)}
                                                    style={{ width: 80, height: 80 }}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </Page>
                        );
                    }
                    return null; // Avoid rendering unnecessary pages when no devices are there
                })}
            </Document>
        );
    };
    
    
    // Tạo PDF với Barcode
    const BarcodeDocument = ({ devices }) => {
        const rowsPerPage = 3; // Số lượng khung trên mỗi hàng
        const columnsPerPage = 2; // Số lượng khung trên mỗi cột
    
        return (
            <Document>
                <Page style={{ padding: 10 }}>
                    <View
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap', // Đảm bảo các khung có thể xuống dòng khi cần
                            justifyContent: 'center', // Căn giữa các khung
                            flexDirection: 'row', // Sắp xếp các khung theo hàng
                            margin: 'auto', // Căn giữa toàn bộ nội dung của trang
                        }}
                    >
                        {devices.map((device, index) => {
                            const rowIndex = Math.floor(index / columnsPerPage); // Xác định hàng của khung
                            const columnIndex = index % columnsPerPage; // Xác định cột của khung
    
                            return (
                                <View
                                    key={device.id}
                                    style={{
                                        padding: 10,
                                        border: '1px solid #000', // Đường viền bao quanh
                                        borderRadius: 5, // Bo góc khung
                                        marginBottom: 20, // Khoảng cách giữa các khung theo chiều dọc
                                        marginLeft: columnIndex === 0 ? 0 : 20, // Khoảng cách giữa các cột
                                        width: '45%', // Đảm bảo khung không quá rộng (2 khung trên mỗi hàng)
                                        display: 'flex',
                                        flexDirection: 'column', // Căn chỉnh các phần tử trong khung theo chiều dọc
                                        alignItems: 'center', // Căn giữa các phần tử trong khung
                                    }}
                                >
                                    {/* Nội dung nằm trên */}
                                    <View style={{ marginBottom: 10, alignItems: 'center' }}>
                                        <Text style={{ fontFamily: 'NotoSans' }}>{device.assetCode}</Text>
                                        <Text style={{ fontFamily: 'NotoSans' }}>{device.assetName}</Text>
                                        <Text style={{ fontFamily: 'NotoSans' }}>{device.position}</Text>
                                    </View>
    
                                    {/* Barcode nằm dưới */}
                                    <View>
                                        <Image
                                            src={generateBarcode(device.assetCode)}
                                            style={{ width: 200, height: 50 }} // Barcode có kích thước cố định
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Page>
            </Document>
        );
    };
    return (
        <div className="device-list-container">
           <div className="date-filter">
           <input
                type="text"
                placeholder="Tìm kiếm theo mã tài sản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="device-search-input"
            />
            <span className="from-date">Từ ngày</span>
                    <div className="date-group">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <span className="to-date">Đến ngày</span>
                    <div className="date-group">
                        
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <select value={selectedType || ''} onChange={(e) => setSelectedType(e.target.value)}>
                            <option value="">Tất cả loại tài sản</option>
                            {assetTypes.map((type, index) => (
                                <option key={index} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
            </div>


        <div className="device-table-wrapper">
            <table className="device-table">
                <thead style={{ color: 'white' }}>
                    <tr>
                        <th className="stt-column">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedDevices(filteredDevices);
                                    } else {
                                        setSelectedDevices([]);
                                    }
                                }}
                                checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                            />
                        </th>
                        <th className="stt-column">STT</th>
                        <th className="stt-column">ID thiết bị</th>
                        <th className="stt-column">Hình ảnh</th>
                        <th className="stt-column">Tên thiết bị</th>
                        <th className="stt-column">Ngày thêm</th>
                        <th className="stt-column">Vị trí</th>
                        <th className="stt-column">Ngày thanh lý</th>
                        <th className="stt-column">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredDevices.length > 0 ? (
                        filteredDevices.map((device, index) => (
                            <tr key={device.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedDevices.includes(device)}
                                        onChange={() => handleCheckboxChange(device)}
                                    />
                                </td>
                                <td>{index + 1}</td>
                                <td>{device.assetCode}</td>
                                <td>
                                    <img
                                        src={device.imageUrl}
                                        alt={device.assetName}
                                        className="device-thumbnail"
                                    />
                                </td>
                                <td>{device.assetName}</td>
                                <td>{formatDate(device.addedDate)}</td>
                                <td>{device.position}</td>
                                <td>{getDepreciationDate(device)}</td>
                                <td>
                                    <button
                                        onClick={() => handleViewDetails(device)}
                                        className="view-details-button"
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" style={{ textAlign: 'center' }}>Không tìm thấy thiết bị nào</td>
                        </tr>
                    )}
                </tbody>
            </table>
            
        </div>
        <div className="download-buttons-container">
        
            <button className="delete-button" onClick={handleDeleteDevices}>
                Xóa tài sản
            </button>
            <PDFDownloadLink
                document={<QRCodeDocument devices={selectedDevices} />}
                onClick={handleExportComplete}
                fileName="DanhSachTaiSan_QRCode.pdf"
            >
                {({ loading }) => (loading ? "Đang tải..." : "Xuất QRcode")}
            </PDFDownloadLink>

            <PDFDownloadLink
                document={<BarcodeDocument devices={selectedDevices} />}
                onClick={handleExportComplete}
                fileName="DanhSachTaiSan_Barcode.pdf"
            >
                {({ loading }) => (loading ? "Đang tải..." : "Xuất Barcode")}
            </PDFDownloadLink>
        </div>

</div>

    );
};

export default DetailsDevice;
