import React, { useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import { CameraFilled } from '@ant-design/icons';
import classNames from 'classnames';

const { Title, Text } = Typography;

// ข้อมูลจำลองสำหรับกล้องในแต่ละสี่แยก
interface Camera {
    id: number;
    name: string;
    imageUrl: string;
    position: 'top' | 'right' | 'bottom' | 'left';
}

const mockCameras: Camera[] = [
    { id: 1, name: 'กล้องแยกที่ 1 (ทิศเหนือ)', imageUrl: 'http://googleusercontent.com/image_generation_content/5', position: 'top' },
    { id: 2, name: 'กล้องแยกที่ 2 (ทิศตะวันออก)', imageUrl: 'http://googleusercontent.com/image_generation_content/6', position: 'right' },
    { id: 3, name: 'กล้องแยกที่ 3 (ทิศใต้)', imageUrl: 'http://googleusercontent.com/image_generation_content/7', position: 'bottom' },
    { id: 4, name: 'กล้องแยกที่ 4 (ทิศตะวันตก)', imageUrl: 'http://googleusercontent.com/image_generation_content/8', position: 'left' },
];

const IntersectionView: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

    const showModal = (camera: Camera) => {
        setSelectedCamera(camera);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedCamera(null);
    };

    const getCameraIconPosition = (position: string) => {
        switch (position) {
            case 'top':
                return 'top-12 left-1/2 -translate-x-1/2';
            case 'right':
                return 'top-1/2 right-12 -translate-y-1/2';
            case 'bottom':
                return 'bottom-12 left-1/2 -translate-x-1/2';
            case 'left':
                return 'top-1/2 left-12 -translate-y-1/2';
            default:
                return '';
        }
    };

    return (
        <div
            className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg p-8"
            style={{
                backgroundImage: `url('http://googleusercontent.com/image_generation_content/3')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Title level={4} className="text-white text-center mt-4">
                มุมมองสี่แยกจากด้านบน
            </Title>
            <Text className="block text-white text-center mb-6">คลิกที่ไอคอนเพื่อดูภาพจากกล้องแบบเรียลไทม์</Text>

            {mockCameras.map((camera) => (
                <Button
                    key={camera.id}
                    type="primary"
                    shape="circle"
                    icon={<CameraFilled />}
                    size="large"
                    onClick={() => showModal(camera)}
                    className={classNames(
                        'absolute z-10',
                        'bg-blue-600 hover:bg-blue-700',
                        getCameraIconPosition(camera.position)
                    )}
                />
            ))}

            <Modal
                title={selectedCamera?.name}
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
                centered
            >
                {selectedCamera && (
                    <img src={selectedCamera.imageUrl} alt={selectedCamera.name} className="w-full rounded-lg" />
                )}
            </Modal>
        </div>
    );
};

export default IntersectionView;