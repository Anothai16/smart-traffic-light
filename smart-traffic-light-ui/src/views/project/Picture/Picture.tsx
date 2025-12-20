// src/views/PictureLog.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Card,
    Flex,
    Button,
    Typography,
    Spin,
    Alert,
    Image,
    Tag,
    Tooltip,
    Select,
    Form,
} from 'antd'
import { FolderFilled, LeftOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/th'

import {
    apiGetAvailableImageDates,
    apiGetImagesByDateAndLane,
    ImageObject,
} from '@/services/ImageService'

import DatePickerFormItem from '@/components/shared/DatePickerItem'

dayjs.locale('th')

const { Title } = Typography

const LANE_OPTIONS = [
    'Lane_1',
    'Lane_2',
    'Lane_3',
    'Lane_4',
]

const PictureLog = () => {
    const [form] = Form.useForm()

    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedLane, setSelectedLane] = useState<string>(LANE_OPTIONS[0])
    const [availableDates, setAvailableDates] = useState<string[]>([])
    const [images, setImages] = useState<ImageObject[]>([])

    // เก็บช่วงวันที่เอาไว้กรอง
    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // -----------------------------------------
    // โหลดวันที่ของ Lane
    // -----------------------------------------
    const loadAvailableDates = useCallback(async (lane: string) => {
        setLoading(true)
        setError(null)
        setAvailableDates([])

        try {
            const dates = await apiGetAvailableImageDates(lane)
            setAvailableDates(dates)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch available dates.')
        } finally {
            setLoading(false)
        }
    }, [])

    // เมื่อเปลี่ยน Lane
    useEffect(() => {
        setSelectedDate(null)
        setImages([])
        setStartDate(null)
        setEndDate(null)
        form.resetFields(['startDate', 'endDate'])

        loadAvailableDates(selectedLane)
    }, [selectedLane, loadAvailableDates, form])

    // -----------------------------------------
    // กรองวันที่ด้วยช่วง startDate - endDate
    // -----------------------------------------
    const displayDates = useMemo(() => {
        const sorted = availableDates
            .slice()
            .sort((a, b) => dayjs(b).diff(dayjs(a)))

        if (!startDate && !endDate) return sorted

        return sorted.filter((dateStr) => {
            const d = dayjs(dateStr)
            if (!d.isValid()) return false

            let ok = true

            if (startDate) {
                ok =
                    ok &&
                    (d.isSame(startDate, 'day') || d.isAfter(startDate, 'day'))
            }

            if (endDate) {
                ok =
                    ok &&
                    (d.isSame(endDate, 'day') || d.isBefore(endDate, 'day'))
            }

            return ok
        })
    }, [availableDates, startDate, endDate])

    // -----------------------------------------
    // โหลดรูปภาพของวันที่
    // -----------------------------------------
    const handleDateClick = async (date: string) => {
        setSelectedDate(date)
        setLoading(true)
        setError(null)
        setImages([])

        try {
            const res = await apiGetImagesByDateAndLane(date, selectedLane)
            setImages(res)
        } catch (err: any) {
            setError(err.message || 'Failed to load images.')
        } finally {
            setLoading(false)
        }
    }

    // -----------------------------------------
    // UI: แสดงรูปภาพในวันที่เลือก
    // -----------------------------------------
    if (selectedDate) {
        return (
            // ✅ ใช้ div wrapper เหมือนหน้าอื่น เพื่อล็อค Layout ไม่ให้ sidebar ขยับ
            <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
                <Flex vertical gap="large">
                    <Flex
                        justify="space-between"
                        align="middle"
                        className="mb-6 p-4 border-b border-gray-200"
                    >
                        <Button
                            icon={<LeftOutlined />}
                            onClick={() => setSelectedDate(null)}
                        >
                            Back to Dates ({selectedLane})
                        </Button>

                        <Title level={4} style={{ margin: 0 }}>
                            Images for {dayjs(selectedDate).format('DD MMMM YYYY')}{' '}
                            ({selectedLane})
                        </Title>

                        <div />
                    </Flex>
                    
                    <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                        <Title level={5} style={{ marginTop: 0 }}>Available Dates for {selectedLane}</Title>
                        
                        {loading ? (
                            <Flex
                                justify="center"
                                align="middle"
                                style={{ height: 300 }}
                            >
                                <Spin size="large" tip="Loading Images..." />
                            </Flex>
                        ) : error ? (
                            <Alert
                                type="error"
                                message="Error"
                                description={error}
                                showIcon
                            />
                        ) : images.length === 0 ? (
                            <Alert
                                type="info"
                                message="ไม่พบข้อมูล"
                                description={`ไม่พบรูปภาพในวันที่ ${selectedDate} สำหรับ ${selectedLane}`}
                                showIcon
                            />
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {images.map((img) => (
                                    <Card
                                        key={img.id}
                                        hoverable
                                        className="p-1 shadow-md rounded-lg"
                                        cover={
                                            <Image
                                                src={img.url}
                                                alt={img.title}
                                                style={{
                                                    height: 180,
                                                    objectFit: 'cover',
                                                    borderRadius: '4px 4px 0 0',
                                                }}
                                            />
                                        }
                                    >
                                        <Card.Meta
                                            title={
                                                <Tooltip title={img.title}>
                                                    <div className="truncate font-semibold text-sm">
                                                        {img.title}
                                                    </div>
                                                </Tooltip>
                                            }
                                            description={
                                                <Flex vertical gap={4}>
                                                    <Tag color="blue">
                                                        {img.lane}
                                                    </Tag>
                                                    <div className="text-xs text-gray-500">
                                                        {dayjs(
                                                            img.timestamp,
                                                        ).format('HH:mm:ss')}
                                                    </div>
                                                </Flex>
                                            }
                                        />
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Card>
                </Flex>
            </div>
        )
    }

    // -----------------------------------------
    // UI: หน้าเลือกวันที่
    // -----------------------------------------
    return (
        // ✅ ใช้ div wrapper เหมือนหน้าอื่น เพื่อล็อค Layout ไม่ให้ sidebar ขยับ
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            <Flex vertical gap="large">
                <Form form={form} layout="inline" style={{ width: '100%' }}>
                    <Flex
                        justify="space-between"
                        align="middle"
                        className="mb-6 p-4 w-full"
                    >
                        <Title level={4} style={{ margin: 0 }}>
                            Traffic Log
                        </Title>

                        <Flex gap="middle" align="middle">
                            {/* เลือก Lane */}
                            <Select
                                style={{ width: 200 }}
                                value={selectedLane}
                                onChange={setSelectedLane}
                                options={LANE_OPTIONS.map((l) => ({
                                    label: l,
                                    value: l,
                                }))}
                            />

                            <DatePickerFormItem.From
                                label="วันเริ่มต้น"
                                endDateName="endDate"
                                datePickerProps={{
                                    placeholder: 'เลือกวันเริ่มต้น',
                                    onChange: (v) => setStartDate(v),
                                }}
                            />

                            <DatePickerFormItem.To
                                label="วันสิ้นสุด"
                                startDateName="startDate"
                                datePickerProps={{
                                    placeholder: 'เลือกวันสิ้นสุด',
                                    onChange: (v) => setEndDate(v),
                                }}
                            />
                        </Flex>
                    </Flex>
                </Form>

                <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                    <Title level={5}>Available Dates for {selectedLane}</Title>

                    {loading ? (
                        <Flex
                            justify="center"
                            align="middle"
                            style={{ height: 250 }}
                        >
                            <Spin size="large" tip="Loading Folders..." />
                        </Flex>
                    ) : error ? (
                        <Alert
                            type="error"
                            message="Error"
                            description={error}
                            showIcon
                        />
                    ) : displayDates.length === 0 ? (
                        <Alert
                            type="info"
                            showIcon
                            message="ไม่พบข้อมูล"
                            description={
                                startDate || endDate
                                    ? `ไม่พบ Folder รูปภาพในช่วงวันที่ที่เลือก สำหรับ ${selectedLane}`
                                    : `ไม่พบ Folder รูปภาพใดๆ สำหรับ ${selectedLane}`
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {displayDates.map((date) => (
                                <Card
                                    key={date}
                                    hoverable
                                    onClick={() => handleDateClick(date)}
                                    className="flex flex-col items-center justify-center p-6 text-center rounded-lg 
            shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-300 cursor-pointer"
                                >
                                    <FolderFilled
                                        style={{ fontSize: 48, color: '#facc15' }}
                                    />
                                    <div className="mt-4 font-bold text-lg text-gray-700">
                                        {dayjs(date).format('YYYY.MM.DD')}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>
            </Flex>
        </div>
    )
}

export default PictureLog