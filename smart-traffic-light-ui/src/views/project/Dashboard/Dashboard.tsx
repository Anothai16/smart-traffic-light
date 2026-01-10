// src/views/dashboard/ProjectDashboard.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DatePicker, Table, Tag, Button, Typography, Card, Flex, Row, Col, message } from 'antd';
import type { TableProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import {
  SyncOutlined,
  CarOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  TableOutlined
} from '@ant-design/icons';
import classNames from 'classnames';

// เชื่อมต่อ Service จริง
import { apiGetDashboardAnalytics, DashboardResponse } from '@/services/DashboardService';

dayjs.extend(isSameOrBefore);
const { Title, Text } = Typography;

// ----------------------------------------------------
// 1. INTERFACES
// ----------------------------------------------------
interface DailyTrafficData { 
  Date: string; 
  Lane: string; 
  Vehicle_Count: number; 
  Red_Count: number; 
  Yellow_Count: number; 
  Green_Count: number; 
}

const LANE_NAMES = ['Lane 1 (PC-A)', 'Lane 2 (PC-B)', 'Lane 3 (PC-C)', 'Lane 4 (PC-D)'];
const LINE_BAR_COLORS = {
  'Lane 1 (PC-A)': '#3b82f6',
  'Lane 2 (PC-B)': '#f59e0b',
  'Lane 3 (PC-C)': '#10b981',
  'Lane 4 (PC-D)': '#ef4444',
};

const formatLaneName = (key: string | number) => {
  const map: Record<string, string> = {
    '1': 'Lane 1 (PC-A)', '2': 'Lane 2 (PC-B)', '3': 'Lane 3 (PC-C)', '4': 'Lane 4 (PC-D)',
    'PC-A': 'Lane 1 (PC-A)', 'PC-B': 'Lane 2 (PC-B)', 'PC-C': 'Lane 3 (PC-C)', 'PC-D': 'Lane 4 (PC-D)'
  };
  return map[key] || `Lane ${key}`;
};

const ProjectDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [dailyTraffic, setDailyTraffic] = useState<DailyTrafficData[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  // ----------------------------------------------------
  // 2. DATA LOADING
  // ----------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const res: DashboardResponse = await apiGetDashboardAnalytics(dateStr);

      setDailyTraffic(res.lanes.map(l => ({
        Date: res.date,
        Lane: formatLaneName(l.laneKey),
        Vehicle_Count: l.vehicleCount,
        Red_Count: l.red,
        Yellow_Count: l.yellow,
        Green_Count: l.green
      })));

      setHourlyData(res.hourly.map(h => {
        const row: any = { Hour: h.hour };
        Object.keys(h).forEach(key => { if (key !== 'hour') row[formatLaneName(key)] = h[key]; });
        return row;
      }));

      setWeeklyData(res.weekly.map(w => {
        const row: any = { DayName: w.dayName, Total_Count: w.total };
        Object.keys(w).forEach(key => { if (key !== 'dayName' && key !== 'total') row[formatLaneName(key)] = w[key]; });
        return row;
      }));
    } catch (error: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ----------------------------------------------------
  // 3. STATS & DAILY CHANGE CALCULATION
  // ----------------------------------------------------
  const totalVehicleCount = useMemo(() => dailyTraffic.reduce((sum, item) => sum + item.Vehicle_Count, 0), [dailyTraffic]);
  const totalRedViolations = useMemo(() => dailyTraffic.reduce((sum, item) => sum + item.Red_Count, 0), [dailyTraffic]);
  
  const busiestLaneInfo = useMemo(() => {
    if (dailyTraffic.length === 0) return { lane: 'N/A', count: 0 };
    const busiest = dailyTraffic.reduce((prev, curr) => (prev.Vehicle_Count > curr.Vehicle_Count) ? prev : curr);
    return { lane: busiest.Lane.split('(')[0].trim(), count: busiest.Vehicle_Count };
  }, [dailyTraffic]);

  // คำนวณ Daily Change โดยเทียบกับค่าเฉลี่ยรายสัปดาห์ หรือ Logic ที่คุณต้องการ
  const dailyChangeInfo = useMemo(() => {
    if (weeklyData.length < 2) return { change: 0, percent: '0.0' };
    const todayTotal = totalVehicleCount;
    const yesterdayData = weeklyData[weeklyData.length - 2]; // ข้อมูลวันก่อนหน้าจาก Weekly List
    const yesterdayTotal = yesterdayData?.Total_Count || 0;
    
    if (yesterdayTotal === 0) return { change: 0, percent: '0.0' };
    const diff = todayTotal - yesterdayTotal;
    const percent = ((diff / yesterdayTotal) * 100).toFixed(1);
    return { change: diff, percent };
  }, [totalVehicleCount, weeklyData]);

  // ----------------------------------------------------
  // 4. COMPONENTS
  // ----------------------------------------------------
  const ChangeDisplay = ({ change, percent }: { change: number, percent: string }) => {
    const isPositive = change > 0;
    const colorClass = isPositive ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';
    const Icon = isPositive ? ArrowUpOutlined : change < 0 ? ArrowDownOutlined : null;

    return (
      <div className="flex items-center gap-1">
        {Icon && <Icon className={`${colorClass} text-xl`} />}
        <span className={`text-3xl font-extrabold ${colorClass}`}>
          {Math.abs(change).toLocaleString()}
        </span>
        <span className={`text-lg font-semibold ${colorClass}`}>
          ({percent}%)
        </span>
      </div>
    );
  };

  const laneWeeklyColumns = [
    { 
      title: 'Day', dataIndex: 'DayName', key: 'DayName', fixed: 'left' as const,
      render: (text: string) => <Tag color={['Sat', 'Sun', 'Saturday', 'Sunday'].includes(text) ? 'blue' : 'volcano'} className='font-bold'>{text}</Tag>
    },
    ...LANE_NAMES.map(lane => ({
      title: lane.split('(')[0].trim(), dataIndex: lane, key: lane, align: 'right' as const,
      render: (count: number) => <Text>{(count || 0).toLocaleString()}</Text>
    })),
    { 
      title: <Text strong className='text-amber-700'><CarOutlined /> Total Count</Text>,
      dataIndex: 'Total_Count', key: 'Total_Count', align: 'right' as const,
      render: (count: number) => <Text strong className="text-amber-700 text-base">{(count || 0).toLocaleString()}</Text>
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <Flex vertical gap="large">
        <Flex justify="space-between" align="middle" wrap="wrap" gap="small">
          <Title level={4} style={{ margin: 0 }} className="text-gray-800">Smart Traffic Operations Dashboard</Title>
          <Flex gap="middle">
            <DatePicker onChange={(d) => d && setSelectedDate(d)} value={selectedDate} allowClear={false} style={{ minWidth: 150 }} />
            <Button icon={<SyncOutlined />} onClick={loadData} loading={loading} type="primary">Refresh Data</Button>
          </Flex>
        </Flex>

        {/* --- EXECUTIVE SUMMARY --- */}
        <Card className="shadow-md rounded-xl border border-gray-100" bodyStyle={{ padding: '24px' }}>
          <Title level={5} className="text-gray-600 mb-4 flex items-center"><LineChartOutlined className="mr-2 text-blue-500" /> Executive Summary ({selectedDate.format('DD MMM YYYY')})</Title>
          <Row gutter={[24, 24]}>
            {/* Total Vehicle */}
            <Col xs={24} md={12} lg={6}>
              <Card className="h-full shadow-sm border-l-4 border-blue-500">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Total Vehicle Count</p>
                <div className='flex justify-between items-center'>
                  <h3 className="text-4xl font-extrabold text-blue-600 mb-0">{totalVehicleCount.toLocaleString()}</h3>
                  <CarOutlined className="text-4xl text-blue-300 opacity-50" />
                </div>
              </Card>
            </Col>
            
            {/* Daily Change (%) - กลับมาแล้ว! */}
            <Col xs={24} md={12} lg={6}>
              <Card className={classNames("h-full shadow-sm border-l-4", dailyChangeInfo.change >= 0 ? "border-green-500" : "border-red-500")}>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Daily Change (%)</p>
                <ChangeDisplay change={dailyChangeInfo.change} percent={dailyChangeInfo.percent} />
              </Card>
            </Col>

            {/* Busiest Lane */}
            <Col xs={24} md={12} lg={6}>
              <Card className="h-full shadow-sm border-l-4 border-amber-500">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Busiest Lane</p>
                <h3 className="text-2xl font-bold text-amber-600 mb-0 truncate">{busiestLaneInfo.lane}</h3>
                <p className="text-gray-500 text-sm">{busiestLaneInfo.count.toLocaleString()} Vehicles</p>
              </Card>
            </Col>

            {/* Red Light Violations */}
            <Col xs={24} md={12} lg={6}>
              <Card className="h-full shadow-sm border-l-4 border-red-500">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Red Light Violations</p>
                <div className='flex justify-between items-center'>
                  <h3 className="text-4xl font-extrabold text-red-600 mb-0">{totalRedViolations.toLocaleString()}</h3>
                  <AlertOutlined className="text-4xl text-red-300 opacity-50" />
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* --- HOURLY TREND --- */}
        <Card className="shadow-lg rounded-xl" title={<span className="text-gray-700 font-semibold">Hourly Traffic Trend</span>}>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} barCategoryGap="22%" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="Hour" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={42} />
                <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(v: number) => v.toLocaleString()} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                {LANE_NAMES.map(lane => (
                  <Bar key={lane} dataKey={lane} fill={LINE_BAR_COLORS[lane as keyof typeof LINE_BAR_COLORS]} radius={[6, 6, 0, 0]} barSize={26} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* --- BREAKDOWN TABLES --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><CarOutlined className="text-blue-500" /> Lane Breakdown</span>}>
              <Table 
                columns={[
                  { title: 'Lane', dataIndex: 'Lane', key: 'Lane', render: (t) => <Tag color="processing" className="text-sm font-medium">{t.split('(')[0]}</Tag> },
                  { title: 'Vehicle Count', dataIndex: 'Vehicle_Count', key: 'Vehicle_Count', align: 'right', render: (v) => <Text strong className="text-blue-600 font-extrabold">{v.toLocaleString()}</Text> }
                ]} 
                dataSource={dailyTraffic} pagination={false} rowKey="Lane" size="middle" loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><AlertOutlined className="text-red-500" /> Red Light Violations</span>}>
              <Table 
                columns={[
                  { title: 'Lane', dataIndex: 'Lane', key: 'Lane', render: (t) => <Tag color="processing" className="text-sm font-medium">{t.split('(')[0]}</Tag> },
                  { title: 'Red Light Violations', dataIndex: 'Red_Count', key: 'Red_Count', align: 'right', render: (v) => <Text type="danger" strong className="font-bold">{v.toLocaleString()}</Text> }
                ]} 
                dataSource={dailyTraffic} pagination={false} rowKey="Lane" size="middle" loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* --- WEEKLY ANALYSIS --- */}
        <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><TableOutlined className="text-blue-500" /> Weekly Pattern Analysis</span>}>
          <Table
            columns={laneWeeklyColumns}
            dataSource={weeklyData}
            pagination={false}
            rowKey="DayName"
            size="middle"
            scroll={{ x: 1000 }}
            loading={loading}
          />
        </Card>
      </Flex>
    </div>
  );
};

export default ProjectDashboard;