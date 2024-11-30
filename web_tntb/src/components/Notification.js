// Notification.js

export const sendNotification = async (expoPushToken, title, body) => {
    const message = {
        expoPushToken, 
        title: title || 'Thông báo sửa chữa',
        body: body || 'Bạn đã được phân công sự cố mới',
    };

    try {
        // Gọi endpoint của server
        const response = await fetch('http://localhost:3001/send-notification', { 
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (response.ok) {
            const result = await response.json(); // Nhận kết quả từ server
            console.log('Gửi thông báo thành công:', result);
        } else {
            console.error('Không thể gửi thông báo');
        }
    } catch (error) {
        console.error('Lỗi khi gửi thông báo:', error);
    }
};

// Hàm gửi thông báo lịch bảo trì
export const sendMaintenanceNotification = async (expoPushToken, title, body) => {
    await sendNotification(expoPushToken, title, body); 
};
