// src/views/traffic/TrafficManagement.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Flex, Button, Typography, Input, Divider, Spin, Tag, Alert } from 'antd';
import classNames from 'classnames';
import {
    apiGetTrafficModes,
    apiGetIntersectionData,
    apiUpdateIntersectionTimes,
    apiGetModeStatus,
    apiUpdateTrafficMode,
} from '@/services/TrafficService';
import type { AxiosError } from 'axios';
import toast from '@/components/ui/toast';
import Notification from '@/components/ui/Notification';
import { SyncOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Mode {
    name: string;
    color: string;
}

// ✅ แก้ไข Interface ให้รองรับทั้งข้อมูลที่มาจาก API และข้อมูลที่จะใช้คำนวณในหน้าจอ
interface IntersectionTimeData {
    Intersection_ID: number;
    Lane_Sequence: number; 
    Name: string;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

interface ApiErrorResponse {
    message: string;
}

const YELLOW_LIGHT_DURATION = 3;


const MODE_ORDER = ['Auto', 'Intelligence', 'Caution', 'Stop'];

const TrafficManagement = () => {
    const [currentMode, setCurrentMode] = useState('');
    const [selectedMode, setSelectedMode] = useState('');
    const [modes, setModes] = useState<Mode[]>([]);
    const [intersectionTimes, setIntersectionTimes] = useState<IntersectionTimeData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const showNotification = (type: 'success' | 'warning' | 'danger' | 'info', title: string, message: string) => {
        toast.push(
            <Notification title={title} type={type}>
                {message}
            </Notification>
        );
    };
    
    // --- Data Fetching Logic ---
    const fetchTrafficData = useCallback(async () => {
        try {
            setLoading(true);
            setLastUpdated(dayjs().format('DD/MM/YYYY, HH:mm:ss'));
            
            // 1. Fetch Modes
            const modesResponse = await apiGetTrafficModes();
            if (modesResponse.data.modes) {
                const apiModes = modesResponse.data.modes.map((m: any) => {
                    let colorClass = '';
                    switch (m.Mode_Name) {
                        case 'Auto': colorClass = 'bg-green-500'; break;
                        case 'Intelligence': colorClass = 'bg-blue-500'; break;
                        case 'Caution': colorClass = 'bg-yellow-500'; break;
                        case 'Stop': colorClass = 'bg-red-500'; break;
                        default: colorClass = 'bg-gray-500';
                    }
                    return { name: m.Mode_Name, color: colorClass };
                });
                setModes(apiModes);
            }
            
            // 2. Fetch Intersections
            const intersectionsResponse = await apiGetIntersectionData();
            if (intersectionsResponse.data.intersections) {
                // ✅ ใช้ any ชั่วคราวตอน map เพื่อป้องกัน Type Error จาก API เก่า
                const mappedData: IntersectionTimeData[] = intersectionsResponse.data.intersections.map((item: any) => ({
                    Intersection_ID: item.Intersection_ID,
                    // ถ้าไม่มี Lane_Sequence ส่งมา ให้ใช้ Intersection_ID แทนชั่วคราว
                    Lane_Sequence: item.Lane_Sequence ?? item.Intersection_ID ?? 0, 
                    Name: item.Name,
                    New_Red_Duration: Number(item.New_Red_Duration || 0),
                    New_Green_Duration: Number(item.New_Green_Duration || 0)
                }));

                // ✅ Sort ได้อย่างปลอดภัยเพราะ Interface มี Lane_Sequence แล้ว
                const sortedIntersections = mappedData.sort(
                    (a, b) => a.Lane_Sequence - b.Lane_Sequence
                );
                setIntersectionTimes(sortedIntersections);
            }

            // 3. Mode Status
            const modeStatusResponse = await apiGetModeStatus();
            const modeFromApi = modeStatusResponse.data.currentMode;
            if (modeFromApi) {
                setCurrentMode(modeFromApi);
                setSelectedMode(modeFromApi);
            } else {
                setCurrentMode('No Mode Selected');
                setSelectedMode('No Mode Selected');
            }
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
            showNotification('danger', 'Failed to fetch data', `Failed to fetch traffic data. Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrafficData();
    }, [fetchTrafficData]);

    const sortedModes = useMemo(() => {
        return [...modes].sort((a, b) => {
            return MODE_ORDER.indexOf(a.name) - MODE_ORDER.indexOf(b.name);
        });
    }, [modes]);

    const currentModeDetails = modes.find(m => m.name === currentMode);

    const handleUpdateMode = async () => {
        if (!selectedMode || selectedMode === 'No Mode Selected' || selectedMode === currentMode) {
            showNotification('info', 'Change Mode', 'Please select a different mode.');
            return;
        }

        try {
            setLoading(true);
            const payload = { modeName: selectedMode };
            const response = await apiUpdateTrafficMode(payload);

            if (response.data?.success) {
                showNotification('success', 'Mode Changed', response.data.message || `Successfully changed mode to ${selectedMode}!`);
                await fetchTrafficData(); 
            } else {
                showNotification('danger', 'Failed to Change Mode', response.data.message || `Failed to change mode.`);
            }
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
            showNotification('danger', 'Failed to Change Mode', `Failed to change mode. Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- 🟢 Sequential Loop Logic: Calculate based on Circular Loop (152 Logic) ---
    const handleTimeChange = (index: number, color: 'red' | 'green', value: string) => {
        const parsedValue = parseInt(value, 10);
        const numericValue = isNaN(parsedValue) ? 0 : parsedValue;
        
        setIntersectionTimes(prev => {
            let newTimes = [...prev];
            
            if (color === 'green' && index === 0) {
                newTimes = newTimes.map(item => ({ 
                    ...item, 
                    New_Green_Duration: numericValue 
                }));
            }

            const green = newTimes[0]?.New_Green_Duration || 0;
            const segment = green + YELLOW_LIGHT_DURATION; 

            newTimes = newTimes.map((item, idx) => {
                let calculatedRed = 0;
                if (idx === 0) {
                    calculatedRed = segment * newTimes.length;
                } else {
                    calculatedRed = segment * idx;
                }
                return { ...item, New_Red_Duration: calculatedRed };
            });

            return newTimes;
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            // ✅ FIX: แก้ Payload ให้ตรงกับที่ traffic.routes.ts ต้องการ (ตัด Old_... และ Intersection_ID ออก)
            // Backend ต้องการแค่ { Lane_Sequence, New_Red_Duration, New_Green_Duration }
            const payload = {
                intersections: intersectionTimes.map(item => ({
                    Intersection_ID: item.Intersection_ID,
                    Lane_Sequence: item.Lane_Sequence, 
                    New_Red_Duration: Number(item.New_Red_Duration),
                    New_Green_Duration: Number(item.New_Green_Duration),
                })),
            };
            
            // ใช้ as any เพื่อเลี่ยง Error ใน Frontend Service ที่อาจยังไม่ได้ update type
            const response = await apiUpdateIntersectionTimes(payload as any);
            
            if (response.data?.success) {
                showNotification('success', 'Times Updated', response.data.message || 'Successfully changed!');
                fetchTrafficData(); 
            } else {
                showNotification('danger', 'Update Failed', response.data.message || 'Failed to change intersection times.');
            }
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            // จัดการ 422 error
            if (err.response?.status === 422) {
                console.error("Validation Error:", err.response.data);
                showNotification('danger', 'Validation Error', 'Backend ปฏิเสธข้อมูล (422) ตรวจสอบว่าส่ง field เกินไปหรือไม่');
           } else {
               const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
               showNotification('danger', 'Update Failed', `An error occurred: ${errorMessage}`);
           }
        } finally {
            setLoading(false);
        }
    };

    if (loading && modes.length === 0) {
        return <Flex justify="center" align="middle" style={{ minHeight: '100vh', padding: '20px' }}><Spin size="large" /></Flex>;
    }

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            <Flex vertical gap="large">
                
                {/* --- HEADER --- */}
                <Flex justify="space-between" align="middle" wrap="wrap" gap="small">
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Traffic Light Management
                    </Title>
                    <div className="flex items-center gap-4 flex-wrap">
                        <Text type="secondary" className="text-sm hidden md:inline">
                            Last Updated: {lastUpdated || 'N/A'}
                        </Text>
                        
                        <Flex align="center" gap="small">
                            <span className="text-base font-semibold text-gray-700">CURRENT MODE:</span>
                            <div
                                className={classNames(
                                    'rounded-full w-3 h-3',
                                    currentModeDetails?.color || 'bg-gray-400'
                                )}
                            />
                            <Text strong className="text-lg" style={{ color: currentModeDetails?.color.replace('bg-', 'text-') || '#9CA3AF' }}>
                                 {currentMode || 'No mode selected'}
                            </Text>
                        </Flex>
                        
                        <Button onClick={fetchTrafficData} icon={<SyncOutlined />} loading={loading} type="default">
                            Refresh
                        </Button>
                    </div>
                </Flex>

                {/* --- 1. TRAFFIC MODE SELECTION CARD --- */}
                <Card className="shadow-lg rounded-xl border-l-4 border-blue-500">
                    <Flex vertical gap="large" className="w-full">
                        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-base font-bold text-gray-700 whitespace-nowrap">Selected Mode to Apply:</span>                    
                            <Tag 
                                className={classNames(
                                    "!text-lg !py-1 !px-3 !font-extrabold", 
                                    selectedMode === 'Auto' && 'bg-green-100 !text-green-700',
                                    selectedMode === 'Stop' && 'bg-red-100 !text-red-700',
                                    selectedMode === 'Intelligence' && 'bg-blue-100 !text-blue-700',
                                    selectedMode === 'Caution' && 'bg-yellow-100 !text-yellow-700',
                                    (!selectedMode || selectedMode === 'No Mode Selected') && 'bg-gray-200 !text-gray-700'
                                )}
                            >
                                {selectedMode}
                            </Tag>
                            
                            <Button
                                type="primary"
                                className="md:ml-auto font-bold py-2 h-auto text-lg rounded-lg"
                                onClick={handleUpdateMode}
                                disabled={!selectedMode || selectedMode === 'No Mode Selected' || selectedMode === currentMode}
                            >
                                Apply Mode Change
                            </Button>
                        </div>
                        
                        <Divider orientation="left">Available Modes</Divider>

                        <Flex justify="space-between" gap="large" wrap="wrap">
                            {sortedModes.map(mode => (
                                <div
                                    key={mode.name}
                                    className={classNames(
                                        "flex-1 basis-[calc(25%-1rem)] min-w-[150px] text-center p-4 cursor-pointer transition-all duration-300 rounded-xl",
                                        "hover:scale-[1.02] hover:shadow-xl",
                                        selectedMode === mode.name 
                                            ? mode.name === 'Stop'
                                                ? 'border-4 border-red-500 bg-red-50 shadow-red-200 shadow-lg' 
                                                : 'border-4 border-blue-500 bg-blue-50 shadow-lg'               
                                            : 'border border-gray-200 bg-white shadow-sm'                    
                                    )}
                                    onClick={() => setSelectedMode(mode.name)}
                                >
                                    <Flex vertical align="center" gap="small">
                                        <div 
                                            className={classNames(
                                                'rounded-full w-12 h-12 flex items-center justify-center text-white text-xl font-extrabold mb-2',
                                                mode.color
                                            )}
                                        >
                                            {mode.name.substring(0, 1)}
                                        </div>
                                        <Title level={5} className='!my-0 !font-extrabold'>{mode.name}</Title>
                                        <Text type="secondary" className="text-xs">Click to select</Text>
                                    </Flex>
                                </div>
                            ))}
                        </Flex>
                    </Flex>
                </Card>
                
                {/* --- 2. TRAFFIC LIGHT TIME MANAGEMENT CARD --- */}
                <Card 
                    title={<Title level={4} className='!my-0 !font-bold text-green-600 flex items-center'><SettingOutlined className='mr-2' /> Set Intersection Times (Auto Mode)</Title>} 
                    className="shadow-lg rounded-xl border-l-4 border-green-500"
                >
                    <Flex vertical gap="large" className="w-full">
                        <Alert
                            message="กำหนดระยะเวลาไฟเขียวที่เลนแรกเท่านั้น โดยระบบจะคำนวณระยะเวลาไฟเขียวและไฟแดงของสี่แยกถัดไปโดยอัตโนมัติ"
                            type="info"
                            showIcon
                            className="mb-4"
                        />
                        {intersectionTimes.map((intersection, index) => (
                            <Card
                                key={intersection.Lane_Sequence}
                                title={
                                    <Title level={4} className="!my-0 text-blue-800 font-extrabold flex items-center">
                                        Sequence {intersection.Lane_Sequence}
                                    </Title>
                                }
                                className={classNames(
                                    "w-full border-2 border-gray-100 shadow-md transition-shadow hover:shadow-lg",
                                    index === 0 ? 'bg-blue-50/50' : 'bg-white' 
                                )}
                            >
                                <Flex align="middle" justify="space-between" wrap="wrap" gap="large">
                                    <Flex vertical gap="small" className="flex-1 min-w-[150px] p-2 rounded-lg bg-red-50">
                                        <span className="font-bold text-red-600 text-lg">Red Duration (s)</span>
                                        <Input
                                            type="number"
                                            value={intersection.New_Red_Duration.toString()}
                                            className="rounded-lg h-12 text-lg"
                                            disabled={true} 
                                            style={{ backgroundColor: '#fff1f0', color: '#cf1322', fontWeight: 'bold' }}
                                        />
                                    </Flex>
                                    <Flex vertical gap="small" className="flex-1 min-w-[150px] p-2 rounded-lg bg-green-50">
                                        <span className="font-bold text-green-600 text-lg">Green Duration (s)</span>
                                        <Input
                                            type="number"
                                            value={intersection.New_Green_Duration.toString()}
                                            onChange={e => handleTimeChange(index, 'green', e.target.value)}
                                            className="rounded-lg h-12 text-lg"
                                            disabled={index !== 0} 
                                            placeholder={index !== 0 ? "Linked to Lane 1" : ""}
                                        />
                                    </Flex>
                                </Flex>
                                <div className="mt-2 text-sm text-gray-600 font-medium p-2 bg-gray-100 rounded">
                                    <span className="font-bold text-red-800">หมายเหตุ:</span> {index === 0 ? 'ไฟแดงแยกนี้คำนวณจากทุกแยกที่เหลือรวมกัน' : `ไฟแดงแยกนี้คำนวณสะสมจากแยกก่อนหน้า`}
                                </div>
                            </Card>
                        ))}
                        <Flex justify="flex-end" className="mt-4">
                            <Button 
                                type="primary" 
                                onClick={handleSave} 
                                className="font-bold py-3 h-auto px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-green-500 hover:!bg-green-600"
                            >
                                Save Changes and Update Times
                            </Button>
                        </Flex>
                    </Flex>
                </Card>
            </Flex>
        </div>
    );
};

export default TrafficManagement;