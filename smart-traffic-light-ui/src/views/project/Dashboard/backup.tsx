import React, { useState } from 'react';
import { Card, Flex, Typography, DatePicker, Table, TableProps } from 'antd'; // Import TableProps to use ColumnsType
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockTrafficData } from './mockData';

// Define the type for your data
interface TrafficData {
    Date: string;
    Lane: string;
    Vehicle_Count: number;
    Red_Count: number;
    Yellow_Count: number;
    Green_Count: number;
}

// Use ColumnsType with your data type for better type-safety
const { Title } = Typography;

const ProjectDashboard = () => {
    // Get all available dates from mockData
    const availableDates = Array.from(new Set(mockTrafficData.map(data => data.Date)));

    // Set state for the selected date
    const [selectedDate, setSelectedDate] = useState(dayjs(availableDates[0]));

    // Filter data based on the selected date
    const currentDayData = mockTrafficData.filter(data => data.Date === selectedDate.format('YYYY-MM-DD'));

    // Prepare data for the charts
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

    // Explicitly define the columns with the correct type
    const vehicleTableColumns: TableProps<TrafficData>['columns'] = [
        {
            title: <span className="font-bold">Lane</span>,
            dataIndex: 'Lane',
            key: 'lane',
            align: 'left',
        },
        {
            title: <span className="font-bold">Vehicle Count</span>,
            dataIndex: 'Vehicle_Count',
            key: 'vehicleCount',
            align: 'center',
        },
    ];

    const trafficTableColumns: TableProps<TrafficData>['columns'] = [
        {
            title: <span className="font-bold">Lane</span>,
            dataIndex: 'Lane',
            key: 'lane',
            align: 'left',
        },
        {
            title: <span className="font-bold">Red</span>,
            dataIndex: 'Red_Count',
            key: 'redCount',
            align: 'center',
        },
        {
            title: <span className="font-bold">Yellow</span>,
            dataIndex: 'Yellow_Count',
            key: 'yellowCount',
            align: 'center',
        },
        {
            title: <span className="font-bold">Green</span>,
            dataIndex: 'Green_Count',
            key: 'greenCount',
            align: 'center',
        },
    ];

    return (
        <Flex vertical gap="large" style={{ padding: '24px' }}>
            <Flex justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 'bold' }}>
                    Traffic Dashboard
                </Title>
                <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    style={{ width: 250 }}
                />
            </Flex>

            {/* Charts Section */}
            <Flex wrap="wrap" gap="large" justify="center">
                {/* Traffic Light Change Chart */}
                <Card title="Number of Traffic Light Changes in 4 Lanes" style={{ flex: 1, minWidth: 400 }}>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={trafficLightChartData}
                            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="Green" fill="#22C55E" />
                            <Bar dataKey="Yellow" fill="#FACC15" />
                            <Bar dataKey="Red" fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Vehicle Count Chart */}
                <Card title="Number of Vehicles Passing Traffic Light" style={{ flex: 1, minWidth: 400 }}>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={vehicleChartData}
                            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="Vehicle Count" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </Flex>

            {/* Tables Section */}
            <Flex wrap="wrap" gap="large" justify="center">
                {/* Vehicle Count Table */}
                <Card title="Vehicle Count Per Lane" style={{ flex: 1, minWidth: 400 }}>
                    <Table
                        columns={vehicleTableColumns}
                        dataSource={currentDayData}
                        pagination={false}
                        rowKey="Lane"
                    />
                </Card>

                {/* Traffic Light Change Table */}
                <Card title="Traffic Light Change Count" style={{ flex: 1, minWidth: 400 }}>
                    <Table
                        columns={trafficTableColumns}
                        dataSource={currentDayData}
                        pagination={false}
                        rowKey="Lane"
                    />
                </Card>
            </Flex>
        </Flex>
    );
};

export default ProjectDashboard;