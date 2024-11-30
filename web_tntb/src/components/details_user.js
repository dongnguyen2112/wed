// register_user.js
import React, { useState } from 'react';
import { db, auth } from '../firebase'; // Nhập cấu hình Firebase, bao gồm cả auth
import { collection, doc, query, where, getDocs, setDoc } from 'firebase/firestore'; // Sử dụng setDoc để lưu với document ID
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Thêm import cho Firebase Auth
import '../css/details_user.css';

const DetailsUser = () => {
    const [name, setName] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Giảng viên');
    const [status, setStatus] = useState('Đang hoạt động');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Hàm xử lý khi submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu không trùng khớp.');
            return;
        } else if (password.length < 8) {
            setErrorMessage('Mật khẩu phải đủ 8 ký tự.');
            return;
        }

        setErrorMessage('');

        // Kiểm tra sự tồn tại của email và teacherId
        const usersRef = collection(db, 'user');
        const emailQuery = query(usersRef, where('email', '==', email));
        const teacherIdQuery = query(usersRef, where('teacherId', '==', teacherId));

        const emailSnapshot = await getDocs(emailQuery);
        const teacherIdSnapshot = await getDocs(teacherIdQuery);

        if (!emailSnapshot.empty) {
            setErrorMessage('Email đã tồn tại trong hệ thống.');
            return;
        }

        if (!teacherIdSnapshot.empty) {
            setErrorMessage('Mã giảng viên đã tồn tại trong hệ thống.');
            return;
        }

        // Nếu không có lỗi, tiến hành đăng ký với Firebase Authentication
        try {
            // Đăng ký tài khoản bằng email và mật khẩu
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const { user } = userCredential; // Lấy UUID từ Firebase Authentication
            const uid = user.uid;

            // Lưu thông tin người dùng vào Firestore với UUID làm document ID
            await setDoc(doc(db, 'user', uid), {
                name,
                teacherId: String(teacherId),
                email,
                password, // Lưu mật khẩu
                role,
                status,
            });

            alert('Đăng ký thành công!');
            // Reset form nếu cần
            setName('');
            setTeacherId('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setSuccessMessage('Đăng ký tài khoản thành công.');
        } catch (error) {
            console.error("Lỗi khi đăng ký:", error);
            setErrorMessage('Đăng ký không thành công. Vui lòng thử lại.');
        }
    };

    return (
        <div className="register-user" style={{width:"60%"}}>
            <h2 className="register-user__title">Đăng ký tài khoản mới</h2>
            <form onSubmit={handleSubmit} className="register-user__form" style={{width:"100%"}}>
                <div className="register-user__form-group">
                    <label htmlFor="teacherId" className="register-user__label">Mã giảng viên</label>
                    <input
                        id="teacherId"
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        required
                        className="register-user__input"
                    />
                </div>
                <div className="register-user__form-group">
                    <label htmlFor="name" className="register-user__label">Họ và tên</label>
                    <input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="register-user__input"
                    />
                </div>
                <div className="register-user__form-group">
                    <label htmlFor="email" className="register-user__label">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="register-user__input"
                    />
                </div>
    
                <div className="register-user__form-group">
                    <label htmlFor="password" className="register-user__label">Mật khẩu</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="register-user__input"
                    />
                </div>
    
                <div className="register-user__form-group">
                    <label htmlFor="confirmPassword" className="register-user__label">Nhập lại mật khẩu</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="register-user__input"
                    />
                </div>
    
                <div className="register-user__form-group">
                    <label htmlFor="role" className="register-user__label">Quyền</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="register-user__select"
                    >
                        <option value="Giảng viên">Giảng viên</option>
                        <option value="Nhân viên">Nhân viên</option>
                    </select>
                </div>
    
                {errorMessage && <p className="register-user__error-message">{errorMessage}</p>}
                {successMessage && <p className="register-user__success-message">{successMessage}</p>}
    
                <button type="submit" className="register-user__button" style={{backgroundColor:"#1E90FF", fontWeight:"600",borderRadius:10}}>Đăng ký</button>
            </form>
        </div>
    );
    
};

export default DetailsUser;
