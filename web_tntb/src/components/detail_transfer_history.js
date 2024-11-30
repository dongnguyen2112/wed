import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Đảm bảo import useParams
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import '../css/Detail_transfer_history.css';

const DetailTransferHistory = () => {
    const { id: transferId } = useParams(); // Lấy transferId từ URL
    const [transferDetail, setTransferDetail] = useState(null);
    const [assets, setAssets] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransferDetail = async () => {
            const transferRef = doc(db, 'transfer_history', transferId);
            const transferDoc = await getDoc(transferRef);
            if (transferDoc.exists()) {
                setTransferDetail(transferDoc.data());
                const assetIds = transferDoc.data().selectedAssets || [];
                await fetchAssets(assetIds); // Gọi hàm fetchAssets ở đây
            } else {
                console.log('Không tìm thấy tài liệu chuyển nhượng');
                setLoading(false);
            }
        };

        const fetchAssets = async (assetIds) => {
            if (assetIds.length === 0) {
                setLoading(false);
                return;
            }
            const assetRef = collection(db, 'asset'); 
            const assetQuery = query(assetRef, where(documentId(), 'in', assetIds));
            const assetSnapshot = await getDocs(assetQuery);
            
            if (assetSnapshot.empty) {
                console.log('Không tìm thấy tài sản nào với các ID đã cho:', assetIds);
            }
        
            const fetchedAssets = {};
            assetSnapshot.forEach((doc) => {
                fetchedAssets[doc.id] = doc.data();
            });
            setAssets(fetchedAssets);
            setLoading(false);
        };

        fetchTransferDetail();
    }, [transferId]);

    if (loading) {
        return <div>Đang tải...</div>;
    }

    if (!transferDetail) {
        return <div>Không tìm thấy chi tiết chuyển nhượng.</div>; 
    }

    return (
        <div className="detail-transfer-history">
            <h2>Chi tiết chuyển nhượng</h2>
            <div className="transfer-info">
                <div className="info-item">
                    <strong>Ngày điều chuyển:</strong>
                    <span>{transferDetail.currentDate}</span>
                </div>
                <div className="info-item">
                    <strong>Vị trí hiện tại:</strong>
                    <span>{transferDetail.currentPosition}</span>
                </div>
                <div className="info-item">
                    <strong>Vị trí mới:</strong>
                    <span>{transferDetail.newPosition}</span>
                </div>
                <div className="info-item">
                    <strong>Người nhận:</strong>
                    <span>{transferDetail.receiver}</span>
                </div>
                <div className="info-item">
                    <strong>Người gửi:</strong>
                    <span>{transferDetail.sender}</span>
                </div>
                <div className="info-item">
                    <strong>Ghi chú:</strong>
                    <span>{transferDetail.notes}</span>
                </div>
            </div>
    
            
            <div className="asset-table-container"> {/* Thêm div bọc quanh bảng */}
                <table className="asset-table">
                    <thead>
                        <tr>
                             <th>Mã tài sản</th>
                            <th>Ảnh</th>
                            <th>Tên tài sản</th>
                            <th>Mô tả</th>
                            <th>Số lượng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transferDetail.selectedAssets.map(assetId => (
                            <tr key={assetId}>
                                <td>{assets[assetId]?.assetCode || 'Không có mã'}</td>
                                <td>
                                    <img 
                                        src={assets[assetId]?.imageUrl || ''} 
                                        alt={assets[assetId]?.assetName || 'Tài sản không tìm thấy'} 
                                        className="asset-image"
                                    />
                                </td>
                                <td>{assets[assetId]?.assetName || 'Không tìm thấy tên tài sản'}</td>
                                <td>{assets[assetId]?.assetDescription || 'Không có mô tả'}</td>
                                <td>{assets[assetId]?.quantity || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    
};

export default DetailTransferHistory;
