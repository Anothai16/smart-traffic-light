import React, { useState } from 'react';
import { Card, Flex, Typography, DatePicker, Table, Tag, Button, message } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { SyncOutlined } from '@ant-design/icons';

// Extend dayjs with the plugin
dayjs.extend(isSameOrBefore);

// ข้อมูลจำลองสำหรับแสดงผล
const mockTrafficData = [
    {
        Date: '2025-02-06',
        Lane: 'Lane 1',
        Vehicle_Count: 48,
        Red_Count: 32,
        Yellow_Count: 50,
        Green_Count: 48,
    },
    {
        Date: '2025-02-06',
        Lane: 'Lane 2',
        Vehicle_Count: 88,
        Red_Count: 48,
        Yellow_Count: 86,
        Green_Count: 52,
    },
    {
        Date: '2025-02-06',
        Lane: 'Lane 3',
        Vehicle_Count: 84,
        Red_Count: 82,
        Yellow_Count: 52,
        Green_Count: 52,
    },
    {
        Date: '2025-02-06',
        Lane: 'Lane 4',
        Vehicle_Count: 52,
        Red_Count: 48,
        Yellow_Count: 86,
        Green_Count: 52,
    },
    {
        Date: '2025-02-07',
        Lane: 'Lane 1',
        Vehicle_Count: 60,
        Red_Count: 40,
        Yellow_Count: 60,
        Green_Count: 55,
    },
    {
        Date: '2025-02-07',
        Lane: 'Lane 2',
        Vehicle_Count: 95,
        Red_Count: 55,
        Yellow_Count: 90,
        Green_Count: 60,
    },
    {
        Date: '2025-02-07',
        Lane: 'Lane 3',
        Vehicle_Count: 78,
        Red_Count: 75,
        Yellow_Count: 50,
        Green_Count: 48,
    },
    {
        Date: '2025-02-07',
        Lane: 'Lane 4',
        Vehicle_Count: 55,
        Red_Count: 50,
        Yellow_Count: 88,
        Green_Count: 55,
    },
    {
        Date: '2025-02-08',
        Lane: 'Lane 1',
        Vehicle_Count: 72,
        Red_Count: 50,
        Yellow_Count: 70,
        Green_Count: 65,
    },
    {
        Date: '2025-02-08',
        Lane: 'Lane 2',
        Vehicle_Count: 88,
        Red_Count: 62,
        Yellow_Count: 85,
        Green_Count: 70,
    },
    {
        Date: '2025-02-08',
        Lane: 'Lane 3',
        Vehicle_Count: 65,
        Red_Count: 60,
        Yellow_Count: 45,
        Green_Count: 55,
    },
    {
        Date: '2025-02-08',
        Lane: 'Lane 4',
        Vehicle_Count: 68,
        Red_Count: 65,
        Yellow_Count: 78,
        Green_Count: 68,
    },
];

interface TrafficData {
    Date: string;
    Lane: string;
    Vehicle_Count: number;
    Red_Count: number;
    Yellow_Count: number;
    Green_Count: number;
}

const { Title } = Typography;

const ProjectDashboard = () => {
    const availableDates = Array.from(new Set(mockTrafficData.map(data => data.Date)));
    const [selectedDate, setSelectedDate] = useState(dayjs(availableDates[0]));
    const [loading, setLoading] = useState(false);
    
    // ✅ เพิ่ม hook สำหรับ message
    const [messageApi, contextHolder] = message.useMessage();

    const currentDayData = mockTrafficData.filter(data => data.Date === selectedDate.format('YYYY-MM-DD'));

    const vehicleChartData = currentDayData.map(data => ({
        name: data.Lane,
        'Vehicle Count': data.Vehicle_Count,
    }));
    const trafficLightChartData = currentDayData.map(data => ({
        name: data.Lane,
        Red: data.Red_Count,
        Yellow: data.Yellow_Count,
        Green: data.Green_Count,
    }));

    const totalRedCount = currentDayData.reduce((sum, data) => sum + data.Red_Count, 0);
    const totalYellowCount = currentDayData.reduce((sum, data) => sum + data.Yellow_Count, 0);
    const totalGreenCount = currentDayData.reduce((sum, data) => sum + data.Green_Count, 0);
    const totalVehicleCount = currentDayData.reduce((sum, data) => sum + data.Vehicle_Count, 0);

    const pieChartData = [
        { name: 'Red', value: totalRedCount },
        { name: 'Yellow', value: totalYellowCount },
        { name: 'Green', value: totalGreenCount },
    ];
    const PIE_COLORS = ['#EF4444', '#FBBF24', '#10B981'];

    const vehicleTableColumns: TableProps<TrafficData>['columns'] = [
        { title: 'Lane', dataIndex: 'Lane', key: 'Lane' },
        { title: 'Vehicle Count', dataIndex: 'Vehicle_Count', key: 'Vehicle_Count' },
    ];

    const trafficTableColumns: TableProps<TrafficData>['columns'] = [
        { title: 'Lane', dataIndex: 'Lane', key: 'Lane' },
        {
            title: 'Red',
            dataIndex: 'Red_Count',
            key: 'Red',
            render: (text) => <Tag color="error">{text}</Tag>,
        },
        {
            title: 'Yellow',
            dataIndex: 'Yellow_Count',
            key: 'Yellow',
            render: (text) => <Tag color="warning">{text}</Tag>,
        },
        {
            title: 'Green',
            dataIndex: 'Green_Count',
            key: 'Green',
            render: (text) => <Tag color="success">{text}</Tag>,
        },
    ];

    const handleRefresh = () => {
        setLoading(true);
        // Simulate an API call with a delay
        setTimeout(() => {
            // In a real app, you would fetch new data here
            setLoading(false);
            // ✅ แสดงข้อความสำเร็จหลังจากโหลดเสร็จ
            messageApi.success('Data refreshed successfully!');
        }, 1500);
    };

    return (
        <>
            {/* ✅ เพิ่ม contextHolder ที่นี่ */}
            {contextHolder}
            <Flex vertical gap="large" className="p-6">
                {/* Header Section */}
                <Flex justify="space-between" align="center" className="mb-6">
                    <Title level={3} className="text-gray-800">
                        Traffic Dashboard
                    </Title>
                    <Flex align="center" gap="small">
                        <DatePicker
                            value={selectedDate}
                            onChange={date => setSelectedDate(date)}
                            format="YYYY-MM-DD"
                            allowClear={false}
                            disabledDate={current => !availableDates.includes(current.format('YYYY-MM-DD'))}
                            className="shadow-md"
                        />
                        <Button onClick={handleRefresh} icon={<SyncOutlined />} loading={loading}>
                            Refresh
                        </Button>
                    </Flex>
                </Flex>

                {/* Overview Card */}
                <Card className="shadow-lg rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <Flex justify="space-between" align="center">
                        <Title level={4} className="text-white m-0">
                            Total Vehicles for {selectedDate.format('DD MMMM YYYY')}
                        </Title>
                        <Title level={2} className="text-white m-0">
                            {totalVehicleCount}
                        </Title>
                    </Flex>
                </Card>

                {/* Charts Section */}
                <Flex wrap="wrap" gap="large" justify="center">
                    {/* Vehicle Count Area Chart */}
                    <Card
                        title="Daily Vehicle Trend"
                        className="shadow-lg rounded-lg"
                        style={{ flex: 1, minWidth: 400 }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={mockTrafficData.filter(d => dayjs(d.Date).isSameOrBefore(selectedDate, 'day'))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="Date" tickFormatter={(dateStr) => dayjs(dateStr).format('DD/MM')} />
                                <YAxis />
                                <Tooltip />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Area type="monotone" dataKey="Vehicle_Count" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Pie Chart */}
                    <Card
                        title="Traffic Light Proportions"
                        className="shadow-lg rounded-lg"
                        style={{ flex: 1, minWidth: 400 }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Vehicle Bar Chart */}
                    <Card
                        title="Vehicle Count by Lane"
                        className="shadow-lg rounded-lg"
                        style={{ flex: 1, minWidth: 400 }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={vehicleChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="Vehicle Count" fill="#3B82F6" activeBar={{ stroke: '#1D4ED8', strokeWidth: 2 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Traffic Light Change Chart */}
                    <Card
                        title="Traffic Light Change Count"
                        className="shadow-lg rounded-lg"
                        style={{ flex: 1, minWidth: 400 }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={trafficLightChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="Red" fill="#EF4444" activeBar={{ stroke: '#B91C1C', strokeWidth: 2 }} />
                                <Bar dataKey="Yellow" fill="#FBBF24" activeBar={{ stroke: '#D97706', strokeWidth: 2 }} />
                                <Bar dataKey="Green" fill="#10B981" activeBar={{ stroke: '#047857', strokeWidth: 2 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Flex>

                {/* Tables Section */}
                <Flex wrap="wrap" gap="large" justify="center">
                    {/* Vehicle Count Table */}
                    <Card
                        title="Vehicle Count Per Lane"
                        className="shadow-lg rounded-lg"
                        style={{ flex: 1, minWidth: 400 }}
                    >
                        <Table
                            columns={vehicleTableColumns}
                            dataSource={currentDayData}
                            pagination={false}
                            rowKey="Lane"
                            loading={loading}
                        />
                    </Card>

                    {/* Traffic Light Change Table */}
                    <Card
                        title="Traffic Light Change Count"
                        className="shadow-lg rounded-lg"
                        style={{ flex: 1, minWidth: 400 }}
                    >
                        <Table
                            columns={trafficTableColumns}
                            dataSource={currentDayData}
                            pagination={false}
                            rowKey="Lane"
                            loading={loading}
                        />
                    </Card>
                </Flex>
            </Flex>
        </>
    );
};

export default ProjectDashboard;