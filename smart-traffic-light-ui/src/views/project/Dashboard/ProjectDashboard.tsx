// src/views/dashboard/ProjectDashboard.tsx (FINAL CODE: Aesthetic V3 + Interactive Pie Chart)

import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Ant Design components used for functionality (DatePicker, Table, Button, Typography, Tag)
import { DatePicker, Table, Tag, Button, Typography, Spin, Divider } from 'antd'; 
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

const { Text } = Typography; 

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
    // NEW STATE: สำหรับเก็บ Index ของ Pie Slice ที่กำลัง Hover เพื่อแสดงลูกเล่น
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
    
    // Custom Active Shape สำหรับ Pie Chart (ลูกเล่น: Expand และแสดง Label)
    const renderActiveShape = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
        const RADIAN = Math.PI / 180;
        
        // คำนวณตำแหน่งสำหรับ Label ที่อยู่กลาง Sector
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <g>
                {/* 1. Sector ที่ขยายใหญ่ขึ้น (Expand effect) */}
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 15} // ขยายเพิ่ม 15 units เมื่อ Hover
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    className="shadow-md transition-all duration-300"
                />
                {/* 2. Label กลาง Sector (แสดงชื่อและ % อย่างชัดเจน) */}
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
    
    // Handlers สำหรับ Pie Chart Interactive
    const onPieEnter = useCallback((_: unknown, index: number) => {
        setActiveIndex(index);
    }, []);

    const onPieLeave = useCallback(() => {
        setActiveIndex(-1);
    }, []);

    // ----------------------------------------------------
    // 5. UI Rendering (Enhanced Organization & Aesthetics)
    // ----------------------------------------------------

    return (
        <div className="p-6 md:p-10 bg-gray-50 min-h-screen"> 
            
            {/* --- SECTION: HEADER & CONTROLS --- */}
            <header className="bg-white p-6 rounded-2xl shadow-xl mb-10">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                        <CarOutlined className="mr-3 text-blue-600 text-4xl" /> Smart Traffic Operations Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <DatePicker 
                            onChange={(date) => { if (date) setSelectedDate(date); }}
                            value={selectedDate}
                            placeholder="Select Date" 
                            allowClear={false}
                            size="large"
                            style={{ minWidth: 150 }}
                        />
                        <Button icon={<SyncOutlined />} onClick={loadData} loading={loading} type="primary" size="large">
                            Refresh Data
                        </Button>
                    </div>
                </div>
            </header>
            
            {/* --- SECTION: KEY PERFORMANCE INDICATORS (KPI) --- */}
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <LineChartOutlined className="mr-2 text-blue-500" /> Executive Summary: Traffic Volume ({selectedDate.format('DD MMMM YYYY')})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                
                {/* KPI Card 1: Total Vehicles */}
                <div className="bg-white p-6 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-blue-300/50 border-b-4 border-blue-500 flex flex-col justify-between">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Vehicle Count</p>
                    <div className='flex justify-between items-center'>
                        <h3 className="text-5xl font-extrabold text-blue-600">{totalVehicleCount.toLocaleString()}</h3>
                        <CarOutlined className="text-6xl text-blue-300 opacity-50" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2"><ClockCircleOutlined className="mr-1" /> Data for the selected day</p>
                </div>

                {/* KPI Card 2: Daily Change */}
                <div className={classNames("bg-white p-6 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-green-300/50",dailyChangeInfo.change > 0 ? "border-b-4 border-green-500" : dailyChangeInfo.change < 0 ? "border-b-4 border-red-500" : "border-b-4 border-gray-400")}>
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Daily Change (%)</p>
                    {dailyChangeInfo.total === 0 ? (<p className="text-gray-500 pt-2 text-3xl font-bold">N/A</p>) : (<ChangeDisplay change={dailyChangeInfo.change} percent={dailyChangeInfo.percent} />)}
                    <p className="text-xs text-gray-400 mt-2">vs. {selectedDate.subtract(1, 'day').format('DD MMMM')}</p>
                </div>

                 {/* KPI Card 3: Busiest Lane */}
                 <div className="bg-white p-6 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-amber-300/50 border-b-4 border-amber-500 flex flex-col justify-between">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Busiest Lane</p>
                    <h3 className="text-3xl font-bold text-amber-600 mt-1">{busiestLaneInfo.lane}</h3>
                    <p className="text-xl text-gray-800 font-bold mb-3">{busiestLaneInfo.count.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Vehicles</p>
                </div>

                {/* KPI Card 4: Critical Alert Status */}
                <div className="bg-white p-6 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-red-300/50 border-b-4 border-red-500 flex flex-col justify-between">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Critical Red Light Count</p>
                    <div className='flex justify-between items-center'>
                        <h3 className="text-5xl font-extrabold text-red-600">{currentDayData.reduce((sum, item) => sum + item.Red_Count, 0).toLocaleString()}</h3>
                        <AlertOutlined className="text-6xl text-red-300 opacity-50" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">High priority for review</p>
                </div>
            </div>

            {/* --- SECTION: DAILY VISUALIZATION (Charts) --- */}
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <LineChartOutlined className="mr-2 text-blue-500" /> Daily Visual Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                
                {/* 1. Hourly Traffic Trend (Area Chart) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Hourly Traffic Trend</h3>
                    <p className="text-sm text-gray-500 mb-6">Vehicle count trend across all lanes throughout the measured hours.</p>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={mockHourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                            <XAxis dataKey="Hour" tickLine={false} axisLine={false} stroke="#555" />
                            <YAxis tickLine={false} axisLine={false} stroke="#555" />
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ccc', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} formatter={(value: number, name: string) => [`${value.toLocaleString()} vehicles`, name.split('(')[0].trim()]} />
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
                                    dot={false}
                                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
                {/* 2. Lane Distribution (Interactive Pie Chart) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Vehicle Distribution by Lane</h3>
                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0} // Standard Pie Chart
                                    outerRadius={140} 
                                    paddingAngle={3} 
                                    activeShape={renderActiveShape} 
                                    onMouseEnter={onPieEnter} 
                                    onMouseLeave={onPieLeave} 
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                            stroke="#f9fafb" 
                                            strokeWidth={3}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: 8, border: '1px solid #ccc' }}
                                    formatter={(value: number, name: string, props) => [`${value.toLocaleString()} (${(props.payload as any).percent}%)`, name]} 
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- SECTION: DAILY SUMMARY TABLES --- */}
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <TableOutlined className="mr-2 text-blue-500" /> Detailed Daily Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <h3 className="text-xl font-semibold text-gray-700 p-4 border-b flex items-center">
                         <CarOutlined className="mr-2 text-blue-500" /> Lane Vehicle Count Breakdown
                    </h3>
                    <Table columns={vehicleTableColumns} dataSource={currentDayData} pagination={false} rowKey="Lane" size="large" />
                </div>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <h3 className="text-xl font-semibold text-gray-700 p-4 border-b flex items-center">
                         <AlertOutlined className="mr-2 text-red-500" /> Signal Violation Breakdown
                    </h3>
                     <Table columns={trafficTableColumns} dataSource={currentDayData} pagination={false} rowKey="Lane" size="large" />
                </div>
            </div>
            
            {/* --- SECTION: WEEKLY COMPARISON --- */}
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <TableOutlined className="mr-2 text-blue-500" /> Weekly Pattern Analysis (Sat - Fri)
            </h2>
            <div className="bg-white p-6 rounded-2xl shadow-xl mt-6">
                <p className="text-sm text-gray-500 mb-6">Comparative view of traffic patterns over a week, highlighting peak days and lanes.</p>
                <Table
                    columns={laneWeeklyColumns}
                    dataSource={mockLaneWeeklyData}
                    pagination={false}
                    rowKey="DayName"
                    size="large" 
                    scroll={{ x: 900 }}
                    rowClassName={getWeeklyRowClassName} 
                    bordered={false} 
                />
                <Text type="secondary" className="mt-4 block text-sm">
                    **Legend:**
                    <span className="inline-block w-4 h-2 bg-green-100 border border-green-300 ml-4 mr-2 align-middle"></span> 
                    Cell ที่มีปริมาณรถ **สูงสุด** ในสัปดาห์ (Max Lane Traffic) | 
                    <span className="inline-block w-4 h-2 bg-yellow-100/80 border border-yellow-300 ml-4 mr-2 align-middle"></span> 
                    วันที่ปริมาณรถ **รวม** สูงสุดในสัปดาห์ |
                    <span className="inline-block w-4 h-2 bg-blue-50 border border-blue-200 ml-4 mr-2 align-middle"></span> 
                    วันหยุดสุดสัปดาห์ (Sat, Sun)
                </Text>
            </div>
        </div>
    );
};

export default ProjectDashboard;