import React, { useState } from 'react';
import { Card, Flex, Button, Typography, DatePicker, Row, Col, Table } from 'antd';
import { FolderFilled, LeftOutlined } from '@ant-design/icons';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');
const { Title } = Typography;

// Mock Data from mockData.ts
const mockTrafficData = [
    { Date: '2025-02-06', Lane: 'Lane 1', Vehicle_Count: 48, Red_Count: 32, Yellow_Count: 50, Green_Count: 48 },
    { Date: '2025-02-06', Lane: 'Lane 2', Vehicle_Count: 88, Red_Count: 48, Yellow_Count: 86, Green_Count: 52 },
    { Date: '2025-02-06', Lane: 'Lane 3', Vehicle_Count: 84, Red_Count: 82, Yellow_Count: 52, Green_Count: 52 },
    { Date: '2025-02-06', Lane: 'Lane 4', Vehicle_Count: 52, Red_Count: 48, Yellow_Count: 86, Green_Count: 52 },
    { Date: '2025-02-07', Lane: 'Lane 1', Vehicle_Count: 60, Red_Count: 40, Yellow_Count: 60, Green_Count: 55 },
    { Date: '2025-02-07', Lane: 'Lane 2', Vehicle_Count: 95, Red_Count: 55, Yellow_Count: 90, Green_Count: 60 },
    { Date: '2025-02-07', Lane: 'Lane 3', Vehicle_Count: 85, Red_Count: 50, Yellow_Count: 88, Green_Count: 62 },
    { Date: '2025-02-07', Lane: 'Lane 4', Vehicle_Count: 70, Red_Count: 45, Yellow_Count: 75, Green_Count: 58 },
    { Date: '2025-02-08', Lane: 'Lane 1', Vehicle_Count: 55, Red_Count: 35, Yellow_Count: 55, Green_Count: 50 },
    { Date: '2025-02-08', Lane: 'Lane 2', Vehicle_Count: 90, Red_Count: 50, Yellow_Count: 88, Green_Count: 58 },
    { Date: '2025-02-08', Lane: 'Lane 3', Vehicle_Count: 78, Red_Count: 70, Yellow_Count: 48, Green_Count: 48 },
    { Date: '2025-02-08', Lane: 'Lane 4', Vehicle_Count: 65, Red_Count: 42, Yellow_Count: 70, Green_Count: 55 },
];

const TrafficLog = () => {
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedLane, setSelectedLane] = useState<string | null>(null);
    const [filteredDate, setFilteredDate] = useState<dayjs.Dayjs | null>(null);

    const uniqueDates = Array.from(new Set(mockTrafficData.map(item => item.Date))).sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());
    const lanes = ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4'];

    const handleDateClick = (dateString: string) => {
        setSelectedDate(dayjs(dateString));
        setSelectedLane(null);
    };

    const handleLaneClick = (laneName: string) => {
        setSelectedLane(laneName);
    };

    const handleBackClick = () => {
        if (selectedLane) {
            setSelectedLane(null);
        } else if (selectedDate) {
            setSelectedDate(null);
            setFilteredDate(null);
        }
    };

    const handleFilterChange = (date: dayjs.Dayjs | null) => {
        setFilteredDate(date);
    };

    const displayDates = filteredDate
        ? uniqueDates.filter(date => dayjs(date).isSame(filteredDate, 'day'))
        : uniqueDates;

    if (selectedDate && selectedLane) {
        const dataForSelectedLane = mockTrafficData.filter(
            item => dayjs(item.Date).isSame(selectedDate, 'day') && item.Lane === selectedLane
        );
        const dataForCharts = dataForSelectedLane[0];

        if (!dataForCharts) {
            return (
                <Flex vertical gap="large" style={{ padding: '24px' }}>
                    <Flex align="center" className="mb-6">
                        <Button onClick={handleBackClick} icon={<LeftOutlined />} className="mr-4" />
                        <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                            {`Traffic Log: ${selectedDate.format('DD MMMM YYYY')} - ${selectedLane}`}
                        </Title>
                    </Flex>
                    <Card className="shadow-lg rounded-lg text-center mt-4 p-8">
                        <Title level={5} className="text-gray-600">No data available for {selectedLane} on {selectedDate.format('DD MMMM YYYY')}.</Title>
                    </Card>
                </Flex>
            );
        }

        const trafficChangedChartData = [
            { name: selectedLane, Red: dataForCharts.Red_Count, Yellow: dataForCharts.Yellow_Count, Green: dataForCharts.Green_Count },
        ];

        const vehiclesChartData = [
            { name: selectedLane, 'Vehicle Count': dataForCharts.Vehicle_Count },
        ];

        const vehicleCountColumns = [
            { title: 'Lane', dataIndex: 'Lane', key: 'Lane' },
            { title: 'Vehicle (number)', dataIndex: 'Vehicle_Count', key: 'Vehicle_Count' },
        ];

        const trafficLightCountColumns = [
            { title: 'Lane', dataIndex: 'Lane', key: 'Lane' },
            { title: 'Red', dataIndex: 'Red_Count', key: 'Red_Count' },
            { title: 'Yellow', dataIndex: 'Yellow_Count', key: 'Yellow_Count' },
            { title: 'Green', dataIndex: 'Green_Count', key: 'Green_Count' },
        ];

        return (
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex align="center" className="mb-6">
                    <Button onClick={handleBackClick} icon={<LeftOutlined />} className="mr-4" />
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        {`Traffic Log: ${selectedDate.format('DD MMMM YYYY')} - ${selectedLane}`}
                    </Title>
                </Flex>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Card title={`Number of Traffic Changed in ${selectedLane}`} className="shadow-xl rounded-lg border border-gray-200">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trafficChangedChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Red" fill="#ef4444" />
                                    <Bar dataKey="Yellow" fill="#facc15" />
                                    <Bar dataKey="Green" fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title={`Number of Vehicles Passing Traffic Light in ${selectedLane}`} className="shadow-xl rounded-lg border border-gray-200">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={vehiclesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Vehicle Count" fill="#1e40af" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[24, 24]} className="mt-6">
                    <Col xs={24} md={12}>
                        <Card title="ตารางแสดงจำนวนรถผ่านแยกไฟจราจร" className="shadow-xl rounded-lg border border-gray-200">
                            <Table
                                columns={vehicleCountColumns}
                                dataSource={dataForSelectedLane}
                                pagination={false}
                                rowKey="Lane"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="ตารางจำนวนการเปลี่ยนสีสัญญาณไฟจราจร" className="shadow-xl rounded-lg border border-gray-200">
                            <Table
                                columns={trafficLightCountColumns}
                                dataSource={dataForSelectedLane}
                                pagination={false}
                                rowKey="Lane"
                            />
                        </Card>
                    </Col>
                </Row>
            </Flex>
        );
    } else if (selectedDate) {
        return (
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex align="center" className="mb-6">
                    <Button onClick={handleBackClick} icon={<LeftOutlined />} className="mr-4" />
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        {selectedDate.format('dddd, DD MMMM YYYY')}
                    </Title>
                </Flex>
                <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {lanes.map(lane => (
                            <Card
                                key={lane}
                                className="flex flex-col items-center justify-center p-6 text-center shadow-md rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                                onClick={() => handleLaneClick(lane)}
                            >
                                <FolderFilled style={{ fontSize: '48px', color: '#60a5fa' }} />
                                <div className="mt-4 font-bold text-lg text-gray-700">{lane}</div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </Flex>
        );
    } else {
        return (
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex justify="space-between" align="middle" className="mb-6 p-4">
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Traffic Log
                    </Title>
                    <DatePicker onChange={handleFilterChange} placeholder="Filter by date" className="shadow-sm" />
                </Flex>
                <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {displayDates.map(date => (
                            <Card
                                key={date}
                                className="flex flex-col items-center justify-center p-6 text-center shadow-md rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                                onClick={() => handleDateClick(date)}
                            >
                                <FolderFilled style={{ fontSize: '48px', color: '#facc15' }} />
                                <div className="mt-4 font-bold text-lg text-gray-700">{dayjs(date).format('YYYY.MM.DD')}</div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </Flex>
        );
    }
};

export default TrafficLog;