import React, { useCallback, useEffect, useState } from 'react'
import {
    Card,
    Flex,
    Form,
    Image,
    Spin,
    Table,
    Tag,
    Typography,
    message,
    Popconfirm, // ✅ เพิ่ม
    Button      // ✅ เพิ่ม
} from 'antd'
import { DeleteOutlined } from '@ant-design/icons' // ✅ เพิ่ม
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/en'

import {
    apiGetImagesByDateAndLane,
    apiGetIntersectionData,
    apiGetLogRecords,
    apiDeleteLogRecord, // ✅ เพิ่ม Import function ลบ
    ImageObject,
    IntersectionData,
    LogRecord,
} from '@/services/ImageService'

import DatePickerFormItem from '@/components/shared/DatePickerItem'

dayjs.extend(customParseFormat)
dayjs.locale('en')

const { Title, Text } = Typography

// 🟢 กำหนดลำดับกล่องโดยยึดจาก Intersection_ID (1-4) ตามภาพ DB
const FIXED_INTERSECTIONS = [1, 2, 3, 4] as const

/**
 * Logic ค้นหารูปที่เวลาใกล้เคียงที่สุด (±10 วินาที)
 */
function pickClosestImageByTime(
    images: ImageObject[],
    target: Dayjs | null,
    thresholdSeconds: number = 10,
): ImageObject | null {
    if (!images || images.length === 0 || !target || !target.isValid())
        return null

    let best: ImageObject | null = null
    let bestDiffMs = Number.MAX_SAFE_INTEGER

    for (const img of images) {
        const imgTime = dayjs(img.timestamp)
        if (!imgTime.isValid()) continue

        const diffMs = Math.abs(imgTime.diff(target, 'millisecond'))
        const diffSec = diffMs / 1000

        if (diffSec <= thresholdSeconds) {
            if (diffMs < bestDiffMs) {
                bestDiffMs = diffMs
                best = img
            }
        }
    }
    return best
}

const PictureLog = () => {
    const [form] = Form.useForm()

    // States แบบเดียวกับ TrafficViolations
    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)
    const [logRows, setLogRows] = useState<LogRecord[]>([])
    const [intersectionInfo, setIntersectionInfo] = useState<
        IntersectionData[]
    >([])
    const [selectedRow, setSelectedRow] = useState<LogRecord | null>(null)
    const [laneImages, setLaneImages] = useState<(ImageObject | null)[]>([
        null,
        null,
        null,
        null,
    ])

    // Loading & Pagination States
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [loadingImages, setLoadingImages] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

    // 1. Fetch Log Records
    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true)
        try {
            const data = await apiGetLogRecords('Lane_1')
            setLogRows(data)
        } catch (error) {
            message.error('Failed to fetch logs')
            console.error(error)
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // 2. Fetch Intersection Info
    useEffect(() => {
        const fetchIntersectionInfo = async () => {
            try {
                const response: any = await apiGetIntersectionData()
                if (response && Array.isArray(response.data)) {
                    setIntersectionInfo(response.data)
                } else if (Array.isArray(response)) {
                    setIntersectionInfo(response)
                }
            } catch (error) {
                setIntersectionInfo([])
            }
        }
        fetchIntersectionInfo()
    }, [])

    // 3. Load Images by Intersection_ID
    const loadImagesForRow = useCallback(async (row: LogRecord) => {
        setSelectedRow(row)
        setLaneImages([null, null, null, null])
        setLoadingImages(true)

        try {
            const target = dayjs(
                `${row.date} ${row.time}`,
                'YYYY-MM-DD HH:mm:ss',
            )

            const results = await Promise.all(
                FIXED_INTERSECTIONS.map(async (id) => {
                    const laneApiName = `Lane_${id}`
                    try {
                        const res = await apiGetImagesByDateAndLane(
                            row.date,
                            laneApiName,
                        )
                        return { intersectionId: id, images: res }
                    } catch (e) {
                        return { intersectionId: id, images: [] }
                    }
                }),
            )

            const picked = FIXED_INTERSECTIONS.map((id) => {
                const found = results.find((x) => x.intersectionId === id)
                const images = found?.images ?? []

                const exactTimeStr = row.time.replace(/:/g, '-')
                const exactMatch = images.find((img) =>
                    img.title.includes(exactTimeStr),
                )
                if (exactMatch) return exactMatch

                return pickClosestImageByTime(images, target, 10)
            })

            setLaneImages(picked)
        } catch (err: any) {
            console.error('Failed to load images:', err)
        } finally {
            setLoadingImages(false)
        }
    }, [])

    // ✅ เพิ่มฟังก์ชันสำหรับลบข้อมูล
    const handleDelete = async (record: LogRecord) => {
        try {
            // เรียก API ลบไฟล์ (ส่งชื่อไฟล์และชื่อเลนหลัก Lane_1 ไป)
            // หมายเหตุ: ต้องแน่ใจว่าได้เพิ่ม apiDeleteLogRecord ใน ImageService.ts แล้ว
            await apiDeleteLogRecord(record.key, 'Lane_1');
            
            message.success('Deleted successfully');

            // อัปเดตตารางโดยเอาแถวที่ลบออก (ไม่ต้องโหลดใหม่)
            setLogRows((prev) => prev.filter((item) => item.key !== record.key));
            
            // ถ้าแถวที่ลบคือแถวที่กำลังเลือกดูรูปอยู่ ให้เคลียร์รูปทิ้ง
            if (selectedRow?.key === record.key) {
                setSelectedRow(null);
                setLaneImages([null, null, null, null]);
            }

        } catch (error) {
            console.error(error);
            message.error('Failed to delete record');
        }
    };

    const displayRows = logRows.filter((row) => {
        // if (row.time < '05:00:00' || row.time > '18:00:00') return false
        if (!startDate && !endDate) return true
        const d = dayjs(row.date, 'YYYY-MM-DD', true)
        if (!d.isValid()) return false
        let ok = true
        if (startDate)
            ok =
                ok &&
                (d.isSame(startDate, 'day') || d.isAfter(startDate, 'day'))
        if (endDate)
            ok = ok && (d.isSame(endDate, 'day') || d.isBefore(endDate, 'day'))
        return ok
    })

    const columns: ColumnsType<LogRecord> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (d) => dayjs(d).format('DD MMMM YYYY'),
        },
        { title: 'Time', dataIndex: 'time', key: 'time' },
        // ✅ เพิ่ม Column Action สำหรับปุ่มลบ
        {
            title: 'Action',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <div onClick={(e) => e.stopPropagation()}> {/* ป้องกันไม่ให้คลิกแล้วไป trigger onRow */}
                    <Popconfirm
                        title="Delete this record?"
                        description="This will permanently delete the image."
                        onConfirm={() => handleDelete(record)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button 
                            danger 
                            type="text" 
                            icon={<DeleteOutlined />} 
                        />
                    </Popconfirm>
                </div>
            ),
        },
    ]

    return (
        <div
            style={{ padding: 24, backgroundColor: '#fff', minHeight: '100vh' }}
        >
            <Flex vertical gap="large">
                <Form form={form} layout="inline" style={{ width: '100%' }}>
                    <Flex
                        justify="space-between"
                        align="middle"
                        className="mb-2 p-4 w-full border-b border-gray-200"
                    >
                        <Title level={4} style={{ margin: 0, color: '#555' }}>
                            Traffic Log
                        </Title>
                        <Flex gap="middle" align="middle" wrap>
                            <DatePickerFormItem.From
                                label="Start Date"
                                endDateName="endDate"
                                datePickerProps={{
                                    onChange: (v) => setStartDate(v ?? null),
                                }}
                            />
                            <DatePickerFormItem.To
                                label="End Date"
                                startDateName="startDate"
                                datePickerProps={{
                                    onChange: (v) => setEndDate(v ?? null),
                                }}
                            />
                        </Flex>
                    </Flex>
                </Form>

                {/* --- Preview Section (Sticky) --- */}
                <div
                    className="sticky top-0 z-20 pt-2 pb-4"
                    style={{ backgroundColor: '#fff' }}
                >
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <Title
                                level={5}
                                style={{ margin: 0, color: '#666' }}
                            >
                                Selected Event Preview
                            </Title>
                            <div className="text-sm text-gray-500">
                                {selectedRow
                                    ? `${dayjs(selectedRow.date).format('DD MMM YYYY')} - ${selectedRow.time}`
                                    : 'Select a row to view images'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {FIXED_INTERSECTIONS.map((id, idx) => {
                                const info = intersectionInfo.find(
                                    (d) => d.Intersection_ID === id,
                                )
                                const img = laneImages[idx]

                                return (
                                    <div key={id} className="relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <Tag
                                                color="blue"
                                                style={{
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    fontSize: 16,
                                                }}
                                            >
                                                {info?.Name ||
                                                    (intersectionInfo.length ===
                                                    0
                                                        ? 'Loading...'
                                                        : '')}
                                            </Tag>
                                        </div>

                                        <div className="w-full aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                            {loadingImages ? (
                                                <Spin />
                                            ) : img ? (
                                                <Image
                                                    src={img.url}
                                                    alt={img.title}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                    preview
                                                />
                                            ) : (
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#999',
                                                    }}
                                                >
                                                    No matching image
                                                </Text>
                                            )}
                                        </div>
                                        {img && (
                                            <div className="mt-2 text-xs text-gray-400 text-center truncate px-2">
                                                {img.title}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>

                {/* --- Records Table (โครงสร้างเดียวกับ TrafficViolations) --- */}
                <Card className="shadow-sm" style={{ borderRadius: 8 }}>
                    <Title
                        level={5}
                        style={{ marginBottom: 16, color: '#666' }}
                    >
                        Records
                    </Title>
                    <Table<LogRecord>
                        dataSource={displayRows}
                        columns={columns}
                        loading={loadingLogs}
                        rowKey="key"
                        onRow={(record) => ({
                            onClick: () => {
                                if (selectedRow?.key === record.key) {
                                    setSelectedRow(null)
                                    setLaneImages([null, null, null, null])
                                } else {
                                    loadImagesForRow(record)
                                }
                            },
                        })}
                        rowClassName={(record) =>
                            record.key === selectedRow?.key
                                ? 'bg-blue-50 cursor-pointer'
                                : 'cursor-pointer'
                        }
                        pagination={{
                            ...pagination,
                            onChange: (page, pageSize) =>
                                setPagination({ current: page, pageSize }),
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                    />
                </Card>
            </Flex>
        </div>
    )
}

export default PictureLog