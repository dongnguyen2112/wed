import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IoAddCircle} from 'react-icons/io5';
import '../css/User.css';
import { useNavigate } from 'react-router-dom';

const User = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [updatedName, setUpdatedName] = useState('');
    const [updatedEmail, setUpdatedEmail] = useState('');
    const [updatedTeacherId, setUpdatedTeacherId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [noResults, setNoResults] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Biến trạng thái điều khiển chế độ chỉnh sửa
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(db, 'user');
                const usersSnapshot = await getDocs(usersCollection);
                const userList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(userList);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu người dùng:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const toggleUserStatus = async (user) => {
        const updatedStatus = user.status === 'Đang hoạt động' ? 'Khóa tài khoản' : 'Đang hoạt động';
        try {
            const userDocRef = doc(db, 'user', user.id);
            await updateDoc(userDocRef, { status: updatedStatus });
            setUsers(users.map(u => u.id === user.id ? { ...u, status: updatedStatus } : u));
            toast.success(`Trạng thái của ${user.name} đã được cập nhật thành công!`);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUpdatedName(user.name);
        setUpdatedEmail(user.email);
        setUpdatedTeacherId(user.teacherId);
        setIsEditing(true); // Bật chế độ chỉnh sửa
    };

    const handleUpdateUser = async () => {
        if (editingUser) {
            const userDocRef = doc(db, 'user', editingUser.id);
            try {
                await updateDoc(userDocRef, {
                    name: updatedName,
                    email: updatedEmail,
                    teacherId: updatedTeacherId
                });
                setUsers(users.map(u => (u.id === editingUser.id ? { ...u, name: updatedName, email: updatedEmail, teacherId: updatedTeacherId } : u)));
                setEditingUser(null);
                setIsEditing(false); // Tắt chế độ chỉnh sửa sau khi cập nhật thành công
                toast.success(`Thông tin của ${updatedName} đã được cập nhật thành công!`);
            } catch (error) {
                console.error('Lỗi khi cập nhật thông tin người dùng:', error);
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setIsEditing(false); // Tắt chế độ chỉnh sửa khi hủy
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        const filteredUsers = users.filter(user => user.role !== 'admin' && user.teacherId.toLowerCase().startsWith(value.toLowerCase()));
        setNoResults(filteredUsers.length === 0 && value.length > 0);
        setEditingUser(null);
    };

    if (loading) {
        return <div className="loading-container">Đang tải...</div>;
    }

    return (
        <div className="user-management-container">
    {/* <h2 style={{ fontWeight: 750 }}>Quản Lý Người Dùng</h2> */}
    {!isEditing && (
        <div className="user-table-container">
            <div className="search-add-container">
                <input 
                    type="text" 
                    placeholder="Nhập ID để tìm kiếm" 
                    value={searchTerm} 
                    onChange={handleSearch} 
                    className="search-input"
                />
                <button onClick={() => navigate('/details_user')} className="add-user-button">
                    <IoAddCircle className="add-icon" /> Thêm mới
                </button>
            </div>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Tên</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Chức năng</th>
                    </tr>
                </thead>
                <tbody>
                    {users
                        .filter(user => user.role !== 'admin' && user.teacherId.toLowerCase().startsWith(searchTerm.toLowerCase()))
                        .map((user, index) => {
                            // Kiểm tra trạng thái của người dùng
                            const isUserLocked = user.status === 'Khóa tài khoản';
                            return (
                                <tr key={user.id} className={isUserLocked ? 'user-locked' : ''}>
                                    <td style={{ textAlign: 'center', color: isUserLocked ? 'red' : 'inherit' }}>{index + 1}</td>
                                    <td style={{ textAlign: 'center', color: isUserLocked ? 'red' : 'inherit' }}>{user.teacherId}</td>
                                    <td style={{ textAlign: 'center', color: isUserLocked ? 'red' : 'inherit' }}>{user.email}</td>
                                    <td style={{ textAlign: 'center', color: isUserLocked ? 'red' : 'inherit' }}>{user.name}</td>
                                    <td style={{ textAlign: 'center', color: isUserLocked ? 'red' : 'inherit' }}>{user.role}</td>
                                   
                                    <td>
                                        <span className={user.status === 'Kích hoạt' ? 'user-status-active' : 'user-status-inactive'}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                    <button onClick={() => toggleUserStatus(user)} className="btn-user-status">
                                        {user.status === 'Đang hoạt động' ? 'Khóa' : 'Kích hoạt'}
                                    </button>
                                        <button onClick={() => handleEditUser(user)} className="btn-user-edit">Sửa</button>
                                    </td>
                                </tr>
                            );
                        })}
                    {noResults && (
                        <tr>
                            <td colSpan="7" className="no-results-message">Mã giảng viên không tồn tại trong hệ thống</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )}
    {/* Phần chỉnh sửa người dùng */}
    {isEditing && ( 
        <div className="edit-user-form">
            <h3 style={{ marginTop: 10, marginBottom: 10 }}>Chỉnh sửa người dùng</h3>
            <label htmlFor="teacherId">Mã giáo viên</label>
            <input
                id="teacherId" 
                type="text"
                placeholder="Mã giáo viên"
                value={updatedTeacherId}
                onChange={(e) => setUpdatedTeacherId(e.target.value)}
            />
            
            <label htmlFor="name">Tên</label>
            <input
                id="name"  
                type="text"
                placeholder="Tên"
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
            />
            
            <label htmlFor="email">Email</label>
            <input
                id="email"  
                type="email"
                placeholder="Email"
                value={updatedEmail}
                onChange={(e) => setUpdatedEmail(e.target.value)}
            />
            
            <div className="edit-user-buttons"> 
                <button onClick={handleUpdateUser} className="btn-user-save" style={{fontSize:16,fontWeight:"600"}}>Cập nhật</button>
                <button onClick={handleCancelEdit} className="btn-user-cancel"style={{fontSize:16}}>Hủy</button>
            </div>
        </div>
    )}

            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
        </div>
    );
    
    
};

export default User;
