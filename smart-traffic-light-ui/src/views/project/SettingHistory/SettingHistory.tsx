import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tabs, Typography, Flex, Tag, message, Spin, Button, Pagination } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import { apiGetSettingModeHistory, apiGetModeHistory } from '@/services/SettingHistoryService';
import type { AxiosError } from 'axios';
import { SyncOutlined } from '@ant-design/icons';
import classNames from 'classnames';

const { Title } = Typography;
const { TabPane } = Tabs;

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
    
    // State สำหรับ Pagination ของแต่ละตาราง
    const [settingModePagination, setSettingModePagination] = useState({ current: 1, pageSize: 10 });
    const [modeLogPagination, setModeLogPagination] = useState({ current: 1, pageSize: 10 });


    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [settingModeResponse, modeResponse] = await Promise.all([
                apiGetSettingModeHistory(),
                apiGetModeHistory(),
            ]);

            const settingHistory: SettingModeLog[] = settingModeResponse.data.history;
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

            const modeHistoryData: ModeLog[] = modeResponse.data.history;
            setModeHistory(modeHistoryData);
            
            const latestLog = modeHistoryData.reduce((latest, current) => {
                return (latest === null || dayjs(current.Create_Date).isAfter(dayjs(latest.Create_Date))) ? current : latest;
            }, null as ModeLog | null);
            setLatestModeConfig(latestLog);

            setLastUpdated(dayjs().format('DD/MM/YYYY, HH:mm:ss'));
        } catch (error) {
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

    // Handlers สำหรับ Pagination ของแต่ละตาราง
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
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Change Time',
            dataIndex: 'Time',
            key: 'Time',
            render: (time) => {
                const parts = time.split('T');
                return parts.length > 1 ? parts[1].split('.')[0] : 'Invalid Time';
            },
        },
        {
            title: 'Old Duration (R-Y-G)',
            key: 'oldDuration',
            render: (_, record) => (
                <Flex gap="small">
                    <Tag color="red">R: {record.Old_Red_Duration || '-'}</Tag>
                    <Tag color="yellow">Y: {record.Old_Yellow_Duration || '-'}</Tag>
                    <Tag color="green">G: {record.Old_Green_Duration || '-'}</Tag>
                </Flex>
            ),
        },
        {
            title: 'New Duration (R-Y-G)',
            key: 'newDuration',
            render: (_, record) => (
                <Flex gap="small">
                    <Tag color="red">R: {record.New_Red_Duration || '-'}</Tag>
                    <Tag color="yellow">Y: {record.New_Yellow_Duration || '-'}</Tag>
                    <Tag color="green">G: {record.New_Green_Duration || '-'}</Tag>
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
                let color;
                switch (modeName) {
                    case 'Auto':
                        color = 'green';
                        break;
                    case 'Intelligence':
                        color = 'blue';
                        break;
                    case 'Caution':
                        color = 'yellow';
                        break;
                    case 'Stop':
                        color = 'red';
                        break;
                    default:
                        color = 'geekblue';
                }
                return <Tag color={color}>{modeName || 'Unknown'}</Tag>;
            },
        },
        {
            title: 'Change Date',
            dataIndex: 'Date',
            key: 'Date',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Change Time',
            dataIndex: 'Time',
            key: 'Time',
            render: (time) => {
                const parts = time.split('T');
                return parts.length > 1 ? parts[1].split('.')[0] : 'Invalid Time';
            },
        },
    ];

    const getModeColorForTag = (modeName: string | undefined): string => {
    switch (modeName) {
        case 'Auto': return 'green';
        case 'Intelligence': return 'blue';
        case 'Caution': return 'yellow';
        case 'Stop': return 'red';
        default: return 'geekblue';
    }
};

    const getModeColor = (modeName: string | undefined): string => {
        switch (modeName) {
            case 'Auto':
                return 'bg-green-500';
            case 'Intelligence':
                return 'bg-blue-500';
            case 'Caution':
                return 'bg-yellow-500';
            case 'Stop':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

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
                        <Flex justify="center" align="middle" style={{ minHeight: '150px' }}>
                            <Spin tip="Loading..." />
                        </Flex>
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
                                            Date: {dayjs(config.Date).format('DD/MM/YYYY')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Time: {config.Time.split('T')[1].split('.')[0]}
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
            <Flex justify="center" align="middle" style={{ height: '100%' }}>
                <Spin tip="Loading..." />
            </Flex>
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
                        Date: {dayjs(latestModeConfig.Create_Date).format('DD/MM/YYYY')}
                    </p>
                    <p className="text-xs text-gray-500">
                        Time: {latestModeConfig.Time.split('T')[1].split('.')[0]}
                    </p>
                </div>
            </Flex>
        ) : (
            <p className="text-center text-gray-500">No mode configuration history available.</p>
        )}
    </Card>
                <Card className="shadow-lg rounded-lg">
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Auto Mode Configuration History" key="1">
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
                        </TabPane>
                        <TabPane tab="Configuration Mode History" key="2">
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
                        </TabPane>
                    </Tabs>
                </Card>
            </Flex>
        </>
    );
};

export default SettingHistory;