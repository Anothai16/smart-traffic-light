import React, { useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import { CameraFilled } from '@ant-design/icons';
import classNames from 'classnames';

const { Title, Text } = Typography;

// Mock data for cameras at each intersection
interface Camera {
    id: number;
    name: string;
    imageUrl: string;
    position: 'top' | 'right' | 'bottom' | 'left';
}

const mockCameras: Camera[] = [
    { id: 1, name: 'Camera 1 (North)', imageUrl: 'http://localhost:5000/feed_video', position: 'top' },
    { id: 2, name: 'Camera 2 (East)', imageUrl: 'http://googleusercontent.com/image_generation_content/6', position: 'right' },
    { id: 3, name: 'Camera 3 (South)', imageUrl: 'http://googleusercontent.com/image_generation_content/7', position: 'bottom' },
    { id: 4, name: 'Camera 4 (West)', imageUrl: 'http://googleusercontent.com/image_generation_content/8', position: 'left' },
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
                return 'top-120 left-[45%]';
            case 'right':
                return 'top-137 left-[46.3%]';
            case 'bottom':
                return 'top-152 left-[41.23%]';
            case 'left':
                return 'top-137 left-[36%]';
            default:
                return '';
        }
    };

    return (
        <div className="p-4">
            <Title level={4} className="text-center">
                Top-Down View of the Intersection
            </Title>
            <Text className="block text-center mb-6">Click an icon to view the real-time camera feed.</Text>

            <div
                className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg"
                style={{
                    backgroundImage: `url('/img/others/map.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
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
            </div>

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