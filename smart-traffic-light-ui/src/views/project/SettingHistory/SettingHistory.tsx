import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tabs, Typography, Flex, Tag, message, Spin, Button } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import { apiGetSettingModeHistory, apiGetModeHistory } from '@/services/SettingHistoryService';
import type { AxiosError } from 'axios';
import { SyncOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TabPane } = Tabs;

interface SettingModeLog {
    Log_ID: number;
    Mode_ID: number;
    Admin_ID: number;
    Intersection_ID: number;
    Intersection_Name?: string; // แก้ไขให้เป็น optional
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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [settingModeResponse, modeResponse] = await Promise.all([
                apiGetSettingModeHistory(),
                apiGetModeHistory(),
            ]);
            setSettingModeHistory(settingModeResponse.data.history);
            setModeHistory(modeResponse.data.history);
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

    const settingModeColumns: TableProps<SettingModeLog>['columns'] = [
        {
            title: 'Mode',
            dataIndex: 'Mode_Name',
            key: 'Mode_Name',
            render: (modeName) => <Tag color="blue">{modeName || 'Unknown'}</Tag>,
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
            render: (modeName) => <Tag color="geekblue">{modeName || 'Unknown'}</Tag>,
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

    return (
        <>
            {contextHolder}
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex justify="space-between" align="center">
                    <Title level={4} style={{ margin: 0 }}>
                        Traffic History
                    </Title>
                    <Button onClick={handleRefresh} icon={<SyncOutlined />} loading={loading}>
                        Refresh
                    </Button>
                </Flex>
                <Card className="shadow-lg rounded-lg">
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Setting Mode History" key="1">
                            <Table
                                columns={settingModeColumns}
                                dataSource={settingModeHistory}
                                rowKey="Log_ID"
                                pagination={{ pageSize: 10 }}
                                scroll={{ x: 'max-content' }}
                            />
                        </TabPane>
                        <TabPane tab="Traffic Mode History" key="2">
                            <Table
                                columns={modeLogColumns}
                                dataSource={modeHistory}
                                rowKey="Log_ID"
                                pagination={{ pageSize: 10 }}
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