// src/views/dashboard/ProjectDashboard.tsx (FINAL CODE: Clean Version)

import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Ant Design components used for functionality
import { DatePicker, Table, Tag, Button, Typography, Spin, Divider, Card, Flex, Row, Col } from 'antd'; 
import type { TableProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Sector, // Import Sector for custom active shape
    AreaChart, Area
} from 'recharts';
import { 
    SyncOutlined, 
    CarOutlined, 
    AlertOutlined, 
    ArrowUpOutlined, 
    ArrowDownOutlined,
    ClockCircleOutlined,
    FieldTimeOutlined,
    LineChartOutlined,
    TableOutlined
} from '@ant-design/icons';
import classNames from 'classnames';

dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography; 

// ----------------------------------------------------
// 1. INTERFACES (Type Definitions)
// ----------------------------------------------------

interface DailyTrafficData { Date: string; Lane: string; Vehicle_Count: number; Red_Count: number; Yellow_Count: number; Green_Count: number; }
interface HourlyTrafficData { Hour: string; 'Lane 1 (PC-A)': number; 'Lane 2 (PC-B)': number; 'Lane 3 (PC-C)': number; 'Lane 4 (PC-D)': number; }
interface PieChartData { name: string; value: number; percent: string; }
interface LaneWeeklyData { DayName: string; 'Lane 1 (PC-A)': number; 'Lane 2 (PC-B)': number; 'Lane 3 (PC-C)': number; 'Lane 4 (PC-D)': number; Total_Count: number; }

// ----------------------------------------------------
// 2. MOCK DATA & CONFIG
// ----------------------------------------------------

const mockTrafficData: DailyTrafficData[] = [
    { Date: '2025-09-24', Lane: 'Lane 1 (PC-A)', Vehicle_Count: 4800, Red_Count: 320, Yellow_Count: 50, Green_Count: 480 },
    { Date: '2025-09-24', Lane: 'Lane 2 (PC-B)', Vehicle_Count: 6100, Red_Count: 400, Yellow_Count: 65, Green_Count: 550 },
    { Date: '2025-09-24', Lane: 'Lane 3 (PC-C)', Vehicle_Count: 3500, Red_Count: 250, Yellow_Count: 40, Green_Count: 300 },
    { Date: '2025-09-24', Lane: 'Lane 4 (PC-D)', Vehicle_Count: 5200, Red_Count: 350, Yellow_Count: 55, Green_Count: 420 },
    
    { Date: '2025-09-23', Lane: 'Lane 1 (PC-A)', Vehicle_Count: 4000, Red_Count: 300, Yellow_Count: 50, Green_Count: 400 },
    { Date: '2025-09-23', Lane: 'Lane 2 (PC-B)', Vehicle_Count: 5000, Red_Count: 350, Yellow_Count: 60, Green_Count: 450 },
    { Date: '2025-09-23', Lane: 'Lane 3 (PC-C)', Vehicle_Count: 3000, Red_Count: 200, Yellow_Count: 35, Green_Count: 280 },
    { Date: '2025-09-23', Lane: 'Lane 4 (PC-D)', Vehicle_Count: 4000, Red_Count: 250, Yellow_Count: 45, Green_Count: 350 },
];

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

// Aesthetic Color Palette 
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']; 
const LANE_NAMES = ['Lane 1 (PC-A)', 'Lane 2 (PC-B)', 'Lane 3 (PC-C)', 'Lane 4 (PC-D)'];
const LINE_BAR_COLORS = {
    'Lane 1 (PC-A)': '#3b82f6', // Bright Blue
    'Lane 2 (PC-B)': '#f59e0b', // Amber
    'Lane 3 (PC-C)': '#10b981', // Emerald
    'Lane 4 (PC-D)': '#ef4444', // Red
};
const MAX_LANE_TRAFFIC = 6500; 

// ----------------------------------------------------
// 3. Table Configurations (Refined Typography)
// ----------------------------------------------------

const vehicleTableColumns: TableProps<DailyTrafficData>['columns'] = [
    {
        title: 'Lane',
        dataIndex: 'Lane',
        key: 'Lane',
        render: (text) => <Tag color="processing" className="text-sm font-medium" style={{ minWidth: 100, textAlign: 'center' }}>{text.split('(')[0].trim()}</Tag>,
    },
    {
        title: <><CarOutlined className="mr-1" /> Vehicle Count</>,
        dataIndex: 'Vehicle_Count',
        key: 'Vehicle_Count',
        sorter: (a, b) => a.Vehicle_Count - b.Vehicle_Count,
        render: (count) => <Text strong className="text-blue-600 font-extrabold">{count.toLocaleString()}</Text>, 
        align: 'right',
    },
    {
        title: <><FieldTimeOutlined className="mr-1" /> Avg. / Hour</>,
        key: 'Avg. Traffic',
        render: (_, record) => (
            <Text type="secondary" className="font-mono text-sm">{(record.Vehicle_Count / 8).toFixed(0)}</Text>
        ),
        align: 'right',
    },
];

const trafficTableColumns: TableProps<DailyTrafficData>['columns'] = [
    {
        title: 'Lane',
        dataIndex: 'Lane',
        key: 'Lane',
        render: (text) => <Tag color="processing" className="text-sm font-medium" style={{ minWidth: 100, textAlign: 'center' }}>{text.split('(')[0].trim()}</Tag>,
    },
    {
        title: <><AlertOutlined className="mr-1 text-red-500" /> Critical (Red)</>,
        dataIndex: 'Red_Count',
        key: 'Red_Count',
        sorter: (a, b) => a.Red_Count - b.Red_Count,
        render: (count) => <Text type="danger" strong className="font-bold">{count.toLocaleString()}</Text>,
        align: 'right',
    },
    {
        title: 'Warning (Yellow)',
        dataIndex: 'Yellow_Count',
        key: 'Yellow_Count',
        render: (count) => <Text className="text-yellow-600 font-semibold">{count.toLocaleString()}</Text>, 
        align: 'right',
    },
    {
        title: 'Safe (Green)',
        dataIndex: 'Green_Count',
        key: 'Green_Count',
        render: (count) => <Text className="text-green-600 font-semibold">{count.toLocaleString()}</Text>, 
        align: 'right',
    },
];

const getLaneColumns = () => LANE_NAMES.map(lane => ({
    title: lane.split('(')[0].trim(), 
    dataIndex: lane,
    key: lane,
    align: 'right' as const,
    render: (count: number) => <Text>{count.toLocaleString()}</Text>,
    onCell: (record: LaneWeeklyData) => ({
        className: (record[lane as keyof LaneWeeklyData] as number) === MAX_LANE_TRAFFIC ? 
            'bg-green-100 font-bold' : '' 
    }),
}));

// ----------------------------------------------------
// 4. MAIN COMPONENT LOGIC
// ----------------------------------------------------

const ProjectDashboard = () => {
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs('2025-09-24'));
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1); 

    // --- Data Processing ---
    const currentDayData = useMemo(() => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        return mockTrafficData.filter(d => d.Date === dateStr);
    }, [selectedDate]);
    
    const totalVehicleCount = useMemo(() => currentDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0), [currentDayData]);

    const busiestLaneInfo = useMemo(() => {
        if (currentDayData.length === 0) return { lane: 'N/A', count: 0 };
        const busiest = currentDayData.reduce((maxLane, current) => current.Vehicle_Count > maxLane.Vehicle_Count ? current : maxLane, currentDayData[0]);
        return { lane: busiest.Lane.split('(')[0].trim(), count: busiest.Vehicle_Count };
    }, [currentDayData]);

    const dailyChangeInfo = useMemo(() => {
        const previousDate = selectedDate.subtract(1, 'day').format('YYYY-MM-DD');
        const previousDayData = mockTrafficData.filter(d => d.Date === previousDate);
        const currentTotal = totalVehicleCount;
        const previousTotal = previousDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);

        if (previousTotal === 0 || currentTotal === 0) return { change: 0, percent: 'N/A', total: previousTotal };

        const difference = currentTotal - previousTotal;
        const percentage = ((difference / previousTotal) * 100).toFixed(1);
        
        return { change: difference, percent: percentage, total: previousTotal };
    }, [selectedDate, totalVehicleCount]);

    const pieData: PieChartData[] = useMemo(() => {
        const totalVehicle = currentDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);
        if (totalVehicle === 0) return [];
        return currentDayData.map(item => ({
            name: item.Lane.split('(')[0].trim(),
            value: item.Vehicle_Count,
            percent: ((item.Vehicle_Count / totalVehicle) * 100).toFixed(1),
        }));
    }, [currentDayData]);
    
    const MAX_DAILY_TOTAL = useMemo(() => Math.max(...mockLaneWeeklyData.map(d => d.Total_Count)), []);

    // --- Handlers & Utilities ---
    const loadData = useCallback(async () => { 
        setLoading(true); 
        await new Promise(resolve => setTimeout(resolve, 800)); 
        setLoading(false); 
    }, []);

    useEffect(() => { loadData(); }, [loadData, selectedDate]);

    const getWeeklyRowClassName = useCallback((record: LaneWeeklyData, index: number): string => {
        const isWeekend = record.DayName === 'Sat' || record.DayName === 'Sun';
        const isMaxTotal = record.Total_Count === MAX_DAILY_TOTAL;
        return classNames({
            'bg-blue-50 hover:bg-blue-100': isWeekend,
            'bg-yellow-100/80 hover:bg-yellow-200': isMaxTotal,
        });
    }, [MAX_DAILY_TOTAL]);
    
    const laneWeeklyColumns: TableProps<LaneWeeklyData>['columns'] = [
        { title: 'Day', dataIndex: 'DayName', key: 'DayName', fixed: 'left' as const, render: (text) => { const isWeekend = text === 'Sat' || text === 'Sun'; return <Tag color={isWeekend ? 'blue' : 'volcano'} className='font-bold'>{text}</Tag>; }, },
        ...getLaneColumns(),
        { title: <Text strong className='text-amber-700'><CarOutlined /> Total Count</Text>, dataIndex: 'Total_Count', key: 'Total_Count', align: 'right' as const, onCell: (record: LaneWeeklyData) => ({ className: record.Total_Count === MAX_DAILY_TOTAL ? 'bg-yellow-200/70 font-bold' : '' }), render: (count: number) => <Text strong className="text-amber-700 text-base">{count.toLocaleString()}</Text>, },
    ];

    const ChangeDisplay: React.FC<{ change: number, percent: string }> = ({ change, percent }) => {
        if (change === 0) return <span className="text-gray-400 text-sm">No change</span>;

        const isPositive = change > 0;
        const colorClass = isPositive ? 'text-green-500' : 'text-red-500'; 
        const Icon = isPositive ? ArrowUpOutlined : ArrowDownOutlined;

        return (
            <div className="flex items-center gap-1">
                <Icon className={`${colorClass} text-xl`} />
                <span className={`text-3xl font-extrabold ${colorClass}`}>
                    {Math.abs(change).toLocaleString()} 
                </span>
                <span className={`text-lg font-semibold ${colorClass}`}>
                    ({percent}%)
                </span>
            </div>
        );
    };

    // --- Interactive Pie Chart Logic ---
    const renderActiveShape = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 15} // Expand
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    className="shadow-md transition-all duration-300"
                />
                <text 
                    x={x} 
                    y={y} 
                    fill="white" 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    className="font-bold text-sm pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} 
                >
                    {`${payload.name} (${payload.percent}%)`}
                </text>
            </g>
        );
    };
    
    const onPieEnter = useCallback((_: unknown, index: number) => { setActiveIndex(index); }, []);
    const onPieLeave = useCallback(() => { setActiveIndex(-1); }, []);

    // ----------------------------------------------------
    // 5. UI Rendering
    // ----------------------------------------------------

    return (
        // ✅ FIX: Wrapper สีขาว เต็มจอ เหมือนหน้าอื่นๆ
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}> 
            
            {/* ✅ FIX: ใช้ Flex vertical gap="large" เพื่อคุม Layout ทั้งหน้า */}
            <Flex vertical gap="large">

                {/* --- HEADER --- */}
                <Flex justify="space-between" align="middle" wrap="wrap" gap="small">
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Smart Traffic Operations Dashboard
                    </Title>
                    <Flex gap="middle">
                        <DatePicker 
                            onChange={(date) => { if (date) setSelectedDate(date); }}
                            value={selectedDate}
                            placeholder="Select Date" 
                            allowClear={false}
                            style={{ minWidth: 150 }}
                        />
                        <Button icon={<SyncOutlined />} onClick={loadData} loading={loading} type="primary">
                            Refresh Data
                        </Button>
                    </Flex>
                </Flex>
                
                {/* --- SECTION: KPI GRID --- */}
                {/* ใช้ Card ของ Ant Design ให้ดูสะอาดขึ้น */}
                <Card className="shadow-md rounded-xl border border-gray-100" bodyStyle={{ padding: '24px' }}>
                    <Title level={5} style={{ marginTop: 0, marginBottom: 16 }} className="text-gray-600 flex items-center">
                        <LineChartOutlined className="mr-2 text-blue-500" /> Executive Summary ({selectedDate.format('DD MMMM YYYY')})
                    </Title>
                    <Row gutter={[24, 24]}>
                        {/* KPI 1 */}
                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm hover:shadow-md transition-all border-l-4 border-blue-500">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Vehicle Count</p>
                                <div className='flex justify-between items-center'>
                                    <h3 className="text-4xl font-extrabold text-blue-600 mb-0">{totalVehicleCount.toLocaleString()}</h3>
                                    <CarOutlined className="text-4xl text-blue-300 opacity-50" />
                                </div>
                            </Card>
                        </Col>
                        {/* KPI 2 */}
                        <Col xs={24} md={12} lg={6}>
                            <Card className={classNames("h-full shadow-sm hover:shadow-md transition-all border-l-4", dailyChangeInfo.change > 0 ? "border-green-500" : dailyChangeInfo.change < 0 ? "border-red-500" : "border-gray-400")}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Daily Change (%)</p>
                                {dailyChangeInfo.total === 0 ? (<p className="text-gray-500 text-3xl font-bold mb-0">N/A</p>) : (<ChangeDisplay change={dailyChangeInfo.change} percent={dailyChangeInfo.percent} />)}
                            </Card>
                        </Col>
                        {/* KPI 3 */}
                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm hover:shadow-md transition-all border-l-4 border-amber-500">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Busiest Lane</p>
                                <h3 className="text-2xl font-bold text-amber-600 mb-0 truncate">{busiestLaneInfo.lane}</h3>
                                <p className="text-gray-500 text-sm">{busiestLaneInfo.count.toLocaleString()} Vehicles</p>
                            </Card>
                        </Col>
                        {/* KPI 4 */}
                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm hover:shadow-md transition-all border-l-4 border-red-500">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Critical Red Light</p>
                                <div className='flex justify-between items-center'>
                                    <h3 className="text-4xl font-extrabold text-red-600 mb-0">{currentDayData.reduce((sum, item) => sum + item.Red_Count, 0).toLocaleString()}</h3>
                                    <AlertOutlined className="text-4xl text-red-300 opacity-50" />
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* --- SECTION: CHARTS --- */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card className="shadow-lg rounded-xl h-full" title={<span className="text-gray-700 font-semibold">Hourly Traffic Trend</span>}>
                            <div style={{ height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockHourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                                        <XAxis dataKey="Hour" tickLine={false} axisLine={false} stroke="#555" />
                                        <YAxis tickLine={false} axisLine={false} stroke="#555" />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ccc' }} formatter={(value: number, name: string) => [`${value.toLocaleString()}`, name.split('(')[0].trim()]} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                        {Object.keys(LINE_BAR_COLORS).map((lane) => (
                                            <Area 
                                                key={lane}
                                                type="monotone" 
                                                dataKey={lane} 
                                                stroke={LINE_BAR_COLORS[lane as keyof typeof LINE_BAR_COLORS]}
                                                fill={LINE_BAR_COLORS[lane as keyof typeof LINE_BAR_COLORS]} 
                                                fillOpacity={0.15} 
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card className="shadow-lg rounded-xl h-full" title={<span className="text-gray-700 font-semibold">Vehicle Distribution</span>}>
                            <div style={{ height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60} // Donut style looks cleaner
                                            outerRadius={100} 
                                            paddingAngle={3} 
                                            activeShape={renderActiveShape} 
                                            onMouseEnter={onPieEnter} 
                                            onMouseLeave={onPieLeave} 
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* --- SECTION: TABLES --- */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><CarOutlined className="text-blue-500" /> Lane Breakdown</span>}>
                            <Table columns={vehicleTableColumns} dataSource={currentDayData} pagination={false} rowKey="Lane" size="middle" scroll={{ x: 400 }} />
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><AlertOutlined className="text-red-500" /> Violations</span>}>
                            <Table columns={trafficTableColumns} dataSource={currentDayData} pagination={false} rowKey="Lane" size="middle" scroll={{ x: 400 }} />
                        </Card>
                    </Col>
                </Row>
                
                {/* --- SECTION: WEEKLY TABLE --- */}
                <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><TableOutlined className="text-blue-500" /> Weekly Pattern Analysis</span>}>
                    <Table
                        columns={laneWeeklyColumns}
                        dataSource={mockLaneWeeklyData}
                        pagination={false}
                        rowKey="DayName"
                        size="middle" 
                        scroll={{ x: 1000 }}
                        rowClassName={getWeeklyRowClassName} 
                    />
                </Card>

            </Flex>
        </div>
    );
};

export default ProjectDashboard;