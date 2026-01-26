import React, { useCallback, useEffect, useState } from 'react'
import {
    Card,
    Flex,
    Typography,
    Image,
    Form,
    Table,
    Tag,
    Spin,
    Divider,
    message,
} from 'antd'
import { CarOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/en'

// นำเข้า Service เดิมและเตรียมที่สำหรับ API ใหม่
import {
    apiGetIntersectionData, // ใช้ตัวเดิมดึงชื่อเลน
    // apiGetNewViolationImages, // สมมติว่าเป็นชื่อ API ใหม่ที่จะนำมาใส่
    IntersectionData,
    ImageObject,
} from '@/services/ImageService'

import DatePickerFormItem from '@/components/shared/DatePickerItem'
import { ColumnsType } from 'antd/es/table'

// --- Interfaces ---
interface LogRecord {
    key: string
    date: string
    time: string
    // เพิ่ม field อื่นๆ ที่ API ส่งมา เช่น violation_type, plate_number
}

dayjs.extend(customParseFormat)
dayjs.locale('en')

const { Title, Text } = Typography
const FIXED_LANES = [1, 2, 3, 4] as const

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

const TrafficViolations = () => {
    const [form] = Form.useForm()

    // States
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

    // Loading States
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [loadingImages, setLoadingImages] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

    // --- 1. Fetch Log Records (รายการการกระทำผิด) ---
    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true)
        try {
            // TODO: [API PART] ใส่ API สำหรับดึงรายการ Traffic Violations ตรงนี้
            // const response = await apiGetTrafficViolationLogs()
            // setLogRows(response.data)

            // Mock ข้อมูลเพื่อทดสอบ UI
            const mockLogs: LogRecord[] = [
                { key: '1', date: '2024-05-20', time: '10:30:00' },
                { key: '2', date: '2024-05-20', time: '11:15:20' },
            ]
            setLogRows(mockLogs)
        } catch (error) {
            message.error('Failed to fetch logs')
            console.error(error)
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    // --- 2. Fetch Intersection Info (ดึงชื่อเลน - ใช้ API เดิม) ---
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
                console.error('Error fetching intersection info:', error)
                setIntersectionInfo([])
            }
        }
        fetchIntersectionInfo()
        fetchLogs()
    }, [fetchLogs])

    // --- 3. Load Images (ดึงรูปภาพจาก API ใหม่) ---
    const loadImagesForRow = useCallback(async (row: LogRecord) => {
        setSelectedRow(row)
        setLaneImages([null, null, null, null])
        setLoadingImages(true)

        try {
            const target = dayjs(
                `${row.date} ${row.time}`,
                'YYYY-MM-DD HH:mm:ss',
            )

            // วนลูปดึงรูปทั้ง 4 เลนจาก API ตัวใหม่
            const results = await Promise.all(
                FIXED_LANES.map(async (laneSeq) => {
                    const laneApiName = `Lane_${laneSeq}`
                    try {
                        // 🟢 [API PART] เปลี่ยนเป็น API เส้นใหม่ที่คุณทำตรงนี้
                        // ตัวอย่าง: const res = await apiGetNewImagesByViolation(row.date, laneApiName)
                        // return { laneSequence: laneSeq, images: res }

                        return { laneSequence: laneSeq, images: [] }
                    } catch (e) {
                        return { laneSequence: laneSeq, images: [] }
                    }
                }),
            )

            const picked = FIXED_LANES.map((laneSeq) => {
                const found = results.find((r) => r.laneSequence === laneSeq)
                const images = found?.images ?? []

                // ค้นหารูปที่เวลาใกล้เคียงที่สุด
                return pickClosestImageByTime(images, target, 10)
            })

            setLaneImages(picked)
        } catch (err) {
            console.error('Failed to load images:', err)
        } finally {
            setLoadingImages(false)
        }
    }, [])

    // Filter Logic สำหรับวันที่
    const displayRows = logRows.filter((row) => {
        if (!startDate && !endDate) return true
        const d = dayjs(row.date, 'YYYY-MM-DD')
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
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
        },
    ]

    return (
        <div
            style={{ padding: 24, backgroundColor: '#fff', minHeight: '100vh' }}
        >
            <Flex vertical gap="large">
                {/* --- Filter Section --- */}
                <Form form={form} layout="inline">
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{
                            width: '100%',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: 16,
                        }}
                    >
                        <Title level={4} style={{ margin: 0 }}>
                            Red Light Violations
                        </Title>
                        <Flex gap="middle" align="center">
                            <DatePickerFormItem.From
                                label="Start Date"
                                endDateName="endDate"
                                datePickerProps={{ onChange: setStartDate }}
                            />
                            <DatePickerFormItem.To
                                label="End Date"
                                startDateName="startDate"
                                datePickerProps={{ onChange: setEndDate }}
                            />
                        </Flex>
                    </Flex>
                </Form>

                {/* --- Preview Section (Sticky) --- */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: '#fff',
                        paddingTop: 8,
                    }}
                >
                    <Card className="shadow-md" style={{ borderRadius: 8 }}>
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginBottom: 16 }}
                        >
                            <Title
                                level={5}
                                style={{ margin: 0, color: '#666' }}
                            >
                                Violation Preview
                            </Title>
                            <Text type="secondary">
                                {selectedRow
                                    ? `${dayjs(selectedRow.date).format('DD MMM YYYY')} - ${selectedRow.time}`
                                    : 'Select a record to view images'}
                            </Text>
                        </Flex>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: 16,
                            }}
                        >
                            {FIXED_LANES.map((laneSeq, idx) => {
                                const info = intersectionInfo.find(
                                    (d) => d.Lane_Sequence === laneSeq,
                                )
                                const img = laneImages[idx]

                                return (
                                    <div key={laneSeq}>
                                        <div style={{ marginBottom: 8 }}>
                                            <Tag
                                                color="blue"
                                                style={{
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    fontSize: 16,
                                                }}
                                            >
                                                {info?.Name ||
                                                    `Lane ${laneSeq}`}
                                            </Tag>
                                        </div>
                                        <div
                                            style={{
                                                aspectRatio: '16/9',
                                                background: '#f5f5f5',
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                border: '1px solid #e8e8e8',
                                            }}
                                        >
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
                                                />
                                            ) : (
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    No image matched
                                                </Text>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>

                {/* --- Records Table --- */}
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

export default TrafficViolations
