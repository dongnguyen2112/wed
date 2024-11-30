import React, { useState, useRef } from 'react';
import { db, auth } from '../firebase'; // Nhập cấu hình Firebase (bao gồm Firebase Authentication)
import { collection, addDoc, setDoc, doc } from 'firebase/firestore'; // Thêm import cần thiết cho Firestore
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import để tạo tài khoản mới từ Firebase Authentication
import { query, where, getDocs } from 'firebase/firestore'; // Thêm import cần thiết cho Firestore
import * as XLSX from 'xlsx'; // Thư viện để xử lý file Excel
import { saveAs } from 'file-saver'; // Thư viện để lưu file
import '../css/Register_excel.css'; // Import CSS cho component

const RegisterFromExcel = () => {
    const [file, setFile] = useState(null); // State để lưu file Excel
    const [data, setData] = useState([]); // State để lưu dữ liệu từ file Excel
    const [errorMessage, setErrorMessage] = useState('');
    const [existingUsers, setExistingUsers] = useState([]); // State để lưu người dùng đã tồn tại
    const [newUsers, setNewUsers] = useState([]); // State để lưu người dùng mới
    const [isFileUploaded, setIsFileUploaded] = useState(false); // State để theo dõi trạng thái tải lên file
    const [isRegistered, setIsRegistered] = useState(false); // State để theo dõi trạng thái đăng ký
    const [isLoading, setIsLoading] = useState(false); // State để theo dõi trạng thái tải lên
    const [role, setRole] = useState('Giảng viên'); // State để lưu giá trị role từ select option
    const fileInputRef = useRef(null); // Tạo ref cho input file

    // Hàm xử lý khi chọn file
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setErrorMessage(''); // Xóa thông báo lỗi khi chọn file mới
        }
    };

    // Hàm xử lý khi tải file lên và hiển thị thông tin
    const handleFileUpload = async () => {
        if (!file) {
            setErrorMessage('Vui lòng chọn file Excel.');
            return;
        }

        setIsLoading(true); // Bắt đầu trạng thái tải lên
        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            let newUsersList = [];
            let existingUsersList = [];

            for (let row of worksheet) {
                const { 'Mã giảng viên': teacherId, 'Họ và tên': name, 'Email': email } = row;

                // Kiểm tra xem email hoặc mã giảng viên đã tồn tại chưa
                const usersRef = collection(db, 'user');
const emailQuery = query(usersRef, where('email', '==', email));
                const teacherIdQuery = query(usersRef, where('teacherId', '==', teacherId));

                const emailSnapshot = await getDocs(emailQuery);
                const teacherIdSnapshot = await getDocs(teacherIdQuery);

                if (!emailSnapshot.empty || !teacherIdSnapshot.empty) {
                    // Thêm vào danh sách user đã tồn tại
                    existingUsersList.push({ teacherId, name, email });
                } else {
                    // Thêm vào danh sách user mới
                    newUsersList.push({ teacherId, name, email });
                }
            }

            // Lưu danh sách người dùng vào state
            setExistingUsers(existingUsersList);
            setNewUsers(newUsersList);
            setData(worksheet); // Lưu dữ liệu vào state
            setIsFileUploaded(true); // Đánh dấu là đã tải file lên
            setIsLoading(false); // Kết thúc trạng thái tải lên
        };
        reader.readAsArrayBuffer(file);
    };
        // Hàm để tải file mẫu
        const handleDownloadSampleFile = () => {
            const sampleData = [
                { 'Mã giảng viên': 'GV001', 'Họ và tên': 'Nguyễn Văn A', 'Email': 'nguyena@gmail.com' },
                { 'Mã giảng viên': 'GV002', 'Họ và tên': 'Trần Thị B', 'Email': 'tranb@gmail.com' },
                { 'Mã giảng viên': 'GV003', 'Họ và tên': 'Lê Minh C', 'Email': 'lec@gmail.com' }
            ];

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(sampleData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Mẫu');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(blob, 'Danh_sach_giao_vien_mau.xlsx');
        };
    // Hàm để xử lý đăng ký người dùng mới
    const handleRegisterUsers = async () => {
        const usersRef = collection(db, 'user');
        const updatedNewUsers = []; // Danh sách người dùng mới với mật khẩu

        for (let user of newUsers) {
            const password = generatePassword();

            try {
                // Tạo tài khoản mới trong Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
                const uid = userCredential.user.uid; // Lấy UID từ Firebase Authentication

                // Lưu thông tin người dùng mới vào Firestore với documentID là UID và role theo lựa chọn
                await setDoc(doc(usersRef, uid), {
                    name: user.name,
                    teacherId: String(user.teacherId),
                    email: user.email,
                    password,
role: role, // Lưu role (Nhân viên hoặc Giảng viên)
                });

                updatedNewUsers.push({ ...user, password, uid }); // Thêm mật khẩu và UID vào danh sách
            } catch (error) {
                console.error('Error creating user:', error.message);
                setErrorMessage('Lỗi khi tạo tài khoản: ' + error.message);
            }
        }

        setNewUsers(updatedNewUsers); // Cập nhật state với mật khẩu và UID
        alert('Đăng ký tài khoản thành công!');
        setIsRegistered(true); // Đánh dấu là đã đăng ký thành công
    };

    // Hàm tạo mật khẩu ngẫu nhiên
    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    // Hàm để tải file khi click vào tên file
    const handleDownload = (fileName, users) => {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(users.map(user => ({
            ...user,
            password: user.password // Thêm cột mật khẩu vào danh sách người dùng mới
        })));
        XLSX.utils.book_append_sheet(workbook, worksheet, fileName.includes('tồn tại') ? 'Existing Users' : 'New Users');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    };

    // Hàm để reset form
    const handleResetForm = () => {
        setData([]); // Xóa dữ liệu đã tải lên
        setExistingUsers([]); // Xóa người dùng đã tồn tại
        setNewUsers([]); // Xóa người dùng mới
        setErrorMessage(''); // Xóa thông báo lỗi
        setIsFileUploaded(false); // Đặt lại trạng thái tải lên file
        setIsRegistered(false); // Đặt lại trạng thái đăng ký
        setIsLoading(false); // Đặt lại trạng thái tải lên

        // Reset giá trị của input file
        if (fileInputRef.current) {
            fileInputRef.current.value = null; // Xóa giá trị của input file
        }
    };

    return (
        <div className="excel-user-registration">
            {/* <h2>Đăng ký tài khoản từ file Excel</h2> */}
            <div className="excel-role-file-container">
                {/* Phần chọn vai trò (Nhân viên, Giảng viên) và tải file Excel */}
                {!isFileUploaded && (
                    <>
                        <div className="role-file-container">
                            <div className="role-select-container">
                                <label htmlFor="role">Chọn vai trò </label>
                                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="Nhân viên">Nhân viên</option>
                                    <option value="Giảng viên">Giảng viên</option>
                                </select>
                            </div>
                            <div className="file-download-container">
                                <button onClick={handleDownloadSampleFile} className="excel-download-sample-file">
                                    Tải file mẫu
                                </button>
                            </div>
                        </div>

                        <div className="excel-upload-container">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                            />
                            <button onClick={handleFileUpload} disabled={isLoading} className="excel-btn-upload">
                                {isLoading ? 'Đang xử lý...' : 'Tải lên'}
                            </button>
                        </div>
                    </>
                )}

                {errorMessage && <p className="excel-error-message">{errorMessage}</p>}
            </div>


    

    
            {/* Hiển thị dữ liệu từ file Excel */}
            {data.length > 0 && (
                <div className="excel-data-section">
                <h3 className="excel-data-title">Dữ liệu đã nhập từ file Excel</h3>
                <div className="excel-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã giảng viên</th>
                                <th>Họ và tên</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    <td>{row['Mã giảng viên']}</td>
                                    <td>{row['Họ và tên']}</td>
                                    <td>{row['Email']}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            
                {/* Hiển thị các nút Đăng ký/Làm lại */}
                <div className="excel-action-buttons">
                    {!isRegistered ? (
                        <button onClick={handleRegisterUsers} disabled={isLoading} className="excel-register-btn">
                            {isLoading ? 'Đang xử lý...' : 'Đăng ký người dùng mới'}
                        </button>
                    ) : (
                        <button onClick={handleResetForm} disabled={isLoading} className="excel-reset-btn">
                            Làm lại
                        </button>
                    )}
                </div>
            </div>
            
            )}
    
            {/* Hiển thị danh sách người dùng đã tồn tại và người dùng mới */}
            {isRegistered && (
                <div className="user-section">
                {existingUsers.length > 0 && (
                    <div className="existing-users-section">
                        <h3 className="user-section-title">Người dùng đã tồn tại</h3>
                        <div className="excel-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã giảng viên</th>
                                        <th>Họ và tên</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingUsers.map((user, index) => (
                                        <tr key={index}>
                                            <td>{user.teacherId}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={() =>
                                handleDownload('Danh_sach_nguoi_dung_ton_tai.xlsx', existingUsers)
                            }
                            className="download-btn"
                        >
                            Tải danh sách người dùng đã tồn tại
                        </button>
                    </div>
                )}
            
                {newUsers.length > 0 && (
                    <div className="new-users-section">
                        <h3 className="user-section-title">Người dùng mới</h3>
                        <div className="excel-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã giảng viên</th>
                                        <th>Họ và tên</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newUsers.map((user, index) => (
                                        <tr key={index}>
                                            <td>{user.teacherId}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={() =>
                                handleDownload('Danh_sach_nguoi_dung_moi.xlsx', newUsers)
                            }
                            className="download-btn"
                        >
                            Tải danh sách người dùng mới
                        </button>
                    </div>
                )}
            </div>
            
            )}
        </div>
    );
    
   
};

export default RegisterFromExcel;