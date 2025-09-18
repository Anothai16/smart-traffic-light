// src/views/traffic/TrafficManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Flex, Button, Typography, Input, Divider, Spin } from 'antd';
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
import { socket } from '@/services/socket';
// ✅ Import useSelector จาก react-redux
import { useSelector } from 'react-redux';
import type { RootState } from '@/store'; // ต้อง import type ของ RootState ด้วย
import { SyncOutlined } from '@ant-design/icons';

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

interface ApiErrorResponse {
    message: string;
}

const TrafficManagement = () => {
    const [currentMode, setCurrentMode] = useState('');
    const [selectedMode, setSelectedMode] = useState('');
    const [modes, setModes] = useState<Mode[]>([]);
    const [intersectionTimes, setIntersectionTimes] = useState<IntersectionTimeData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // ✅ ดึง userName จาก Redux state
    const username = useSelector((state: RootState) => state.auth.user.firstName);

    const showNotification = (type: 'success' | 'warning' | 'danger' | 'info', title: string, message: string) => {
        toast.push(
            <Notification title={title} type={type}>
                {message}
            </Notification>
        );
    };

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
                
                // ✅ ส่ง userName ที่ได้จาก Redux state
                const socketData = { 
                    message: `Traffic mode was changed to ${selectedMode} by ${username || 'an admin'}.`, 
                    senderId: socket.id,
                };
                socket.emit('traffic_mode_change', socketData);
                console.log("Sent socket event:", socketData);
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

    const handleTimeChange = (index: number, color: 'red' | 'green', value: string) => {
        setIntersectionTimes(prev => {
            const newTimes = [...prev];
            const updatedTime = { ...newTimes[index] };
            if (color === 'red') {
                updatedTime.New_Red_Duration = parseInt(value, 10) || 0;
            } else {
                updatedTime.New_Green_Duration = parseInt(value, 10) || 0;
            }
            newTimes[index] = updatedTime;
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
                
                // ✅ ส่ง userName ที่ได้จาก Redux state
                const socketData = { 
                    message: `Intersection times were updated by ${username || 'an admin'}.`, 
                    senderId: socket.id,
                };
                socket.emit('traffic_time_change', socketData);
                console.log("Sent socket event:", socketData);
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
        <>
            <Flex justify="space-between" align="middle" style={{ padding: '24px', marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0 }}>
                    Traffic Light Management
                </Title>
                <Flex align="center" gap="small">
                    <span className="text-base font-semibold text-gray-700">Status:</span>
                    <div className="flex items-center gap-2">
                        <div
                            className={classNames(
                                'rounded-full w-4 h-4',
                                currentModeDetails?.color || 'bg-gray-400'
                            )}
                        />
                        <span className="font-bold text-lg">{currentMode || 'No mode selected'}</span>
                    </div>
                    <Button onClick={fetchTrafficData} icon={<SyncOutlined />} loading={loading}>
                            Refresh
                        </Button>
                </Flex>
            </Flex>
            <Flex vertical gap="large" style={{ padding: '0 24px 24px 24px' }}>
                <Card title="Traffic Mode" className="shadow-lg rounded-lg">
                    <Flex vertical gap="large" className="w-full">
                        <div className="mb-2">
                            <span className="mr-2 text-base font-semibold">Current Mode :</span>
                            <Input className="w-40 rounded-md" value={selectedMode} readOnly />
                        </div>
                        <Button
                            type="primary"
                            className="w-full mb-4 text-lg font-bold py-6 flex items-center justify-center rounded-lg"
                            onClick={handleUpdateMode}
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
                                    onClick={() => setSelectedMode(mode.name)}
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
                {selectedMode === 'Auto' && (
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
                                                    <span className="text-sm text-gray-500">Default: {intersection.New_Red_Duration} seconds</span>
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
                                                    <span className="text-sm text-gray-500">Default: {intersection.New_Green_Duration} seconds</span>
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