// SidePanelContent.tsx
import React from 'react';
import { Button, Space, Typography } from 'antd';
import { CaretRightOutlined, ControlOutlined } from '@ant-design/icons';

export type SidePanelContentProps = {
    callBackClose: () => void;
};

const SidePanelContent = (props: SidePanelContentProps) => {
    
    // --- Actions ---
    const handlePlayVideo = () => {
        console.log("Play Video clicked");
        // ใส่ Logic สำหรับเล่น Video ตรงนี้
    };

    const handlePiController = () => {
        console.log("PI Controller clicked");
        // ใส่ Logic สำหรับ PI Controller ตรงนี้
    };

    return (
        <div className="h-full w-full p-4">
            {/* ส่วน Header หรือ Title (ถ้ามี) */}
            <div className="flex flex-col items-center pt-4">
                <Typography.Text strong className="mb-4 text-gray-500 uppercase tracking-widest text-xs">
                    Button
                </Typography.Text>

                {/* จัดเรียงปุ่มด้วย Space */}
                <Space direction="vertical" size="middle" style={{ width: '100%' }} className="items-center">
                    
                    {/* ปุ่มที่ 1: Play Video */}
                    <Button 
                        type="primary" 
                        icon={<CaretRightOutlined />} 
                        size="large"
                        onClick={handlePlayVideo}
                        className="w-48 flex items-center justify-center"
                    >
                        Play Video
                    </Button>

                    {/* ปุ่มที่ 2: PI Controller */}
                    <Button 
                        icon={<ControlOutlined />} 
                        size="large"
                        onClick={handlePiController}
                        className="w-48 flex items-center justify-center"
                    >
                        PI Controller
                    </Button>

                </Space>
            </div>
        </div>
    );
};

export default SidePanelContent;