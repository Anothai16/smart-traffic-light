// src/views/dashboard/ProjectDashboard.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DatePicker, Table, Tag, Button, Typography, Card, Flex, Row, Col, message } from 'antd';
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

// Import Service (ตรวจสอบ path ให้ตรงกับโปรเจคจริง)
import { apiGetDashboardAnalytics, DashboardResponse } from '@/services/DashboardService';

dayjs.extend(isSameOrBefore);
const { Title, Text } = Typography;

// ----------------------------------------------------
// 1. INTERFACES
// ----------------------------------------------------
interface DailyTrafficData { 
  Date: string; 
  laneName: string; // ชื่อจริงจาก DB (เช่น "ประตู 1")
  laneKey: number;
  Vehicle_Count: number; 
  Red_Count: number; 
}

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

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

      // 1. ข้อมูลรายเลน (มีชื่อจริงมาแล้วจาก Backend)
      const mappedLanes = res.lanes.map((l: any) => ({
        Date: res.date,
        laneName: l.laneName, // ใช้ชื่อจาก DB โดยตรง
        laneKey: l.laneKey,
        Vehicle_Count: Number(l.vehicleCount || 0),
        Red_Count: Number(l.violationCount || 0) 
      }));
      setDailyTraffic(mappedLanes);

      // 2. Hourly Data (Backend จัดรูปแบบมาให้แล้ว ไม่ต้อง map keys เอง)
      setHourlyData(res.hourly);

      // 3. Weekly Data
      setWeeklyData(res.weekly);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ----------------------------------------------------
  // 3. GET DYNAMIC LANE NAMES (ดึงรายชื่อเลนที่มีอยู่จริง)
  // ----------------------------------------------------
  // ใช้สำหรับสร้างแท่งกราฟและคอลัมน์ตาราง
  const activeLaneNames = useMemo(() => {
    // ใช้ Set เพื่อกรองชื่อซ้ำ (กรณีข้อมูลดิบมีหลายแถว) และแปลงกลับเป็น Array
    return Array.from(new Set(dailyTraffic.map(d => d.laneName)));
  }, [dailyTraffic]);

  // ----------------------------------------------------
  // 4. STATS & CALCULATION
  // ----------------------------------------------------
  const totalVehicleCount = useMemo(() => dailyTraffic.reduce((sum, item) => sum + item.Vehicle_Count, 0), [dailyTraffic]);
  const totalRedViolations = useMemo(() => dailyTraffic.reduce((sum, item) => sum + item.Red_Count, 0), [dailyTraffic]);
  
  const busiestLaneInfo = useMemo(() => {
    if (dailyTraffic.length === 0) return { lane: 'N/A', count: 0 };
    const busiest = dailyTraffic.reduce((prev, curr) => (prev.Vehicle_Count > curr.Vehicle_Count) ? prev : curr);
    return { lane: busiest.laneName, count: busiest.Vehicle_Count };
  }, [dailyTraffic]);

  const dailyChangeInfo = useMemo(() => {
    if (weeklyData.length < 2) return { change: 0, percent: '0.0' };
    const todayTotal = totalVehicleCount;
    const yesterdayTotal = Number(weeklyData[weeklyData.length - 2]?.total || 0);
    
    if (yesterdayTotal === 0) return { change: 0, percent: '0.0' };
    const diff = todayTotal - yesterdayTotal;
    const percent = ((diff / yesterdayTotal) * 100).toFixed(1);
    return { change: diff, percent };
  }, [totalVehicleCount, weeklyData]);

  // ----------------------------------------------------
  // 5. RENDER HELPERS
  // ----------------------------------------------------
  const laneWeeklyColumns = useMemo(() => {
    const baseCols = [
      { 
        title: 'Day', dataIndex: 'dayName', key: 'dayName', fixed: 'left' as const,
        render: (text: string) => <Tag color={['Saturday', 'Sunday'].includes(text) ? 'blue' : 'volcano'} className='font-bold'>{text}</Tag>
      }
    ];

    // สร้างคอลัมน์ตามชื่อเลนจริงที่มี
    const dynamicCols = activeLaneNames.map((name) => {
      return {
        title: name,
        dataIndex: name, // ใช้ชื่อเลนเป็น Key ตรงๆ
        key: name,
        align: 'right' as const,
        render: (count: number) => (Number(count) || 0).toLocaleString()
      };
    });

    return [
      ...baseCols,
      ...dynamicCols,
      { 
        title: <Text strong className='text-amber-700'><CarOutlined /> Total</Text>,
        key: 'total', // ไม่ใช้ dataIndex แล้ว เพื่อบังคับใช้ render คำนวณเอง
        align: 'right' as const,
        render: (_: any, record: any) => {
          // ✅✅✅ แก้ไข: คำนวณ Total ใหม่สดๆ ที่ฝั่ง Frontend
          // โดยการวนลูปเอาค่าของทุกเลนใน record มาบวกกัน
          const calculatedTotal = activeLaneNames.reduce((sum, laneName) => {
            const val = Number(record[laneName]); // แปลงเป็นตัวเลข
            return sum + (isNaN(val) ? 0 : val);  // บวกเข้ากับผลรวม
          }, 0);

          return <Text strong className="text-amber-700">{calculatedTotal.toLocaleString()}</Text>;
        }
      }
    ];
  }, [activeLaneNames]);

  const ChangeDisplay = ({ change, percent }: { change: number, percent: string }) => {
    const isPositive = change > 0;
    const colorClass = isPositive ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';
    const Icon = isPositive ? ArrowUpOutlined : change < 0 ? ArrowDownOutlined : null;
    return (
      <div className="flex items-center gap-1">
        {Icon && <Icon className={`${colorClass} text-xl`} />}
        <span className={`text-3xl font-extrabold ${colorClass}`}>{Math.abs(change).toLocaleString()}</span>
        <span className={`text-lg font-semibold ${colorClass}`}>({percent}%)</span>
      </div>
    );
  };

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
        <Card className="shadow-md rounded-xl border border-gray-100">
          <Title level={5} className="text-gray-600 mb-4 flex items-center"><LineChartOutlined className="mr-2 text-blue-500" /> Executive Summary ({selectedDate.format('DD MMM YYYY')})</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12} lg={6}>
              <Card className="h-full shadow-sm border-l-4 border-blue-500">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Total Vehicle Count</p>
                <div className='flex justify-between items-center'>
                  <h3 className="text-4xl font-extrabold text-blue-600 mb-0">{totalVehicleCount.toLocaleString()}</h3>
                  <CarOutlined className="text-4xl text-blue-300 opacity-50" />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12} lg={6}>
              <Card className={classNames("h-full shadow-sm border-l-4", dailyChangeInfo.change >= 0 ? "border-green-500" : "border-red-500")}>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Daily Change (%)</p>
                <ChangeDisplay change={dailyChangeInfo.change} percent={dailyChangeInfo.percent} />
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card className="h-full shadow-sm border-l-4 border-amber-500">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Busiest Lane</p>
                <h3 className="text-2xl font-bold text-amber-600 mb-0 truncate">{busiestLaneInfo.lane}</h3>
                <p className="text-gray-500 text-sm">{busiestLaneInfo.count.toLocaleString()} Vehicles</p>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card className="h-full shadow-sm border-l-4 border-red-500">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Total Violations</p>
                <div className='flex justify-between items-center'>
                  <h3 className="text-4xl font-extrabold text-red-600 mb-0">{totalRedViolations.toLocaleString()}</h3>
                  <AlertOutlined className="text-4xl text-red-300 opacity-50" />
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* --- HOURLY TREND --- */}
        <Card className="shadow-lg rounded-xl" title={<span className="text-gray-700 font-semibold">Hourly Traffic Trend (Vehicle Count)</span>}>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={42} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }} 
                  contentStyle={{ borderRadius: '8px' }}
                  formatter={(value: any, name: string) => [Number(value).toLocaleString(), name]} 
                />
                <Legend iconType="circle" />
                
                {/* ✅ วนลูปสร้างกราฟแท่งตามชื่อเลนที่มีอยู่จริง */}
                {activeLaneNames.map((name, index) => (
                  <Bar 
                    key={name} 
                    dataKey={name} // ใช้ชื่อเลนเป็น DataKey ตรงๆ
                    name={name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    radius={[4, 4, 0, 0]} 
                    barSize={20} 
                  />
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
                  { 
                    title: 'Lane', 
                    dataIndex: 'laneName', 
                    key: 'laneName', 
                    render: (t) => <Tag color="processing" className="text-sm font-medium">{t}</Tag> 
                  },
                  { 
                    title: 'Vehicle Count', 
                    dataIndex: 'Vehicle_Count', 
                    key: 'Vehicle_Count', 
                    align: 'right', 
                    render: (v) => <Text strong className="text-blue-600 font-extrabold">{Number(v).toLocaleString()}</Text> 
                  }
                ]} 
                dataSource={dailyTraffic} pagination={false} rowKey="laneKey" size="middle" loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="shadow-lg rounded-xl" title={<span className="flex items-center gap-2"><AlertOutlined className="text-red-500" /> Red Light Violations</span>}>
              <Table 
                columns={[
                  { 
                    title: 'Lane', 
                    dataIndex: 'laneName', 
                    key: 'laneName', 
                    render: (t) => <Tag color="error" className="text-sm font-medium">{t}</Tag> 
                  },
                  { 
                    title: 'Violations', 
                    dataIndex: 'Red_Count', 
                    key: 'Red_Count', 
                    align: 'right', 
                    render: (v) => <Text type="danger" strong className="font-bold">{Number(v).toLocaleString()}</Text> 
                  }
                ]} 
                dataSource={dailyTraffic} pagination={false} rowKey="laneKey" size="middle" loading={loading}
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
            rowKey="dayName"
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