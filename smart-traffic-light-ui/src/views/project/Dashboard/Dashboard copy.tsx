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
  BarChart, Bar
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

// ✅ API shape (placeholder) — ปรับ field ตาม backend จริงภายหลัง
type ApiLaneKey = 'PC-A' | 'PC-B' | 'PC-C' | 'PC-D';

interface DashboardApi {
  date: string; // YYYY-MM-DD
  lanes: Array<{
    laneKey: ApiLaneKey;          // PC-A
    vehicleCount: number;         // 4800
    signal: { red: number; yellow: number; green: number };
  }>;
  hourly: Array<{
    hour: string; // "08:00"
    lanes: Record<ApiLaneKey, number>; // { 'PC-A':120, ... }
  }>;
  weekly: Array<{
    dayName: string; // "Mon"
    lanes: Record<ApiLaneKey, number>;
    total: number;
  }>;
}

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
// 2.1 API PLACEHOLDER (Ready for real backend)
// ----------------------------------------------------

const mapApiLaneToUiLane = (laneKey: ApiLaneKey): string => {
  switch (laneKey) {
    case 'PC-A': return 'Lane 1 (PC-A)';
    case 'PC-B': return 'Lane 2 (PC-B)';
    case 'PC-C': return 'Lane 3 (PC-C)';
    case 'PC-D': return 'Lane 4 (PC-D)';
    default: return `Lane (${laneKey})`;
  }
};

// ✅ TODO: เปลี่ยนเป็น axios/fetch จริง พร้อม endpoint
async function fetchDashboardApi(dateStr: string): Promise<DashboardApi> {
  // ตัวอย่าง endpoint:
  // const res = await axios.get(`/api/dashboard?date=${dateStr}`);
  // return res.data;

  // mock response (แปลงจาก mock ที่มีอยู่)
  const daily = mockTrafficData.filter(d => d.Date === dateStr);
  const lanes = daily.map(d => {
    const laneKey = (d.Lane.match(/\((PC-[A-D])\)/)?.[1] ?? 'PC-A') as ApiLaneKey;
    return {
      laneKey,
      vehicleCount: d.Vehicle_Count,
      signal: { red: d.Red_Count, yellow: d.Yellow_Count, green: d.Green_Count },
    };
  });

  const hourly = mockHourlyData.map(h => ({
    hour: h.Hour,
    lanes: {
      'PC-A': h['Lane 1 (PC-A)'],
      'PC-B': h['Lane 2 (PC-B)'],
      'PC-C': h['Lane 3 (PC-C)'],
      'PC-D': h['Lane 4 (PC-D)'],
    } as Record<ApiLaneKey, number>,
  }));

  const weekly = mockLaneWeeklyData.map(w => ({
    dayName: w.DayName,
    lanes: {
      'PC-A': w['Lane 1 (PC-A)'],
      'PC-B': w['Lane 2 (PC-B)'],
      'PC-C': w['Lane 3 (PC-C)'],
      'PC-D': w['Lane 4 (PC-D)'],
    } as Record<ApiLaneKey, number>,
    total: w.Total_Count,
  }));

  return {
    date: dateStr,
    lanes,
    hourly,
    weekly,
  };
}

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
    title: <><AlertOutlined className="mr-1 text-red-500" /> Traffic Violations</>,
    dataIndex: 'Red_Count',
    key: 'Red_Count',
    render: (count) => <Text type="danger" strong className="font-bold">    {count.toLocaleString()}</Text>,
    align: 'right',
  },
  {
    title: 'Warning (Yellow)',
    dataIndex: 'Yellow_Count',
    key: 'Yellow_Count',
    render: (count) => <Text type='warning' className="font-semibold">{count.toLocaleString()}</Text>,
    align: 'right',

  },
  {
    title: 'Safe (Green)',
    dataIndex: 'Green_Count',
    key: 'Green_Count',
    render: (count) => <Text type='success' className="text-green-600 font-semibold">{count.toLocaleString()}</Text>,
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

  // ✅ state ที่พร้อมรับ API
  const [dailyTraffic, setDailyTraffic] = useState<DailyTrafficData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyTrafficData[]>([]);
  const [weeklyData, setWeeklyData] = useState<LaneWeeklyData[]>([]);

  // --- Data Processing ---
  const currentDayData = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    // ใช้ state เป็นหลัก ถ้าไม่มีค่อย fallback
    const fromState = dailyTraffic.filter(d => d.Date === dateStr);
    return fromState.length ? fromState : mockTrafficData.filter(d => d.Date === dateStr);
  }, [selectedDate, dailyTraffic]);

  const totalVehicleCount = useMemo(() => currentDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0), [currentDayData]);

  const busiestLaneInfo = useMemo(() => {
    if (currentDayData.length === 0) return { lane: 'N/A', count: 0 };
    const busiest = currentDayData.reduce((maxLane, current) => current.Vehicle_Count > maxLane.Vehicle_Count ? current : maxLane, currentDayData[0]);
    return { lane: busiest.Lane.split('(')[0].trim(), count: busiest.Vehicle_Count };
  }, [currentDayData]);

  const dailyChangeInfo = useMemo(() => {
    const previousDate = selectedDate.subtract(1, 'day').format('YYYY-MM-DD');
    const previousDayData = (dailyTraffic.length ? dailyTraffic : mockTrafficData).filter(d => d.Date === previousDate);
    const currentTotal = totalVehicleCount;
    const previousTotal = previousDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);

    if (previousTotal === 0 || currentTotal === 0) return { change: 0, percent: 'N/A', total: previousTotal };

    const difference = currentTotal - previousTotal;
    const percentage = ((difference / previousTotal) * 100).toFixed(1);

    return { change: difference, percent: percentage, total: previousTotal };
  }, [selectedDate, totalVehicleCount, dailyTraffic]);

  const pieData: PieChartData[] = useMemo(() => {
    const totalVehicle = currentDayData.reduce((sum, item) => sum + item.Vehicle_Count, 0);
    if (totalVehicle === 0) return [];
    return currentDayData.map(item => ({
      name: item.Lane.split('(')[0].trim(),
      value: item.Vehicle_Count,
      percent: ((item.Vehicle_Count / totalVehicle) * 100).toFixed(1),
    }));
  }, [currentDayData]);

  const MAX_DAILY_TOTAL = useMemo(() => {
    const base = weeklyData.length ? weeklyData : mockLaneWeeklyData;
    return Math.max(...base.map(d => d.Total_Count));
  }, [weeklyData]);

  // --- Handlers & Utilities ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const res = await fetchDashboardApi(dateStr);

      // ✅ map API -> DailyTrafficData
      const mappedDaily: DailyTrafficData[] = res.lanes.map((l) => ({
        Date: res.date,
        Lane: mapApiLaneToUiLane(l.laneKey),
        Vehicle_Count: l.vehicleCount,
        Red_Count: l.signal.red,
        Yellow_Count: l.signal.yellow,
        Green_Count: l.signal.green,
      }));

      // ✅ map API -> HourlyTrafficData (สำหรับ BarChart)
      const mappedHourly: HourlyTrafficData[] = res.hourly.map((h) => ({
        Hour: h.hour,
        'Lane 1 (PC-A)': h.lanes['PC-A'] ?? 0,
        'Lane 2 (PC-B)': h.lanes['PC-B'] ?? 0,
        'Lane 3 (PC-C)': h.lanes['PC-C'] ?? 0,
        'Lane 4 (PC-D)': h.lanes['PC-D'] ?? 0,
      }));

      // ✅ map API -> LaneWeeklyData
      const mappedWeekly: LaneWeeklyData[] = res.weekly.map((w) => ({
        DayName: w.dayName,
        'Lane 1 (PC-A)': w.lanes['PC-A'] ?? 0,
        'Lane 2 (PC-B)': w.lanes['PC-B'] ?? 0,
        'Lane 3 (PC-C)': w.lanes['PC-C'] ?? 0,
        'Lane 4 (PC-D)': w.lanes['PC-D'] ?? 0,
        Total_Count: w.total ?? 0,
      }));

      setDailyTraffic(mappedDaily);
      setHourlyData(mappedHourly);
      setWeeklyData(mappedWeekly);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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
    {
      title: 'Day',
      dataIndex: 'DayName',
      key: 'DayName',
      fixed: 'left' as const,
      render: (text) => {
        const isWeekend = text === 'Sat' || text === 'Sun';
        return <Tag color={isWeekend ? 'blue' : 'volcano'} className='font-bold'>{text}</Tag>;
      },
    },
    ...getLaneColumns(),
    {
      title: <Text strong className='text-amber-700'><CarOutlined /> Total Count</Text>,
      dataIndex: 'Total_Count',
      key: 'Total_Count',
      align: 'right' as const,
      onCell: (record: LaneWeeklyData) => ({ className: record.Total_Count === MAX_DAILY_TOTAL ? 'bg-yellow-200/70 font-bold' : '' }),
      render: (count: number) => <Text strong className="text-amber-700 text-base">{count.toLocaleString()}</Text>,
    },
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

  // ✅ ใช้ hourlyData จาก state เป็นหลัก (fallback เป็น mock)
  const chartHourly = useMemo(() => (hourlyData.length ? hourlyData : mockHourlyData), [hourlyData]);

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
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Traffic Violations</p>
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
          {/* ✅ กราฟเต็มแถว */}
          <Col span={24}>
            <Card className="shadow-lg rounded-xl h-full" title={<span className="text-gray-700 font-semibold">Hourly Traffic Trend</span>}>
              <div style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartHourly}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}   // ✅ ชิดขึ้น = ดูเต็มขึ้น
                    barCategoryGap="22%"                                 // ✅ ให้แท่งกระจายเต็ม
                    barGap={6}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                    <XAxis dataKey="Hour" tickLine={false} axisLine={false} stroke="#555" />
                    <YAxis tickLine={false} axisLine={false} stroke="#555" width={42} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #ccc' }}
                      formatter={(value: number, name: string) => [`${value.toLocaleString()}`, name.split('(')[0].trim()]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />

                    <Bar dataKey="Lane 1 (PC-A)" fill={LINE_BAR_COLORS['Lane 1 (PC-A)']} radius={[6, 6, 0, 0]} barSize={26} />
                    <Bar dataKey="Lane 2 (PC-B)" fill={LINE_BAR_COLORS['Lane 2 (PC-B)']} radius={[6, 6, 0, 0]} barSize={26} />
                    <Bar dataKey="Lane 3 (PC-C)" fill={LINE_BAR_COLORS['Lane 3 (PC-C)']} radius={[6, 6, 0, 0]} barSize={26} />
                    <Bar dataKey="Lane 4 (PC-D)" fill={LINE_BAR_COLORS['Lane 4 (PC-D)']} radius={[6, 6, 0, 0]} barSize={26} />
                  </BarChart>
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
        <Card className="shadow-lg rounded-xl " title={<span className="flex items-center gap-2"><TableOutlined className="text-blue-500" /> Weekly Pattern Analysis</span>}>
          <Table
            columns={laneWeeklyColumns}
            dataSource={weeklyData.length ? weeklyData : mockLaneWeeklyData}
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
