// src/views/setting-history/SettingHistory.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tabs, Typography, Flex, Tag, message, Spin, Button } from 'antd';
import type { TableProps, TabsProps } from 'antd';
import dayjs from 'dayjs';
import { apiGetSettingModeHistory, apiGetModeHistory } from '@/services/SettingHistoryService';
import type { AxiosError } from 'axios';
import { SyncOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface SettingModeLog {
    Log_ID: number;
    Mode_ID: number;
    Admin_ID: number;
    Intersection_ID: number;
    Intersection_Name?: string;
    Time: string;
    Date: string;
    Old_Red_Duration: number | null;
    Old_Yellow_Duration: number | null;
    Old_Green_Duration: number | null;
    New_Red_Duration: number | null;
    New_Yellow_Duration: number | null;
    New_Green_Duration: number | null;
    Create_Date: string;
    Update_Date: string;
    Admin_Name: string | null; // อนุญาตให้เป็น null
    Mode_Name: string;
}

interface ModeLog {
    Log_ID: number;
    Admin_ID: number;
    Mode_ID: number;
    Date: string;
    Time: string;
    Create_Date: string;
    Update_Date: string;
    Admin_Name: string | null; // อนุญาตให้เป็น null
    Mode_Name: string;
}

const SettingHistory: React.FC = () => {
    const [settingModeHistory, setSettingModeHistory] = useState<SettingModeLog[]>([]);
    const [modeHistory, setModeHistory] = useState<ModeLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [messageApi, contextHolder] = message.useMessage();
    const [latestAutoModeConfigs, setLatestAutoModeConfigs] = useState<SettingModeLog[]>([]);
    const [latestModeConfig, setLatestModeConfig] = useState<ModeLog | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    
    // Pagination states
    const [settingModePagination, setSettingModePagination] = useState({ current: 1, pageSize: 10 });
    const [modeLogPagination, setModeLogPagination] = useState({ current: 1, pageSize: 10 });

    // ✅ แก้ไข: ดึงเวลามาแสดงตรงๆ (เพราะ Backend แก้เป็นเวลาไทยแล้ว)
    const formatTime = (timeStr: string | undefined | null) => {
        if (!timeStr) return '-';
        
        // ตัดเอาเฉพาะส่วน HH:mm:ss กรณีที่มีเศษวินาทีหรือตัวอักษร T ปนมา
        const cleanTime = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr.split('.')[0];
        
        return cleanTime;
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [settingModeResponse, modeResponse] = await Promise.all([
                apiGetSettingModeHistory(),
                apiGetModeHistory(),
            ]);

            const settingHistory: SettingModeLog[] = settingModeResponse.data.history || [];
            setSettingModeHistory(settingHistory);

            const latestAutoModeMap = new Map<number, SettingModeLog>();
            settingHistory.forEach(log => {
                const intersectionId = log.Intersection_ID;
                if (intersectionId !== null && log.Mode_Name === 'Auto') {
                    const existingLog = latestAutoModeMap.get(intersectionId);
                    if (!existingLog || dayjs(log.Create_Date).isAfter(dayjs(existingLog.Create_Date))) {
                        latestAutoModeMap.set(intersectionId, log);
                    }
                }
            });
            setLatestAutoModeConfigs(Array.from(latestAutoModeMap.values()));

            const modeHistoryData: ModeLog[] = modeResponse.data.history || [];
            setModeHistory(modeHistoryData);
            
            const latestLog = modeHistoryData.reduce((latest, current) => {
                return (latest === null || dayjs(current.Create_Date).isAfter(dayjs(latest.Create_Date))) ? current : latest;
            }, null as ModeLog | null);
            setLatestModeConfig(latestLog);

            setLastUpdated(dayjs().format('DD/MM/YYYY, HH:mm:ss'));
        } catch (error) {
            console.error(error);
            const err = error as AxiosError;
            const errorMessage = (err.response?.data as { message: string })?.message || err.message || 'An unexpected error occurred';
            messageApi.error(`Failed to fetch history data. Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    const handleRefresh = useCallback(async () => {
        await fetchData();
        messageApi.success('Data refreshed successfully!');
    }, [fetchData, messageApi]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSettingModeTableChange = (page: number, pageSize: number) => {
        setSettingModePagination({ current: page, pageSize: pageSize });
    };

    const handleModeLogTableChange = (page: number, pageSize: number) => {
        setModeLogPagination({ current: page, pageSize: pageSize });
    };

    const settingModeColumns: TableProps<SettingModeLog>['columns'] = [
        {
            title: 'Mode',
            dataIndex: 'Mode_Name',
            key: 'Mode_Name',
            width: 100,
            render: (modeName) => <Tag color="green">{modeName || 'Unknown'}</Tag>,
        },
        {
            title: 'Admin Name',
            dataIndex: 'Admin_Name',
            key: 'Admin_Name',
            width: 150,
            // ✅ แก้ไข: แสดง Hardware หากเป็น Null
            render: (name) => name || <Tag color="orange">Hardware</Tag>,
        },
        {
            title: 'Intersection Name',
            dataIndex: 'Intersection_Name',
            key: 'Intersection_Name',
            width: 200,
            render: (name, record) => name || `ID: ${record.Intersection_ID}`,
        },
        {
            title: 'Change Date',
            dataIndex: 'Date',
            key: 'Date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Change Time',
            dataIndex: 'Time',
            key: 'Time',
            width: 120,
            render: (time) => formatTime(time),
        },
        {
            title: 'Old Duration (R-Y-G)',
            key: 'oldDuration',
            width: 250,
            render: (_, record) => (
                <Flex gap="small">
                    <Tag color="red">R: {record.Old_Red_Duration ?? '-'}</Tag>
                    <Tag color="gold">Y: {record.Old_Yellow_Duration ?? '-'}</Tag>
                    <Tag color="green">G: {record.Old_Green_Duration ?? '-'}</Tag>
                </Flex>
            ),
        },
        {
            title: 'New Duration (R-Y-G)',
            key: 'newDuration',
            width: 250,
            render: (_, record) => (
                <Flex gap="small">
                    <Tag color="red">R: {record.New_Red_Duration ?? '-'}</Tag>
                    <Tag color="gold">Y: {record.New_Yellow_Duration ?? '-'}</Tag>
                    <Tag color="green">G: {record.New_Green_Duration ?? '-'}</Tag>
                </Flex>
            ),
        },
    ];

    const modeLogColumns: TableProps<ModeLog>['columns'] = [
        {
            title: 'Admin Name',
            dataIndex: 'Admin_Name',
            key: 'Admin_Name',
            width: 200,
            // ✅ แก้ไข: แสดง Hardware หากเป็น Null
            render: (name) => name || <Tag color="orange">Hardware</Tag>,
        },
        {
            title: 'Traffic Mode',
            dataIndex: 'Mode_Name',
            key: 'Mode_Name',
            width: 150,
            render: (modeName) => {
                let color = 'geekblue';
                if (modeName === 'Auto') color = 'green';
                if (modeName === 'Intelligence') color = 'blue';
                if (modeName === 'Caution') color = 'gold';
                if (modeName === 'Stop') color = 'red';
                return <Tag color={color}>{modeName || 'Unknown'}</Tag>;
            },
        },
        {
            title: 'Change Date',
            dataIndex: 'Date',
            key: 'Date',
            width: 150,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Change Time',
            dataIndex: 'Time',
            key: 'Time',
            width: 150,
            render: (time) => formatTime(time),
        },
    ];

    const getModeColorForTag = (modeName: string | undefined): string => {
        switch (modeName) {
            case 'Auto': return 'green';
            case 'Intelligence': return 'blue';
            case 'Caution': return 'gold';
            case 'Stop': return 'red';
            default: return 'geekblue';
        }
    };

    const tabItems: TabsProps['items'] = [
        {
            key: '1',
            label: 'Auto Mode Configuration History',
            children: (
                <Table
                    columns={settingModeColumns}
                    dataSource={settingModeHistory}
                    rowKey="Log_ID"
                    pagination={{
                        ...settingModePagination,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: handleSettingModeTableChange,
                    }}
                    scroll={{ x: 1200 }}
                />
            ),
        },
        {
            key: '2',
            label: 'Configuration Mode History',
            children: (
                <Table
                    columns={modeLogColumns}
                    dataSource={modeHistory}
                    rowKey="Log_ID"
                    pagination={{
                        ...modeLogPagination,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: handleModeLogTableChange,
                    }}
                    scroll={{ x: 800 }}
                />
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            {contextHolder}
            <Flex vertical gap="large">
                <Flex justify="space-between" align="center" className="p-4 border-b border-gray-100">
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Traffic History
                    </Title>
                    <Flex align="center" gap="small">
                        {lastUpdated && (
                            <span className="text-sm text-gray-500">
                                Last Updated: {lastUpdated}
                            </span>
                        )}
                        <Button onClick={handleRefresh} icon={<SyncOutlined />} loading={loading}>
                            Refresh
                        </Button>
                    </Flex>
                </Flex>

                <Card title="Latest Auto Mode Configurations" className="shadow-lg rounded-lg border border-gray-200">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <Spin tip="Loading..." size="large" />
                        </div>
                    ) : (
                        <Flex gap="large" wrap="wrap" justify="space-around">
                            {latestAutoModeConfigs.map(config => (
                                <Card
                                    key={config.Intersection_ID}
                                    className="flex-1 min-w-[250px] text-center transition-transform duration-300 hover:scale-105 hover:shadow-xl rounded-lg"
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: '#fafafa'
                                    }}
                                >
                                    <Flex vertical align="center" gap="small">
                                        <h5 className="font-bold text-lg mb-2 text-gray-800">{config.Intersection_Name || `ID: ${config.Intersection_ID}`}</h5>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag color="red">Red</Tag>
                                            <span className="font-bold text-lg">{config.New_Red_Duration} s</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag color="green">Green</Tag>
                                            <span className="font-bold text-lg">{config.New_Green_Duration} s</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {/* ✅ แก้ไข: แสดง Hardware หากเป็น Null */}
                                            Last Updated by: {config.Admin_Name || "Hardware"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Date: {config.Date ? dayjs(config.Date).format('DD/MM/YYYY') : '-'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Time: {formatTime(config.Time)}
                                        </p>
                                    </Flex>
                                </Card>
                            ))}
                        </Flex>
                    )}
                </Card>

                <Card
                    title="Latest Mode Configurations"
                    className="shadow-lg rounded-lg border border-gray-200"
                    style={{ minHeight: '150px' }}
                >
                    {loading ? (
                         <div style={{ textAlign: 'center', padding: '50px' }}>
                            <Spin tip="Loading..." size="large" />
                        </div>
                    ) : latestModeConfig ? (
                        <Flex vertical align="center" justify="center" gap="small" className="py-4">
                            <Typography.Title level={2} style={{ margin: 0 }}>
                                <Tag
                                    color={getModeColorForTag(latestModeConfig.Mode_Name)}
                                    style={{ padding: '8px 24px', fontSize: '24px', borderRadius: '8px' }}
                                >
                                    {latestModeConfig.Mode_Name}
                                </Tag>
                            </Typography.Title>
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-700">
                                    {/* ✅ แก้ไข: แสดง Hardware หากเป็น Null */}
                                    Last Updated by: <span className="font-medium">{latestModeConfig.Admin_Name || "Hardware"}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Date: {latestModeConfig.Create_Date ? dayjs(latestModeConfig.Create_Date).format('DD/MM/YYYY') : '-'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Time: {formatTime(latestModeConfig.Time)}
                                </p>
                            </div>
                        </Flex>
                    ) : (
                        <p className="text-center text-gray-500">No mode configuration history available.</p>
                    )}
                </Card>

                <Card className="shadow-lg rounded-lg border border-gray-200">
                    <Tabs defaultActiveKey="1" items={tabItems} />
                </Card>
            </Flex>
        </div>
    );
};

export default SettingHistory;