// SidePanelContent.tsx
import React, { useState } from 'react';
import { Button, Space, Typography, message } from 'antd';
import { CaretRightOutlined, ControlOutlined, StopOutlined } from '@ant-design/icons';
// ✅ นำเข้า apiStopPiController เพิ่มเข้ามา
import { apiStartVideo, apiStopVideo, apiStartPiController, apiStopPiController } from "../../../services/SystemControlService";

export type SidePanelContentProps = {
    callBackClose: () => void;
};

const SidePanelContent = (props: SidePanelContentProps) => {
    const [isLoadingStart, setIsLoadingStart] = useState(false);
    const [isLoadingStop, setIsLoadingStop] = useState(false);
    const [isLoadingPi, setIsLoadingPi] = useState(false); 
    // ✅ เพิ่ม State สำหรับปุ่ม Stop PI
    const [isLoadingStopPi, setIsLoadingStopPi] = useState(false); 

    // --- Actions ---
    const handlePlayVideo = async () => {
        setIsLoadingStart(true);
        try {
            const response = await apiStartVideo();
            message.success(response.message || 'ส่งคำสั่งเปิดระบบเรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อกับ Server ได้');
        } finally {
            setIsLoadingStart(false);
        }
    };

    const handleStopVideo = async () => {
        setIsLoadingStop(true);
        try {
            const response = await apiStopVideo();
            message.success(response.message || 'ส่งคำสั่งหยุดระบบเรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อกับ Server ได้');
        } finally {
            setIsLoadingStop(false);
        }
    };

    const handlePiController = async () => {
        setIsLoadingPi(true);
        try {
            const response = await apiStartPiController();
            message.success(response.message || 'ส่งคำสั่งเริ่ม PI Controller เรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อกับ Server ได้');
        } finally {
            setIsLoadingPi(false);
        }
    };

    // ✅ เพิ่มฟังก์ชันสำหรับหยุด PI Controller
    const handleStopPiController = async () => {
        setIsLoadingStopPi(true);
        try {
            const response = await apiStopPiController();
            message.success(response.message || 'ส่งคำสั่งหยุด PI Controller เรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อกับ Server ได้');
        } finally {
            setIsLoadingStopPi(false);
        }
    };

    return (
        <div className="h-full w-full p-4">
            <div className="flex flex-col items-center pt-4">
                <Typography.Text strong className="mb-4 text-gray-500 uppercase tracking-widest text-xs">
                    System Control
                </Typography.Text>

                <Space direction="vertical" size="middle" style={{ width: '100%' }} className="items-center">
                    
                    {/* ปุ่มที่ 1: Play Video */}
                    <Button 
                        type="primary" 
                        icon={<CaretRightOutlined />} 
                        size="large"
                        onClick={handlePlayVideo}
                        loading={isLoadingStart}
                        className="w-48 flex items-center justify-center"
                    >
                        Play Video
                    </Button>

                    {/* ปุ่มที่ 2: Stop Video */}
                    <Button 
                        type="primary" 
                        danger 
                        icon={<StopOutlined />} 
                        size="large"
                        onClick={handleStopVideo}
                        loading={isLoadingStop}
                        className="w-48 flex items-center justify-center"
                    >
                        Stop Video
                    </Button>

                    {/* ปุ่มที่ 3: PI Controller */}
                    <Button 
                        icon={<ControlOutlined />} 
                        size="large"
                        onClick={handlePiController}
                        loading={isLoadingPi}
                        className="w-48 flex items-center justify-center"
                    >
                        PI Controller
                    </Button>

                    {/* ✅ ปุ่มที่ 4: Stop Controller */}
                    <Button 
                        danger // ทำให้เป็นสีแดง
                        icon={<StopOutlined />} 
                        size="large"
                        onClick={handleStopPiController}
                        loading={isLoadingStopPi}
                        className="w-48 flex items-center justify-center"
                    >
                        Stop Controller
                    </Button>

                </Space>
            </div>
        </div>
    );
};

export default SidePanelContent;