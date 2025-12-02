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
    Admin_Name: string;
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
    Admin_Name: string;
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

    // ✅ ฟังก์ชันช่วยแปลงเวลาอย่างปลอดภัย (แก้ปัญหาจอขาว)
    const formatTime = (timeStr: string | undefined | null) => {
        if (!timeStr) return '-';
        // ถ้ามี 'T' (ISO Format) ให้ตัดเอาข้างหลัง
        if (timeStr.includes('T')) {
            const parts = timeStr.split('T');
            return parts.length > 1 ? parts[1].split('.')[0] : timeStr;
        }
        // ถ้าไม่มี 'T' (HH:mm:ss) ให้ตัดจุดทศนิยมออกถ้ามี
        return timeStr.split('.')[0];
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
            render: (modeName) => <Tag color="green">{modeName || 'Unknown'}</Tag>,
        },
        {
            title: 'Admin Name',
            dataIndex: 'Admin_Name',
            key: 'Admin_Name',
        },
        {
            title: 'Intersection Name',
            dataIndex: 'Intersection_Name',
            key: 'Intersection_Name',
            render: (name, record) => name || `ID: ${record.Intersection_ID}`,
        },
        {
            title: 'Change Date',
            dataIndex: 'Date',
            key: 'Date',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Change Time',
            dataIndex: 'Time',
            key: 'Time',
            render: (time) => formatTime(time), // ✅ ใช้ Helper function
        },
        {
            title: 'Old Duration (R-Y-G)',
            key: 'oldDuration',
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
        },
        {
            title: 'Traffic Mode',
            dataIndex: 'Mode_Name',
            key: 'Mode_Name',
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
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Change Time',
            dataIndex: 'Time',
            key: 'Time',
            render: (time) => formatTime(time), // ✅ ใช้ Helper function
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

    // ✅ แก้ Warning: Tabs.TabPane -> items
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
                    scroll={{ x: 'max-content' }}
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
                    scroll={{ x: 'max-content' }}
                />
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex justify="space-between" align="center">
                    <Title level={4} style={{ margin: 0 }}>
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

                <Card title="Latest Auto Mode Configurations" className="shadow-lg rounded-lg">
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
                                        border: '1px solid #d9d9d9',
                                        backgroundColor: '#fafafa'
                                    }}
                                >
                                    <Flex vertical align="center" gap="small">
                                        <h5 className="font-bold text-lg mb-2">{config.Intersection_Name || `ID: ${config.Intersection_ID}`}</h5>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag color="red">Red</Tag>
                                            <span className="font-bold text-lg">{config.New_Red_Duration} s</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag color="green">Green</Tag>
                                            <span className="font-bold text-lg">{config.New_Green_Duration} s</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Last Updated by: {config.Admin_Name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Date: {config.Date ? dayjs(config.Date).format('DD/MM/YYYY') : '-'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Time: {formatTime(config.Time)} {/* ✅ ใช้ Helper */}
                                        </p>
                                    </Flex>
                                </Card>
                            ))}
                        </Flex>
                    )}
                </Card>

                <Card
                    title="Latest Mode Configurations"
                    className="shadow-lg rounded-lg"
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
                                    style={{ padding: '8px 16px', fontSize: '24px' }}
                                >
                                    {latestModeConfig.Mode_Name}
                                </Tag>
                            </Typography.Title>
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-700">
                                    Last Updated by: <span className="font-medium">{latestModeConfig.Admin_Name}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Date: {latestModeConfig.Create_Date ? dayjs(latestModeConfig.Create_Date).format('DD/MM/YYYY') : '-'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Time: {formatTime(latestModeConfig.Time)} {/* ✅ ใช้ Helper */}
                                </p>
                            </div>
                        </Flex>
                    ) : (
                        <p className="text-center text-gray-500">No mode configuration history available.</p>
                    )}
                </Card>

                <Card className="shadow-lg rounded-lg">
                    {/* ✅ ใช้ items prop แทน TabPane */}
                    <Tabs defaultActiveKey="1" items={tabItems} />
                </Card>
            </Flex>
        </>
    );
};

export default SettingHistory;