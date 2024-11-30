import React, { useEffect, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { parse, isValid } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import '../css/Chart.css';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const UserStatusChart = () => {
    const [activeCount, setActiveCount] = useState(0);
    const [lockedCount, setLockedCount] = useState(0);
    const [monthlyData, setMonthlyData] = useState([]);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [teacherCount, setTeacherCount] = useState(0);
    const [maintenanceCompleteCount, setMaintenanceCompleteCount] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const usersCollection = collection(db, 'user');
                const usersSnapshot = await getDocs(usersCollection);
                const users = usersSnapshot.docs.map((doc) => doc.data());
                const activeUsers = users.filter((user) => user.status === 'Đang hoạt động').length;
                const lockedUsers = users.filter((user) => user.status === 'Khóa tài khoản').length;

                // Đếm nhân viên và giảng viên
                const employees = users.filter((user) => user.role === 'Nhân viên').length;
                const teachers = users.filter((user) => user.role === 'Giảng viên').length;

                setActiveCount(activeUsers);
                setLockedCount(lockedUsers);
                setEmployeeCount(employees);
                setTeacherCount(teachers);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu người dùng:', error);
            }
        };

        const fetchBookingData = async () => {
            try {
                const bookingsCollection = collection(db, 'bookings');
                const bookingsSnapshot = await getDocs(bookingsCollection);
                const bookings = bookingsSnapshot.docs.map((doc) => doc.data());

                // Khởi tạo mảng monthlyCounts với 12 đối tượng
                const monthlyCounts = Array.from({ length: 12 }, () => ({ replace: 0, met: 0 }));

                bookings.forEach((booking) => {
                    if (booking.bookingDate && booking.status) {
                        const date = parse(booking.bookingDate, 'dd-MM-yyyy', new Date());
                        if (isValid(date)) {
                            const month = date.getMonth(); // Lấy tháng (0 - 11)
                            if (monthlyCounts[month]) {
                                if (booking.status === 'Thay mới') {
                                    monthlyCounts[month].replace += 1;
                                } else if (booking.status === 'Đạt Yêu Cầu') {
                                    monthlyCounts[month].met += 1;
                                }
                            }
                        }
                    }
                });

                setMonthlyData(monthlyCounts);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu booking:', error);
            }
        };

        const fetchMaintenanceData = async () => {
            try {
                const maintenanceCollection = collection(db, 'maintenance');
                const q = query(maintenanceCollection, where('maintenanceStatus', '==', 'Hoàn tất bảo trì'));
                const maintenanceSnapshot = await getDocs(q);
                setMaintenanceCompleteCount(maintenanceSnapshot.docs.length);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu bảo trì:', error);
            }
        };

        fetchUserData();
        fetchBookingData();
        fetchMaintenanceData();
    }, []);

    const doughnutData = {
        labels: ['Đang hoạt động', 'Khóa tài khoản'],
        datasets: [
            {
                data: [activeCount, lockedCount],
                backgroundColor: ['#4caf50', '#f44336'],
                borderWidth: 0,
            },
        ],
    };

    const doughnutOptions = {
        cutout: '60%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = activeCount + lockedCount;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    const barData = {
        labels: [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
        ],
        datasets: [
            {
                label: 'Thay mới',
                data: monthlyData.map((item) => item.replace),
                backgroundColor: '#ff9800',
            },
            {
                label: 'Đạt Yêu Cầu',
                data: monthlyData.map((item) => item.met),
                backgroundColor: '#2196f3',
            },
        ],
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    return (
        <div className="charts-container">
            {/* Thẻ nhỏ hiển thị tổng số */}
            <div className="info-cards">
                <div className="info-card">
                    <h3 className='title-info-card'>Tổng số nhân viên</h3>
                    <p>{employeeCount}</p>
                </div>
                <div className="info-card">
                    <h3 className='title-info-card'>Tổng số giảng viên</h3>
                    <p>{teacherCount}</p>
                </div>
                <div className="info-card">
                    <h3 className='title-info-card'>Hoàn tất bảo trì</h3>
                    <p>{maintenanceCompleteCount}</p>
                </div>
            </div>

            {/* Biểu đồ Bar */}
            <div className="chart-card bar-chart">
                <h4>Thống kê sự cố theo tháng</h4>
                <Bar data={barData} options={barOptions} />
            </div>
             {/* Biểu đồ Doughnut */}
             <div className="chart-card doughnut-chart">
                <h4>Thống kê trạng thái người dùng</h4>
                    <div className="doughnut-chart1">
                    <Doughnut data={doughnutData} options={doughnutOptions}/>
                    <div className="doughnut-legend">
                    {doughnutData.labels.map((label, index) => (
                        <div key={index} className="doughnut-legend-item">
                            <div
                                className="doughnut-legend-color"
                                style={{
                                    backgroundColor: doughnutData.datasets[0].backgroundColor[index],
                                }}
                            ></div>
                            <span className="doughnut-legend-label">
                                {label}: {doughnutData.datasets[0].data[index]} người
                            </span>
                        </div>
                    ))}
                </div>
            </div>
                {/* Chú thích */}
               
            </div>

        </div>
    );
};

export default UserStatusChart;
