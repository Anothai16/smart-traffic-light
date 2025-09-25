// src/views/dashboard/ProjectDashboard.tsx (FINAL VERSION: KPI CARD UPDATE)

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, Flex, Typography, DatePicker, Table, Tag, Button, Spin, Alert } from 'antd';
import type { TableProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar
} from 'recharts';
import { 
    SyncOutlined, 
    CarOutlined, 
    AlertOutlined, 
    ArrowUpOutlined, // 🔴 NEW: For increase
    ArrowDownOutlined // 🔴 NEW: For decrease
} from '@ant-design/icons';
import classNames from 'classnames';

dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;

// ----------------------------------------------------
// 1. INTERFACES (Type Definitions)
// ----------------------------------------------------

// ... (Interfaces คงเดิม) ...
interface DailyTrafficData {
    Date: string; // YYYY-MM-DD
    Lane: string;
    Vehicle_Count: number;
    Red_Count: number;
    Yellow_Count: number;
    Green_Count: number;
}
// ... (HourlyTrafficData, PieChartData, LaneWeeklyData คงเดิม) ...
interface HourlyTrafficData {
    Hour: string;
    'Lane 1 (PC-A)': number;
    'Lane 2 (PC-B)': number;
    'Lane 3 (PC-C)': number;
    'Lane 4 (PC-D)': number;
}
interface PieChartData {
    name: string;
    value: number;
    percent: string;
}
interface LaneWeeklyData {
    DayName: string;
    'Lane 1 (PC-A)': number;
    'Lane 2 (PC-B)': number;
    'Lane 3 (PC-C)': number;
    'Lane 4 (PC-D)': number;
    Total_Count: number; 
}


// ----------------------------------------------------
// 2. MOCK DATA & CONFIG (Expanded)
// ----------------------------------------------------

const mockTrafficData: DailyTrafficData[] = [
    // 🔴 ข้อมูลวันที่เลือก (2025-09-24) - Total 19,600 (Lane 2 Busiest: 6,100)
    { Date: '2025-09-24', Lane: 'Lane 1 (PC-A)', Vehicle_Count: 4800, Red_Count: 320, Yellow_Count: 50, Green_Count: 480 },
    { Date: '2025-09-24', Lane: 'Lane 2 (PC-B)', Vehicle_Count: 6100, Red_Count: 400, Yellow_Count: 65, Green_Count: 550 },
    { Date: '2025-09-24', Lane: 'Lane 3 (PC-C)', Vehicle_Count: 3500, Red_Count: 250, Yellow_Count: 40, Green_Count: 300 },
    { Date: '2025-09-24', Lane: 'Lane 4 (PC-D)', Vehicle_Count: 5200, Red_Count: 350, Yellow_Count: 55, Green_Count: 420 },
    
    // 🔴 ข้อมูลวันก่อนหน้า (2025-09-23) - Total 16,000
    { Date: '2025-09-23', Lane: 'Lane 1 (PC-A)', Vehicle_Count: 4000, Red_Count: 300, Yellow_Count: 50, Green_Count: 400 },
    { Date: '2025-09-23', Lane: 'Lane 2 (PC-B)', Vehicle_Count: 5000, Red_Count: 350, Yellow_Count: 60, Green_Count: 450 },
    { Date: '2025-09-23', Lane: 'Lane 3 (PC-C)', Vehicle_Count: 3000, Red_Count: 200, Yellow_Count: 35, Green_Count: 280 },
    { Date: '2025-09-23', Lane: 'Lane 4 (PC-D)', Vehicle_Count: 4000, Red_Count: 250, Yellow_Count: 45, Green_Count: 350 },
];
// ... (mockHourlyData, mockLaneWeeklyData, PIE_COLORS, LANE_NAMES, LINE_BAR_COLORS คงเดิม) ...
const mockHourlyData: HourlyTrafficData[] = [
    { Hour: '08:00', 'Lane 1 (PC-A)': 120, 'Lane 2 (PC-B)': 150, 'Lane 3 (PC-C)': 90, 'Lane 4 (PC-D)': 130 },
    { Hour: '09:00', 'Lane 1 (PC-A)': 150, 'Lane 2 (PC-B)': 190, 'Lane 3 (PC-C)': 110, 'Lane 4 (PC-D)': 170 },
    { Hour: '10:00', 'Lane 1 (PC-A)': 180, 'Lane 2 (PC-B)': 220, 'Lane 3 (PC-C)': 130, 'Lane 4 (PC-D)': 200 },
    { Hour: '11:00', 'Lane 1 (PC-A)': 200, 'Lane 2 (PC-B)': 250, 'Lane 3 (PC-C)': 150, 'Lane 4 (PC-D)': 220 },
    { Hour: '12:00', 'Lane 1 (PC-A)': 250, 'Lane 2 (PC-B)': 300, 'Lane 3 (PC-C)': 180, 'Lane 4 (PC-D)': 280 },
    { Hour: '13:00', 'Lane 1 (PC-A)': 230, 'Lane 2 (PC-B)': 280, 'Lane 3 (PC-C)': 160, 'Lane 4 (PC-D)': 250 },
    { Hour: '14:00', 'Lane 1 (PC-A)': 190, 'Lane 2 (PC-B)': 230, 'Lane 3 (PC-C)': 140, 'Lane 4 (PC-D)': 200 },
];
const mockLaneWeeklyData: LaneWeeklyData[] = [
    { DayName: 'Sat', 'Lane 1 (PC-A)': 3000, 'Lane 2 (PC-B)': 3500, 'Lane 3 (PC-C)': 2500, 'Lane 4 (PC-D)': 3500, Total_Count: 12500 }, 
    { DayName: 'Sun', 'Lane 1 (PC-A)': 2500, 'Lane 2 (PC-B)': 3000, 'Lane 3 (PC-C)': 2000, 'Lane 4 (PC-D)': 3700, Total_Count: 11200 },
    { DayName: 'Mon', 'Lane 1 (PC-A)': 4000, 'Lane 2 (PC-B)': 4500, 'Lane 3 (PC-C)': 3800, 'Lane 4 (PC-D)': 4500, Total_Count: 16800 },
    { DayName: 'Tue', 'Lane 1 (PC-A)': 4800, 'Lane 2 (PC-B)': 6100, 'Lane 3 (PC-C)': 3500, 'Lane 4 (PC-D)': 5200, Total_Count: 19600 },
    { DayName: 'Wed', 'Lane 1 (PC-A)': 5500, 'Lane 2 (PC-B)': 6500, 'Lane 3 (PC-C)': 4400, 'Lane 4 (PC-D)': 6000, Total_Count: 22400 },
    { DayName: 'Thu', 'Lane 1 (PC-A)': 5000, 'Lane 2 (PC-B)': 6000, 'Lane 3 (PC-C)': 4200, 'Lane 4 (PC-D)': 5800, Total_Count: 21000 },
    { DayName: 'Fri', 'Lane 1 (PC-A)': 4500, 'Lane 2 (PC-B)': 5200, 'Lane 3 (PC-C)': 3800, 'Lane 4 (PC-D)': 5000, Total_Count: 18500 },
];
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const LANE_NAMES = ['Lane 1 (PC-A)', 'Lane 2 (PC-B)', 'Lane 3 (PC-C)', 'Lane 4 (PC-D)'];
const LINE_BAR_COLORS = {
    'Lane 1 (PC-A)': '#8884d8', 
    'Lane 2 (PC-B)': '#82ca9d', 
    'Lane 3 (PC-C)': '#ffc658', 
    'Lane 4 (PC-D)': '#ff7300', 
};


// ----------------------------------------------------
// 3. Table Configurations (คงเดิม)
// ----------------------------------------------------
// ... (vehicleTableColumns, trafficTableColumns, getLaneColumns, laneWeeklyColumns คงเดิม) ...
const vehicleTableColumns: TableProps<DailyTrafficData>['columns'] = [
    {
        title: 'Lane',
        dataIndex: 'Lane',
        key: 'Lane',
        render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
        title: <><CarOutlined /> Vehicle Count</>,
        dataIndex: 'Vehicle_Count',
        key: 'Vehicle_Count',
        sorter: (a, b) => a.Vehicle_Count - b.Vehicle_Count,
        render: (count) => <Text strong>{count.toLocaleString()}</Text>,
        align: 'right',
    },
    {
        title: 'Avg. Traffic',
        key: 'Avg. Traffic',
        render: (_, record) => (
            <Text type="secondary">{(record.Vehicle_Count / 8).toFixed(0)} / hr</Text>
        ),
        align: 'right',
    },
];

const trafficTableColumns: TableProps<DailyTrafficData>['columns'] = [
    {
        title: 'Lane',
        dataIndex: 'Lane',
        key: 'Lane',
        render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
        title: <><AlertOutlined /> Red Count</>,
        dataIndex: 'Red_Count',
        key: 'Red_Count',
        sorter: (a, b) => a.Red_Count - b.Red_Count,
        align: 'right',
    },
    {
        title: 'Yellow Count',
        dataIndex: 'Yellow_Count',
        key: 'Yellow_Count',
        align: 'right',
    },
    {
        title: 'Green Count',
        dataIndex: 'Green_Count',
        key: 'Green_Count',
        align: 'right',
    },
];


// ----------------------------------------------------
// 4. Main Component Logic (Updated)
// ----------------------------------------------------

const ProjectDashboard = () => {
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs('2025-09-24'));
    const [loading, setLoading] = useState(false);
    const [modeStatus] = useState<string>('Adaptive Mode (Active)'); 

    const currentDayData = useMemo(() => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        return mockTrafficData.filter(d => d.Date === dateStr);
    }, [selectedDate]);
    
    // Total vehicle count for KPI and Donut Center
    const totalVehicleCount = useMemo(() => {
        return currentDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);
    }, [currentDayData]);

    // 🔴 NEW LOGIC 1: หา Lane ที่มีปริมาณรถเยอะที่สุด
    const busiestLaneInfo = useMemo(() => {
        if (currentDayData.length === 0) return { lane: 'N/A', count: 0 };
        
        const busiest = currentDayData.reduce((maxLane, current) => 
            current.Vehicle_Count > maxLane.Vehicle_Count ? current : maxLane, 
            currentDayData[0] // ต้องมีค่าเริ่มต้น
        );
        return { 
            lane: busiest.Lane, 
            count: busiest.Vehicle_Count 
        };
    }, [currentDayData]);

    // 🔴 NEW LOGIC 2: คำนวณการเปลี่ยนแปลงรายวัน
    const dailyChangeInfo = useMemo(() => {
        const previousDate = selectedDate.subtract(1, 'day').format('YYYY-MM-DD');
        // ดึงข้อมูลวันก่อนหน้าจาก Mock Data
        const previousDayData = mockTrafficData.filter(d => d.Date === previousDate);
        
        const currentTotal = totalVehicleCount;
        const previousTotal = previousDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);

        if (previousTotal === 0 || currentTotal === 0) {
            return { change: 0, percent: 'N/A', total: previousTotal };
        }

        const difference = currentTotal - previousTotal;
        const percentage = ((difference / previousTotal) * 100).toFixed(1);
        
        return {
            change: difference,
            percent: percentage,
            total: previousTotal,
        };
    }, [selectedDate, totalVehicleCount]);

    // ... (Logic ส่วนอื่นๆ คงเดิม) ...
    const barChartData = currentDayData.map(item => ({
        name: item.Lane.split('(')[0].trim(), 
        'Vehicle Count': item.Vehicle_Count
    }));

    const pieData: PieChartData[] = useMemo(() => {
        const totalVehicle = currentDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);
        if (totalVehicle === 0) return [];
        
        return currentDayData.map(item => ({
            name: item.Lane,
            value: item.Vehicle_Count,
            percent: ((item.Vehicle_Count / totalVehicle) * 100).toFixed(1),
        }));
    }, [currentDayData]);

    const MAX_LANE_TRAFFIC = useMemo(() => {
        let max = 0;
        mockLaneWeeklyData.forEach(day => {
            LANE_NAMES.forEach(lane => {
                const count = day[lane as keyof LaneWeeklyData] as number;
                if (count > max) {
                    max = count;
                }
            });
        });
        return max;
    }, []);

    const MAX_DAILY_TOTAL = useMemo(() => {
        return Math.max(...mockLaneWeeklyData.map(d => d.Total_Count));
    }, []);


    const loadData = useCallback(async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800)); 
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData, selectedDate]);

    const getWeeklyRowClassName = useCallback((record: LaneWeeklyData, index: number): string => {
        const isWeekend = record.DayName === 'Sat' || record.DayName === 'Sun';
        if (isWeekend) {
            return 'bg-blue-50 hover:bg-blue-100'; 
        }
        return '';
    }, []);
    
    const getLaneColumns = (maxTraffic: number) => LANE_NAMES.map(lane => ({
        title: lane,
        dataIndex: lane,
        key: lane,
        align: 'right' as const,
        render: (count: number) => <Text>{count.toLocaleString()}</Text>,
        onCell: (record: LaneWeeklyData) => ({
            className: record[lane as keyof LaneWeeklyData] === maxTraffic ? 
                'bg-green-200 font-bold' : ''
        }),
    }));

    const laneWeeklyColumns: TableProps<LaneWeeklyData>['columns'] = [
        {
            title: 'Day',
            dataIndex: 'DayName',
            key: 'DayName',
            fixed: 'left' as const,
            render: (text) => {
                const isWeekend = text === 'Sat' || text === 'Sun';
                return <Tag color={isWeekend ? 'blue' : 'volcano'}>{text}</Tag>;
            },
        },
        ...getLaneColumns(MAX_LANE_TRAFFIC),
        {
            title: <Text strong><CarOutlined /> Total Count</Text>,
            dataIndex: 'Total_Count',
            key: 'Total_Count',
            align: 'right' as const,
            onCell: (record: LaneWeeklyData) => ({
                 className: record.Total_Count === MAX_DAILY_TOTAL ? 
                'bg-yellow-100 font-bold' : ''
            }),
            render: (count: number) => <Text strong>{count.toLocaleString()}</Text>,
        },
    ];


    // ----------------------------------------------------
    // 5. UI Rendering
    // ----------------------------------------------------

    const isToday = selectedDate.isSame(dayjs(), 'day');

    return (
        <Flex vertical gap="large" style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
            {/* Header: Title and Controls */}
            <Flex justify="space-between" align="middle">
                <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                    🚦 Smart Traffic Dashboard
                </Title>
                <Flex gap="middle" align="middle">
                    <DatePicker 
                        onChange={(date) => { if (date) setSelectedDate(date); }}
                        value={selectedDate}
                        placeholder="Select Date" 
                        allowClear={false}
                    />
                    <Button icon={<SyncOutlined />} onClick={loadData} loading={loading} type="primary">
                        Refresh Data
                    </Button>
                </Flex>
            </Flex>

            {/* ROW 1: KPI Cards */}
            <Flex wrap="wrap" gap="large" justify="space-around">
                
                {/* KPI Card 1: Total Vehicles (คงเดิม) */}
                <Card 
                    title={<Text type="secondary"><CarOutlined /> Total Vehicles</Text>}
                    className="shadow-xl rounded-lg border-l-4 border-l-blue-500 hover:shadow-2xl transition-shadow"
                    style={{ flex: 1, minWidth: 250 }}
                    loading={loading}
                >
                    <Title level={2} className="text-blue-600 my-0">
                        {totalVehicleCount.toLocaleString()}
                    </Title>
                    <Text type="secondary" className="text-sm">Traffic on {selectedDate.format('DD MMMM YYYY')}</Text>
                </Card>

                {/* 🔴 UPDATED KPI Card 2: Busiest Lane & Daily Change */}
                <Card 
                    title={<Text type="secondary"><AlertOutlined /> Busiest Lane & Daily Change</Text>} // 🔴 Updated Title
                    className="shadow-xl rounded-lg border-l-4 border-l-orange-500 hover:shadow-2xl transition-shadow" // 🔴 New Color
                    style={{ flex: 1, minWidth: 250 }}
                    loading={loading}
                >
                    <Flex vertical>
                        {/* 1. Busiest Lane Info */}
                        <Text type="secondary" className="text-sm">Busiest Lane: **{busiestLaneInfo.lane}**</Text>
                        <Title level={3} className="text-orange-600 my-0">
                            {busiestLaneInfo.count.toLocaleString()} Vehicles
                        </Title>
                        
                        {/* 2. Daily Change Info */}
                        <Flex align="center" gap={4}>
                            {dailyChangeInfo.total === 0 ? (
                                <Text type="secondary" className="text-sm">Not enough data to compare with Day Before</Text>
                            ) : dailyChangeInfo.change === 0 ? (
                                <Text type="secondary" className="text-sm">No change from previous day</Text>
                            ) : (
                                <>
                                    {dailyChangeInfo.change > 0 ? (
                                        <ArrowUpOutlined style={{ color: '#16a34a' }} /> // Green Up
                                    ) : (
                                        <ArrowDownOutlined style={{ color: '#dc2626' }} /> // Red Down
                                    )}
                                    <Text 
                                        strong 
                                        style={{ color: dailyChangeInfo.change > 0 ? '#16a34a' : '#dc2626' }}
                                    >
                                        {Math.abs(dailyChangeInfo.change).toLocaleString()} ({dailyChangeInfo.percent}%)
                                    </Text>
                                    <Text type="secondary" className="text-sm">vs. Day Before</Text>
                                </>
                            )}
                        </Flex>
                    </Flex>
                </Card>

                {/* KPI Card 3: System Status (คงเดิม) */}
                <Card 
                    title={<Text type="secondary">System Status</Text>}
                    className="shadow-xl rounded-lg border-l-4 border-l-green-500 hover:shadow-2xl transition-shadow"
                    style={{ flex: 1, minWidth: 250 }}
                    loading={loading}
                >
                    <Title level={2} className="text-green-600 my-0">
                        {isToday ? modeStatus : 'Historical View'}
                    </Title>
                    <Text type="secondary" className="text-sm">Current Traffic Mode</Text>
                </Card>
            </Flex>

            {/* ROW 2: BAR CHART (Daily Vehicle Comparison) (คงเดิม) */}
            <Card title={`Daily Vehicle Count Comparison (${selectedDate.format('DD MMMM YYYY')})`} className="shadow-xl rounded-lg p-3" loading={loading}>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Vehicle Count (Total)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                            formatter={(value: number, name: string) => [value.toLocaleString(), 'Total Vehicles']}
                        />
                        <Legend />
                        <Bar dataKey="Vehicle Count" fill={LINE_BAR_COLORS['Lane 1 (PC-A)']} /> 
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* ROW 3: LINE CHART (Hourly Trend) (คงเดิม) */}
            <Card title="Hourly Vehicle Trend (All Lanes)" className="shadow-xl rounded-lg p-3" loading={loading}>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={mockHourlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="Hour" />
                        <YAxis label={{ value: 'Vehicle Count', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                            formatter={(value: number, name: string) => [`${value.toLocaleString()} vehicles`, name]}
                        />
                        <Legend />
                        
                        {Object.keys(LINE_BAR_COLORS).map((lane) => (
                            <Line 
                                key={lane}
                                type="monotone" 
                                dataKey={lane} 
                                stroke={LINE_BAR_COLORS[lane as keyof typeof LINE_BAR_COLORS]}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* ROW 4: Donut Chart (Distribution) and Tables (Daily Summary) (คงเดิม) */}
            <Flex wrap="wrap" gap="large" justify="center" align="flex-start">
                
                {/* 1. Donut Chart Card */}
                <Card
                    title="Vehicle Distribution by Lane"
                    className="shadow-xl rounded-lg"
                    style={{ width: 400, minWidth: 350, height: 450 }}
                    loading={loading}
                >
                    <div style={{ position: 'relative', width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70} 
                                    outerRadius={120} 
                                    paddingAngle={3}
                                    fill="#8884d8"
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number, name: string, props) => [`${value.toLocaleString()} vehicles (${(props.payload as PieChartData).percent}%)`, name]} 
                                />
                                <Legend layout="vertical" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                        <Flex 
                            vertical 
                            align="center" 
                            justify="center" 
                            style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)', 
                                pointerEvents: 'none', 
                                maxWidth: '100px'
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: 12, marginBottom: -4 }}>Total</Text>
                            <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                                {totalVehicleCount.toLocaleString()}
                            </Title>
                        </Flex>
                    </div>
                </Card>

                {/* 2. Tables (Summary Data) */}
                <Flex vertical gap="large" style={{ flex: 1, minWidth: 400 }}>
                    <Card
                        title="Vehicle Count Per Lane (Daily Summary)"
                        className="shadow-lg rounded-lg"
                        bodyStyle={{ padding: 0 }}
                        loading={loading}
                    >
                        <Table
                            columns={vehicleTableColumns}
                            dataSource={currentDayData}
                            pagination={false}
                            rowKey="Lane"
                            size="middle"
                        />
                    </Card>

                    <Card
                        title="Traffic Light Change Count (Daily Summary)"
                        className="shadow-lg rounded-lg"
                        bodyStyle={{ padding: 0 }}
                        loading={loading}
                    >
                        <Table
                            columns={trafficTableColumns}
                            dataSource={currentDayData}
                            pagination={false}
                            rowKey="Lane"
                            size="middle"
                        />
                    </Card>
                </Flex>
            </Flex>
            
            {/* ROW 5: Weekly Lane Comparison Table (คงเดิม) */}
            <Card title="Weekly Vehicle Count Comparison by Lane (Sat - Fri)" className="shadow-xl rounded-lg p-3 mt-6" loading={loading}>
                <Table
                    columns={laneWeeklyColumns}
                    dataSource={mockLaneWeeklyData}
                    pagination={false}
                    rowKey="DayName"
                    size="middle"
                    scroll={{ x: 800 }}
                    rowClassName={getWeeklyRowClassName} 
                />
                <Text type="secondary" className="mt-2 block text-sm">
                    <span className="inline-block w-4 h-2 bg-green-200 border border-green-300 mr-2 align-middle"></span> 
                    คือ Cell ที่มีปริมาณรถ **สูงสุด** ในสัปดาห์ (Max Traffic Cell) | 
                    <span className="inline-block w-4 h-2 bg-yellow-100 border border-yellow-300 ml-2 mr-2 align-middle"></span> 
                    คือ วันที่ปริมาณรถ **รวม** สูงสุดในสัปดาห์ |
                    <span className="inline-block w-4 h-2 bg-blue-50 border border-blue-200 ml-2 mr-2 align-middle"></span> 
                    คือ วันหยุดสุดสัปดาห์ (Sat, Sun)
                </Text>
            </Card>
        </Flex>
    );
};

export default ProjectDashboard;