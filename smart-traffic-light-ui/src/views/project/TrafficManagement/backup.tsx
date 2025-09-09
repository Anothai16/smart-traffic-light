import React, { useState, useEffect, useCallback } from 'react';
import { Card, Flex, Button, Typography, Input, Divider, message, Spin } from 'antd';
import classNames from 'classnames';
import { apiGetTrafficModes, apiGetIntersectionData, apiUpdateIntersectionTimes } from '@/services/TrafficService';
import type { AxiosError } from 'axios';

const { Title } = Typography;

interface Mode {
    name: string;
    color: string;
}

interface IntersectionTimeData {
    Intersection_ID: number;
    Name: string;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

const TrafficManagement = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [currentMode, setCurrentMode] = useState('');
    const [selectedMode, setSelectedMode] = useState('');
    const [modes, setModes] = useState<Mode[]>([]);
    const [intersectionTimes, setIntersectionTimes] = useState<IntersectionTimeData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // useCallback เพื่อให้ fetchTrafficData ไม่ถูกสร้างใหม่ทุก render หาก dependencies ไม่เปลี่ยน
    const fetchTrafficData = useCallback(async () => {
        try {
            setLoading(true);
            const modesResponse = await apiGetTrafficModes();
            if (modesResponse.data.modes) {
                const apiModes = modesResponse.data.modes.map(m => {
                    let colorClass = '';
                    switch (m.Mode_Name) {
                        case 'Auto':
                            colorClass = 'bg-green-500';
                            break;
                        case 'Intelligence':
                            colorClass = 'bg-blue-500';
                            break;
                        case 'Caution':
                            colorClass = 'bg-yellow-500';
                            break;
                        case 'Stop':
                            colorClass = 'bg-red-500';
                            break;
                        default:
                            colorClass = 'bg-gray-500';
                    }
                    return {
                        name: m.Mode_Name,
                        color: colorClass,
                    };
                });
                setModes(apiModes);
            }

            const intersectionsResponse = await apiGetIntersectionData();
            if (intersectionsResponse.data.intersections) {
                setIntersectionTimes(intersectionsResponse.data.intersections);
            }

            // ตั้งค่าโหมดเริ่มต้นเป็น 'Auto' หากมี
            const defaultMode = modesResponse.data.modes.find(m => m.Mode_Name === 'Auto')?.Mode_Name || '';
            setCurrentMode(defaultMode);
            setSelectedMode(defaultMode);

        } catch (error) {
            const err = error as AxiosError;
            messageApi.error(`Failed to fetch traffic data. Error: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }, [messageApi]); // Dependencies สำหรับ useCallback

    useEffect(() => {
        fetchTrafficData();
    }, [fetchTrafficData]); // Dependencies สำหรับ useEffect คือ fetchTrafficData ที่ถูก memoized ด้วย useCallback

    const currentModeDetails = modes.find(m => m.name === currentMode);

    const handleSelectMode = (mode: string) => {
        setSelectedMode(mode);
        // สามารถเพิ่ม logic อื่นๆ เมื่อเปลี่ยนโหมดได้ที่นี่
        // เช่น โหลดค่าเริ่มต้นของเวลาสำหรับโหมดที่เลือก หากต้องการ
    };

    const handleTimeChange = (index: number, color: 'red' | 'green', value: string) => {
        setIntersectionTimes(prev => {
            const newTimes = [...prev];
            const updatedTime = { ...newTimes[index] };
            if (color === 'red') {
                updatedTime.New_Red_Duration = parseInt(value, 10) || 0; // ใช้ || 0 เพื่อจัดการกรณีเป็น NaN
            } else {
                updatedTime.New_Green_Duration = parseInt(value, 10) || 0;
            }
            newTimes[index] = updatedTime;
            return newTimes;
        });
    };

    const handleSave = async () => {
        if (selectedMode !== 'Auto') {
            messageApi.warning('Please select Auto mode to change intersection times.');
            return;
        }

        try {
            const payload = {
                intersections: intersectionTimes.map(item => ({
                    Intersection_ID: item.Intersection_ID,
                    New_Red_Duration: Number(item.New_Red_Duration),
                    New_Green_Duration: Number(item.New_Green_Duration),
                })),
            };

            await apiUpdateIntersectionTimes(payload); // ส่ง payload ที่สร้างขึ้นใหม่
            messageApi.success('Successfully changed!');
        } catch (error: any) {
            console.error('An error occurred during handleSave:', error);
            messageApi.error(`An error occurred: ${error.message}`);
        }
    };

    if (loading) {
        return <Flex justify="center" align="middle" style={{ minHeight: '100vh', padding: '20px' }}><Spin size="large" /></Flex>;
    }

    return (
        <>
            {contextHolder}
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Traffic Light Management
                    </Title>
                    <Flex align="center" gap="small" className="font-semibold text-gray-700">
                        <span className="text-base">Status:</span>
                        <div className="flex items-center gap-2">
                            <div
                                className={classNames(
                                    'rounded-full w-4 h-4',
                                    currentModeDetails?.color || 'bg-gray-400'
                                )}
                            />
                            <span className="font-bold text-lg">{currentMode || 'No Mode Selected'}</span>
                        </div>
                    </Flex>
                </Flex>
                <Card title="Traffic Mode" className="shadow-lg rounded-lg">
                    <Flex vertical gap="large" className="w-full">
                        <div className="mb-2">
                            <span className="mr-2 text-base font-semibold">Current Mode :</span>
                            <Input className="w-40 rounded-md" value={selectedMode} readOnly />
                        </div>
                        <Button
                            type="primary"
                            className="w-full mb-4 text-lg font-bold py-6 flex items-center justify-center rounded-lg"
                            onClick={() => { }} // ปุ่มนี้อาจจะใช้เลือกโหมดแบบอื่น หรืออาจจะถูกลบออกไป
                        >
                            Select Mode
                        </Button>
                        <Flex justify="space-between" gap="large" wrap="wrap">
                            {modes.map(mode => (
                                <Card
                                    key={mode.name}
                                    className={classNames(
                                        "flex-1 min-w-[150px] text-center cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl rounded-lg",
                                        selectedMode === mode.name ? 'border-2 border-blue-500' : ''
                                    )}
                                    onClick={() => handleSelectMode(mode.name)}
                                >
                                    <Flex vertical align="center" gap="small">
                                        <div className="font-bold text-lg">{mode.name}</div>
                                        <div
                                            className={classNames(
                                                'rounded-full w-24 h-24',
                                                mode.color
                                            )}
                                        />
                                    </Flex>
                                </Card>
                            ))}
                        </Flex>
                    </Flex>
                </Card>
                {selectedMode === 'Auto' && ( // แสดงส่วนนี้เมื่อเลือกโหมด Auto เท่านั้น
                    <Card title="Traffic Light Manage" className="shadow-lg rounded-lg">
                        <Flex vertical gap="large" className="w-full">
                            <div className="text-center mb-4">
                                <h5 className="font-bold text-lg">Set time auto mode</h5>
                            </div>
                            {intersectionTimes.map((intersection, index) => (
                                <div key={intersection.Intersection_ID}>
                                    <Flex align="middle" justify="space-between" wrap="wrap" gap="middle">
                                        <Button type="primary" className="font-bold w-full md:w-auto h-10">
                                            {intersection.Name}
                                        </Button>
                                        <Flex gap="large" wrap="wrap" className="flex-1">
                                            <div className="flex-1 min-w-[180px]">
                                                <Flex align="center" gap="small" className="mb-2">
                                                    <span className="font-bold text-red-500">Red</span>
                                                    <span className="text-sm text-gray-500">Default: {intersection.New_Red_Duration} วินาที</span>
                                                </Flex>
                                                <Input
                                                    type="number"
                                                    value={intersection.New_Red_Duration.toString()}
                                                    onChange={e => handleTimeChange(index, 'red', e.target.value)}
                                                    placeholder="Enter new red time"
                                                    className="rounded-md"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[180px]">
                                                <Flex align="center" gap="small" className="mb-2">
                                                    <span className="font-bold text-green-500">Green</span>
                                                    <span className="text-sm text-gray-500">Default: {intersection.New_Green_Duration} วินาที</span>
                                                </Flex>
                                                <Input
                                                    type="number"
                                                    value={intersection.New_Green_Duration.toString()}
                                                    onChange={e => handleTimeChange(index, 'green', e.target.value)}
                                                    placeholder="Enter new green time"
                                                    className="rounded-md"
                                                />
                                            </div>
                                        </Flex>
                                    </Flex>
                                    <Divider className="my-4" />
                                </div>
                            ))}
                            <Flex justify="flex-end" className="mt-4">
                                <Button type="primary" onClick={handleSave} className="font-bold py-2 px-6 rounded-lg">
                                    <Flex align="center" gap="small">
                                        Change
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </Flex>
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                )}
            </Flex>
        </>
    );
};

export default TrafficManagement;