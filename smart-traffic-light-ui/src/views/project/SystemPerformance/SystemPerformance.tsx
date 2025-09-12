import React, { useState } from 'react';
import { Card, Flex, Typography, DatePicker, Statistic, Divider, Table } from 'antd';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ข้อมูลจำลองสำหรับรายงานประสิทธิภาพแบบมืออาชีพ
const mockData = {
    summary: {
        totalVehicles: 35489,
        avgWaitTime: 95,
        aiModeEfficiency: 15, // AI mode is 15% more efficient
        trafficCongestionReduction: 22,
    },
    dailyComparison: [
        { date: '2025-09-01', aiVehicles: 5200, manualVehicles: 4800, aiWaitTime: 120, manualWaitTime: 150 },
        { date: '2025-02-06', aiVehicles: 6100, manualVehicles: 5500, aiWaitTime: 110, manualWaitTime: 145 },
        { date: '2025-09-03', aiVehicles: 5850, manualVehicles: 5400, aiWaitTime: 105, manualWaitTime: 135 },
        { date: '2025-09-04', aiVehicles: 6050, manualVehicles: 5750, aiWaitTime: 98, manualWaitTime: 125 },
        { date: '2025-09-05', aiVehicles: 6300, manualVehicles: 6000, aiWaitTime: 95, manualWaitTime: 120 },
    ],
    hourlyTraffic: [
        { hour: '08:00', AI: 1200, Manual: 1150 },
        { hour: '09:00', AI: 1800, Manual: 1600 },
        { hour: '10:00', AI: 1500, Manual: 1450 },
        { hour: '11:00', AI: 1100, Manual: 1200 },
        { hour: '12:00', AI: 1300, Manual: 1250 },
    ],
    modeDistribution: [
        { name: 'AI Mode', value: 70, color: '#4CAF50' },
        { name: 'Manual Mode', value: 30, color: '#FF9800' },
    ],
    detailedTable: [
        { key: '1', intersection: 'แยกรามอินทรา', mode: 'AI', vehicleCount: 5200, avgWaitTime: 120, efficiency: '15%' },
        { key: '2', intersection: 'แยกเกษตรนวมินทร์', mode: 'Manual', vehicleCount: 4500, avgWaitTime: 150, efficiency: 'N/A' },
        { key: '3', intersection: 'แยกพหลโยธิน', mode: 'AI', vehicleCount: 6100, avgWaitTime: 110, efficiency: '18%' },
    ],
};

const tableColumns = [
    { title: 'Intersection', dataIndex: 'intersection', key: 'intersection' },
    { title: 'Mode', dataIndex: 'mode', key: 'mode' },
    { title: 'Vehicle Count', dataIndex: 'vehicleCount', key: 'vehicleCount' },
    { title: 'Avg. Wait Time (s)', dataIndex: 'avgWaitTime', key: 'avgWaitTime' },
    { title: 'Efficiency vs Manual', dataIndex: 'efficiency', key: 'efficiency' },
];

const ProfessionalPerformanceReport: React.FC = () => {
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <Title level={2} className="mb-6">รายงานประสิทธิภาพระบบไฟแดงอัจฉริยะ</Title>
            <Flex justify="space-between" align="center" className="mb-6">
                <Text type="secondary">เลือกช่วงเวลาเพื่อดูข้อมูลเชิงลึก</Text>
                <RangePicker size="large" />
            </Flex>

            {/* สรุปตัวเลข KPI */}
            <Flex wrap="wrap" gap="large" className="mb-6">
                <Card className="flex-1 shadow-md rounded-lg p-4">
                    <Statistic title="จำนวนรถรวมที่ผ่าน" value={mockData.summary.totalVehicles} suffix="คัน" />
                </Card>
                <Card className="flex-1 shadow-md rounded-lg p-4">
                    <Statistic title="เวลาที่รถติดโดยเฉลี่ย" value={mockData.summary.avgWaitTime} suffix="วินาที" />
                </Card>
                <Card className="flex-1 shadow-md rounded-lg p-4">
                    <Statistic title="AI Mode Efficiency" value={mockData.summary.aiModeEfficiency} suffix="%" />
                    <Text type="secondary">ดีกว่าโหมด Manual</Text>
                </Card>
                <Card className="flex-1 shadow-md rounded-lg p-4">
                    <Statistic title="ความหนาแน่นที่ลดลง" value={mockData.summary.trafficCongestionReduction} suffix="%" />
                    <Text type="secondary">ในช่วงเวลาเร่งด่วน</Text>
                </Card>
            </Flex>
            <Divider />

            {/* กราฟเปรียบเทียบรายวัน */}
            <Card title="ประสิทธิภาพรายวัน: AI vs Manual" className="shadow-lg rounded-lg mb-6">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={mockData.dailyComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="aiVehicles" name="AI Mode (จำนวนรถ)" fill="#1890ff" />
                        <Bar dataKey="manualVehicles" name="Manual Mode (จำนวนรถ)" fill="#fadb14" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* กราฟเปรียบเทียบเวลาที่รอ */}
            <Card title="Average Wait Time Comparison" className="shadow-lg rounded-lg mb-6">
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={mockData.dailyComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="aiWaitTime" name="AI Mode (เวลาเฉลี่ย)" stroke="#52c41a" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="manualWaitTime" name="Manual Mode (เวลาเฉลี่ย)" stroke="#fa8c16" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* กราฟปริมาณรถรายชั่วโมงและสัดส่วนโหมดการทำงาน */}
            <Flex wrap="wrap" gap="large" className="mb-6">
                <Card title="Traffic Volume by Hour" className="flex-1 shadow-lg rounded-lg min-w-[500px]">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={mockData.hourlyTraffic}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="AI" name="โหมด AI" stroke="#8884d8" fill="#8884d8" />
                            <Area type="monotone" dataKey="Manual" name="โหมด Manual" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Mode Usage Distribution" className="flex-1 shadow-lg rounded-lg">
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={mockData.modeDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                            >
                                {mockData.modeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Flex>

            <Divider />

            {/* ตารางข้อมูลอย่างละเอียด */}
            <Card title="Detailed Performance Data" className="shadow-lg rounded-lg">
                <Table dataSource={mockData.detailedTable} columns={tableColumns} pagination={false} />
            </Card>
        </div>
    );
};

export default ProfessionalPerformanceReport;