// src/views/dashboard/ProjectDashboard.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
    DatePicker,
    Table,
    Tag,
    Button,
    Typography,
    Card,
    Flex,
    Row,
    Col,
    message,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts'
import {
    SyncOutlined,
    CarOutlined,
    AlertOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    LineChartOutlined,
    TableOutlined,
} from '@ant-design/icons'
import classNames from 'classnames'

// Import Service (ตรวจสอบ path ให้ตรงกับโปรเจคจริง)
import {
    apiGetDashboardAnalytics,
    DashboardResponse,
} from '@/services/DashboardService'

dayjs.extend(isSameOrBefore)
const { Title, Text } = Typography

// ----------------------------------------------------
// 1. INTERFACES
// ----------------------------------------------------
interface DailyTrafficData {
    Date: string
    laneName: string // ชื่อจริงจาก DB (เช่น "ประตู 1")
    laneKey: number
    Vehicle_Count: number
    Violation_Count: number
}

const CHART_COLORS = [
    '#3b82f6',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
]

const ProjectDashboard = () => {
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
    const [loading, setLoading] = useState(false)
    const [dailyTraffic, setDailyTraffic] = useState<DailyTrafficData[]>([])
    const [hourlyData, setHourlyData] = useState<any[]>([])
    const [weeklyData, setWeeklyData] = useState<any[]>([])

    // ----------------------------------------------------
    // 2. DATA LOADING
    // ----------------------------------------------------
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const dateStr = selectedDate.format('YYYY-MM-DD')
            const res: DashboardResponse =
                await apiGetDashboardAnalytics(dateStr)

            // 1. ข้อมูลรายเลน (มีชื่อจริงมาแล้วจาก Backend)
            const mappedLanes = res.lanes.map((l: any) => ({
                Date: res.date,
                laneName: l.laneName, // ใช้ชื่อจาก DB โดยตรง
                laneKey: l.laneKey,
                Vehicle_Count: Number(l.vehicleCount || 0),
                Violation_Count: Number(l.violationCount || 0),
            }))
            setDailyTraffic(mappedLanes)

            // 2. Hourly Data
            setHourlyData(res.hourly)

            // 3. Weekly Data
            setWeeklyData(res.weekly)
        } catch (error: any) {
            console.error(error)
            message.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => {
        loadData()
    }, [loadData])

    // ----------------------------------------------------
    // 3. GET DYNAMIC LANE NAMES
    // ----------------------------------------------------
    const activeLaneNames = useMemo(() => {
        return Array.from(new Set(dailyTraffic.map((d) => d.laneName)))
    }, [dailyTraffic])

    // ----------------------------------------------------
    // 4. STATS & CALCULATION
    // ----------------------------------------------------
    const totalVehicleCount = useMemo(
        () => dailyTraffic.reduce((sum, item) => sum + item.Vehicle_Count, 0),
        [dailyTraffic],
    )
    const totalViolations = useMemo(
        () => dailyTraffic.reduce((sum, item) => sum + item.Violation_Count, 0),
        [dailyTraffic],
    )

    const busiestLaneInfo = useMemo(() => {
        if (dailyTraffic.length === 0 || totalVehicleCount === 0) {
            return { lane: 'N/A', count: 0 }
        }
        const busiest = dailyTraffic.reduce((prev, curr) =>
            prev.Vehicle_Count > curr.Vehicle_Count ? prev : curr,
        )
        return { lane: busiest.laneName, count: busiest.Vehicle_Count }
    }, [dailyTraffic, totalVehicleCount])

    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // ----------------------------------------------------
    // 5. RENDER HELPERS (Fixed Weekly Order: Sunday - Saturday)
    // ----------------------------------------------------
    
    // จัดเรียงข้อมูลรายสัปดาห์ให้เริ่มที่วันอาทิตย์
    const sortedWeeklyData = useMemo(() => {
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return [...weeklyData].sort((a, b) => 
            dayOrder.indexOf(a.dayName) - dayOrder.indexOf(b.dayName)
        )
    }, [weeklyData])

    const laneWeeklyColumns = useMemo(() => {
        const baseCols = [
            {
                title: 'Day',
                dataIndex: 'dayName',
                key: 'dayName',
                fixed: 'left' as const,
                render: (text: string) => (
                    <Tag
                        color={
                            ['Saturday', 'Sunday'].includes(text)
                                ? 'blue'
                                : 'volcano'
                        }
                        className="font-bold"
                    >
                        {text}
                    </Tag>
                ),
            },
        ]

        const dynamicCols = activeLaneNames.map((name) => {
            return {
                title: name,
                dataIndex: name,
                key: name,
                align: 'right' as const,
                render: (count: number) =>
                    (Number(count) || 0).toLocaleString(),
            }
        })

        return [
            ...baseCols,
            ...dynamicCols,
            {
                title: (
                    <Text strong className="text-amber-700">
                        <CarOutlined /> Total
                    </Text>
                ),
                key: 'total',
                align: 'right' as const,
                render: (_: any, record: any) => {
                    const calculatedTotal = activeLaneNames.reduce(
                        (sum, laneName) => {
                            const val = Number(record[laneName])
                            return sum + (isNaN(val) ? 0 : val)
                        },
                        0,
                    )
                    return (
                        <Text strong className="text-amber-700">
                            {calculatedTotal.toLocaleString()}
                        </Text>
                    )
                },
            },
        ]
    }, [activeLaneNames])

    return (
        <div
            style={{
                padding: '24px',
                backgroundColor: '#fff',
                minHeight: '100vh',
            }}
        >
            <Flex vertical gap="large">
                <Flex
                    justify="space-between"
                    align="middle"
                    wrap="wrap"
                    gap="small"
                >
                    <Title
                        level={4}
                        style={{ margin: 0 }}
                        className="text-gray-800"
                    >
                        Smart Traffic Operations Dashboard
                    </Title>
                    <Flex gap="middle">
                        <DatePicker
                            onChange={(d) => d && setSelectedDate(d)}
                            value={selectedDate}
                            allowClear={false}
                            style={{ minWidth: 150 }}
                        />
                        <Button
                            icon={<SyncOutlined />}
                            onClick={loadData}
                            loading={loading}
                            type="primary"
                        >
                            Refresh Data
                        </Button>
                    </Flex>
                </Flex>

                {/* --- EXECUTIVE SUMMARY --- */}
                <Card className="shadow-md rounded-xl border border-gray-100">
                    <Title
                        level={5}
                        className="text-gray-600 mb-4 flex items-center"
                    >
                        <LineChartOutlined className="mr-2 text-blue-500" />{' '}
                        Executive Summary ({selectedDate.format('DD MMM YYYY')})
                    </Title>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm border-l-4 border-blue-500">
                                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
                                    Total Vehicle Count
                                </p>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-4xl font-extrabold text-blue-600 mb-0">
                                        {totalVehicleCount.toLocaleString()}
                                    </h3>
                                    <CarOutlined className="text-4xl text-blue-300 opacity-50" />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm border-l-4 border-amber-500">
                                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
                                    Busiest Lane
                                </p>
                                <h3 className="text-2xl font-bold text-amber-600 mb-0 truncate">
                                    {busiestLaneInfo.lane}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {busiestLaneInfo.count.toLocaleString()}{' '}
                                    Vehicles
                                </p>
                            </Card>
                        </Col>

                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm border-l-4 border-red-500">
                                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
                                    Total Violations
                                </p>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-4xl font-extrabold text-red-600 mb-0">
                                        {totalViolations.toLocaleString()}
                                    </h3>
                                    <AlertOutlined className="text-4xl text-red-300 opacity-50" />
                                </div>
                            </Card>
                        </Col>
                        
                        <Col xs={24} md={12} lg={6}>
                            <Card className="h-full shadow-sm border-l-4 border-green-500 overflow-hidden relative">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col ">
                                        <span className="text-3xl mt-5 font-bold text-gray-800 leading-none">
                                            {currentTime.toLocaleDateString(
                                                'en-GB',
                                                { weekday: 'long' },
                                            )}
                                        </span>
                                        <span className="text-lg text-gray-700 font-medium mt-1">
                                            {currentTime.toLocaleDateString(
                                                'en-GB',
                                                {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                },
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-5xl font-bold mb-2 text-gray-700 mb-0 tracking-tighter leading-none">
                                            {currentTime.toLocaleTimeString(
                                                'en-GB',
                                                {
                                                    hour12: false,
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                },
                                            )}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* --- HOURLY TREND --- */}
                <Card
                    className="shadow-lg rounded-xl"
                    title={
                        <span className="text-gray-700 font-semibold">
                            Hourly Traffic Trend (Vehicle Count)
                        </span>
                    }
                >
                    <div style={{ height: 380 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e0e0e0"
                                />
                                <XAxis
                                    dataKey="hour"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={42}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f5f5f5' }}
                                    contentStyle={{ borderRadius: '8px' }}
                                    formatter={(value: any, name: any) => [
                                        Number(value).toLocaleString(),
                                        name,
                                    ]}
                                />
                                <Legend iconType="circle" />

                                {activeLaneNames.map((name, index) => (
                                    <Bar
                                        key={name}
                                        dataKey={name}
                                        name={name}
                                        fill={
                                            CHART_COLORS[
                                                index % CHART_COLORS.length
                                            ]
                                        }
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* --- TABLES SECTION --- */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card
                            className="shadow-lg rounded-xl"
                            title={
                                <span className="flex items-center gap-2">
                                    <CarOutlined className="text-blue-500" />{' '}
                                    Number of Vehicles
                                </span>
                            }
                        >
                            <Table
                                columns={[
                                    {
                                        title: 'Lane',
                                        dataIndex: 'laneName',
                                        key: 'laneName',
                                        render: (t) => (
                                            <Tag
                                                color="processing"
                                                className="text-sm font-medium"
                                            >
                                                {t}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: 'Vehicle Count',
                                        dataIndex: 'Vehicle_Count',
                                        key: 'Vehicle_Count',
                                        align: 'right',
                                        render: (v) => (
                                            <Text
                                                strong
                                                className="text-blue-600 font-extrabold"
                                            >
                                                {Number(v).toLocaleString()}
                                            </Text>
                                        ),
                                    },
                                ]}
                                dataSource={dailyTraffic}
                                pagination={false}
                                rowKey="laneKey"
                                size="middle"
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            className="shadow-lg rounded-xl"
                            title={
                                <span className="flex items-center gap-2">
                                    <AlertOutlined className="text-red-500" />{' '}
                                    Red Light Violations
                                </span>
                            }
                        >
                            <Table
                                columns={[
                                    {
                                        title: 'Lane',
                                        dataIndex: 'laneName',
                                        key: 'laneName',
                                        render: (t) => (
                                            <Tag
                                                color="error"
                                                className="text-sm font-medium"
                                            >
                                                {t}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: 'Violations Count',
                                        dataIndex: 'Violation_Count',
                                        key: 'Violation_Count',
                                        align: 'right',
                                        render: (v) => (
                                            <Text
                                                type="danger"
                                                strong
                                                className="font-bold"
                                            >
                                                {Number(v).toLocaleString()}
                                            </Text>
                                        ),
                                    },
                                ]}
                                dataSource={dailyTraffic}
                                pagination={false}
                                rowKey="laneKey"
                                size="middle"
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* --- THIS WEEK REPORT (FIXED ORDER) --- */}
                <Card
                    className="shadow-lg rounded-xl"
                    title={
                        <span className="flex items-center gap-2">
                            <TableOutlined className="text-blue-500" />
                            Week Report
                        </span>
                    }
                >
                    <Table
                        columns={laneWeeklyColumns}
                        dataSource={sortedWeeklyData}
                        pagination={false}
                        rowKey="dayName"
                        size="middle"
                        scroll={{ x: 1000 }}
                        loading={loading}
                    />
                </Card>
            </Flex>
        </div>
    )
}

export default ProjectDashboard