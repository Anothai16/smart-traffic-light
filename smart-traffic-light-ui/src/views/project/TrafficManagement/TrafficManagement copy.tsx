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
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { SyncOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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

interface ApiErrorResponse {
    message: string;
}

const YELLOW_LIGHT_DURATION = 3;

const TrafficManagement = () => {
    const [currentMode, setCurrentMode] = useState('');
    const [selectedMode, setSelectedMode] = useState('');
    const [modes, setModes] = useState<Mode[]>([]);
    const [intersectionTimes, setIntersectionTimes] = useState<IntersectionTimeData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const username = useSelector((state: RootState) => state.auth.user.firstName);

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

    const currentModeDetails = modes.find(m => m.name === currentMode);
    const selectedModeDetails = useMemo(() => modes.find(m => m.name === selectedMode), [modes, selectedMode]);

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
                setCurrentMode(selectedMode);
                showNotification('success', 'Mode Changed', response.data.message || `Successfully changed mode to ${selectedMode}!`);
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
    
    // --- Time Calculation Logic ---
    const handleTimeChange = (index: number, color: 'red' | 'green', value: string) => {
        const parsedValue = parseInt(value, 10);
        
        setIntersectionTimes(prev => {
            const newTimes = [...prev];
            const updatedTime = { ...newTimes[index] };
            
            if (color === 'red') {
                updatedTime.New_Red_Duration = isNaN(parsedValue) ? 0 : parsedValue;
            } else if (color === 'green') {
                updatedTime.New_Green_Duration = isNaN(parsedValue) ? 0 : parsedValue;
            }
            newTimes[index] = updatedTime; 

            if (newTimes.length >= 4) {
                for (let i = 1; i < newTimes.length; i++) {
                    const prevIndex = i - 1;
                    const prevRed = newTimes[prevIndex].New_Red_Duration || 0;
                    const prevGreen = newTimes[prevIndex].New_Green_Duration || 0;
                    const newRed = prevRed + prevGreen + YELLOW_LIGHT_DURATION;
                    newTimes[i] = {
                        ...newTimes[i],
                        New_Red_Duration: newRed, 
                    };
                }
            }
            return newTimes;
        });
    };

    const handleSave = async () => {
        if (selectedMode !== 'Auto') {
            showNotification('warning', 'Save Failed', 'Please select Auto mode to change intersection times.');
            return;
        }
        try {
            setLoading(true);
            const payload = {
                intersections: intersectionTimes.map(item => ({
                    Intersection_ID: item.Intersection_ID,
                    New_Red_Duration: Number(item.New_Red_Duration),
                    New_Green_Duration: Number(item.New_Green_Duration),
                })),
            };
            const response = await apiUpdateIntersectionTimes(payload);
            if (response.data?.success) {
                showNotification('success', 'Times Updated', response.data.message || 'Successfully changed!');
            } else {
                showNotification('danger', 'Update Failed', response.data.message || 'Failed to change intersection times.');
            }
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
            showNotification('danger', 'Update Failed', `An error occurred: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return <Flex justify="center" align="middle" style={{ minHeight: '100vh', padding: '20px' }}><Spin size="large" /></Flex>;
    }

    return (
        // ✅ FIX: ใช้โครงสร้างเดียวกับ AccountConfiguration
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            
            {/* ✅ FIX: Wrap Header และ Content ด้วย Flex vertical gap="large" ตัวเดียวกัน */}
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
                        
                        {/* Status: ไม่มี background */}
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
                {/* จะถูกดันลงมาด้วย gap="large" จาก Flex ด้านบน (ประมาณ 24px) */}
                <Card className="shadow-lg rounded-xl border-l-4 border-blue-500">
                    <Flex vertical gap="large" className="w-full">
                        {/* Selected Mode Display */}
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

                        {/* Mode Selection Grid */}
                        <Flex justify="space-between" gap="large" wrap="wrap">
                            {modes.map(mode => (
                                <div
                                    key={mode.name}
                                    className={classNames(
                                        "flex-1 basis-[calc(25%-1rem)] min-w-[150px] text-center p-4 cursor-pointer transition-all duration-300 rounded-xl",
                                        "hover:scale-[1.02] hover:shadow-xl",
                                        selectedMode === mode.name ? 
                                            'border-4 border-blue-500 bg-blue-50 shadow-lg' : 
                                            'border border-gray-200 bg-white shadow-sm'
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
                
                {/* --- 2. TRAFFIC LIGHT TIME MANAGEMENT CARD (CONDITIONAL) --- */}
                {selectedMode === 'Auto' && (
                    <Card 
                        title={<Title level={4} className='!my-0 !font-bold text-green-600 flex items-center'><SettingOutlined className='mr-2' /> Set Intersection Times (Auto Mode)</Title>} 
                        className="shadow-lg rounded-xl border-l-4 border-green-500"
                    >
                        <Flex vertical gap="large" className="w-full">
                            <Alert
                                message="Independent Green / Sequential Red Calculation"
                                description="คุณสามารถกำหนด **Green Duration** ได้อย่างอิสระสำหรับ **ทุกสี่แยก** แต่ระบบจะคำนวณ **Red Duration** ของสี่แยกถัดไปโดยอัตโนมัติจากผลรวมของ (Red + Green + Yellow) ของสี่แยกก่อนหน้า"
                                type="info"
                                showIcon
                                className="mb-4"
                            />
                            {intersectionTimes.map((intersection, index) => (
                                <Card
                                    key={intersection.Intersection_ID}
                                    title={<Title level={4} className="!my-0 text-blue-800 font-extrabold flex items-center">
                                        {intersection.Name} 
                                        {index === 0 ? <Tag color="blue" className='ml-3 text-sm font-bold'>BASE</Tag> : <Tag color="volcano" className='ml-3 text-sm font-bold'>CHAINED</Tag>}
                                    </Title>}
                                    className={classNames(
                                        "w-full border-2 border-gray-100 shadow-md transition-shadow hover:shadow-lg",
                                        index === 0 ? 'bg-blue-50/50' : 'bg-white' 
                                    )}
                                >
                                    <Flex align="middle" justify="space-between" wrap="wrap" gap="large">
                                        {/* Red Input */}
                                        <Flex vertical gap="small" className="flex-1 min-w-[150px] p-2 rounded-lg bg-red-50">
                                            <Flex align="center" justify="space-between" gap="small">
                                                <span className="font-bold text-red-600 text-lg">Red Duration (s)</span>
                                                <span className="text-xs text-gray-500">Duration</span>
                                            </Flex>
                                            <Input
                                                type="number"
                                                value={intersection.New_Red_Duration.toString()}
                                                onChange={e => handleTimeChange(index, 'red', e.target.value)}
                                                placeholder="Enter new red time"
                                                className="rounded-lg h-12 text-lg"
                                                disabled={index !== 0} 
                                            />
                                        </Flex>
                                        {/* Green Input */}
                                        <Flex vertical gap="small" className="flex-1 min-w-[150px] p-2 rounded-lg bg-green-50">
                                            <Flex align="center" justify="space-between" gap="small">
                                                <span className="font-bold text-green-600 text-lg">Green Duration (s)</span>
                                                <span className="text-xs text-gray-500">Duration</span>
                                            </Flex>
                                            <Input
                                                type="number"
                                                value={intersection.New_Green_Duration.toString()}
                                                onChange={e => handleTimeChange(index, 'green', e.target.value)}
                                                placeholder="Enter new green time"
                                                className="rounded-lg h-12 text-lg"
                                            />
                                        </Flex>
                                    </Flex>
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <Text type="secondary" className="text-sm">
                                            * **Yellow Light Duration**: {YELLOW_LIGHT_DURATION} วินาที (คงที่).
                                        </Text>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 font-medium">
                                        <span className="text-blue-600 font-bold">Current Red:</span> {intersection.New_Red_Duration.toLocaleString()} วินาที | 
                                        <span className="text-green-600 font-bold ml-4">Current Green:</span> {intersection.New_Green_Duration.toLocaleString()} วินาที
                                    </div>
                                    {(index > 0 && intersectionTimes.length >= 4) && (
                                        <div className="mt-2 text-sm text-gray-600 font-medium p-2 bg-gray-100 rounded">
                                            <span className="font-bold text-red-800">Note:</span> Red Duration for {intersection.Name} ถูกคำนวณจาก {intersectionTimes[index-1].Name} (Red: {intersectionTimes[index-1].New_Red_Duration} + Green: {intersectionTimes[index-1].New_Green_Duration} + Yellow: {YELLOW_LIGHT_DURATION})
                                        </div>
                                    )}
                                </Card>
                            ))}
                            <Flex justify="flex-end" className="mt-4">
                                <Button 
                                    type="primary" 
                                    onClick={handleSave} 
                                    className="font-bold py-3 h-auto px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-green-500 hover:!bg-green-600"
                                >
                                    <Flex align="center" gap="small">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Changes and Update Times
                                    </Flex>
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                )}

            </Flex>
        </div>
    );
};

export default TrafficManagement;