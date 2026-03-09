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
    message,
    Button,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/en'
import { SyncOutlined } from '@ant-design/icons'
import {
    apiGetViolationLogRecords,
    apiGetViolationImagesByDateAndLane,
    ViolationLogRecord,
    ImageViolationObject,
} from '@/services/ImageViolationService'

import {
    apiGetIntersectionData,
    IntersectionData,
} from '@/services/ImageService'

import DatePickerFormItem from '@/components/shared/DatePickerItem'

dayjs.extend(customParseFormat)
dayjs.locale('en')

const { Title, Text } = Typography

// ลำดับกล่องแสดงผลตาม Intersection_ID (1-4)
const FIXED_INTERSECTIONS = [1, 2, 3, 4] as const

/**
 * ค้นหารูปที่เวลาใกล้เคียงที่สุด (บวกลบ 10 วินาที)
 */
function pickClosestImageByTime(
    images: ImageViolationObject[],
    target: Dayjs | null,
    thresholdSeconds: number = 10,
): ImageViolationObject | null {
    if (!images || images.length === 0 || !target || !target.isValid())
        return null

    let best: ImageViolationObject | null = null
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

    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)

    const [logRows, setLogRows] = useState<ViolationLogRecord[]>([])
    const [intersectionInfo, setIntersectionInfo] = useState<
        IntersectionData[]
    >([])
    const [selectedRow, setSelectedRow] = useState<ViolationLogRecord | null>(
        null,
    )
    const [laneImages, setLaneImages] = useState<
        (ImageViolationObject | null)[]
    >([null, null, null, null])

    const [loadingLogs, setLoadingLogs] = useState(false)
    const [loadingImages, setLoadingImages] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

    const [loading, setLoading] = useState(false)

    /**
     * ดึงข้อมูลรูปจาก Backend
     */
    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true)
        try {
            // เรียก API ที่จัดการ Group ข้อมูลมาให้แล้วจาก Backend
            const data = await apiGetViolationLogRecords()
            setLogRows(data)
        } catch (error) {
            message.error('Failed to fetch violation logs')
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            await fetchLogs()
            // ล้างค่าแถวที่เลือกและรูปภาพในกล่องพรีวิว
            setSelectedRow(null)
            setLaneImages([null, null, null, null])
            message.success('Data updated successfully')
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [fetchLogs])

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
        fetchLogs()
    }, [fetchLogs])

    /**
     * โหลดรูปภาพจากทุกเลนเมื่อคลิกเลือกแถว
     */
    const loadImagesForRow = useCallback(async (row: ViolationLogRecord) => {
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
                    const laneParam = `Lane_${id}`
                    try {
                        const res = await apiGetViolationImagesByDateAndLane(
                            row.date,
                            laneParam,
                        )
                        return { id, images: res }
                    } catch (e) {
                        return { id, images: [] }
                    }
                }),
            )

            const picked = FIXED_INTERSECTIONS.map((id) => {
                const found = results.find((r) => r.id === id)
                const images = found?.images ?? []
                return pickClosestImageByTime(images, target, 10)
            })

            setLaneImages(picked)
        } catch (err) {
            console.error('Workflow error:', err)
        } finally {
            setLoadingImages(false)
        }
    }, [])

    const displayRows = logRows.filter((row) => {
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

    const columns: ColumnsType<ViolationLogRecord> = [
        {
            title: 'Date ',
            dataIndex: 'date',
            key: 'date',
            render: (date, record) => (
                <Flex vertical>
                    <Text strong>{dayjs(date).format('DD MMMM YYYY')}</Text>
                    {record.lanes && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Detected in:{' '}
                            <Tag
                                color="blue"
                                style={{ margin: 0, fontSize: '10px' }}
                            >
                                {record.lanes}
                            </Tag>
                        </Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 120,
        },
    ]

    return (
        <div
            style={{ padding: 24, backgroundColor: '#fff', minHeight: '100vh' }}
        >
            <Flex vertical gap="large">
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
                            Traffic Violations{' '}
                        </Title>
                        <Flex gap="middle" align="center">
                            <DatePickerFormItem.From
                                label="Start Date"
                                endDateName="endDate"
                                datePickerProps={{
                                    placeholder: 'Select start date',
                                    showTime: false,
                                    format: 'YYYY-MM-DD',
                                    onChange: (v) => setStartDate(v ?? null),
                                }}
                            />
                            <DatePickerFormItem.To
                                label="End Date"
                                startDateName="startDate"
                                datePickerProps={{
                                    placeholder: 'Select end date',
                                    showTime: false,
                                    format: 'YYYY-MM-DD',
                                    onChange: (v) => setEndDate(v ?? null),
                                }}
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
                </Form>

                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: '#fff',
                        paddingTop: 8,
                    }}
                >
                    <Card
                        className="shadow-md"
                        style={{
                            borderRadius: 8,
                            borderTop: '4px solid #ff4d4f',
                        }}
                    >
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
                            <div className="text-sm text-gray-500">
                                {selectedRow
                                    ? `${dayjs(selectedRow.date).format('DD MMM YYYY')} - ${selectedRow.time}`
                                    : 'Select a record to view images'}
                            </div>
                        </Flex>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: 16,
                            }}
                        >
                            {FIXED_INTERSECTIONS.map((id, idx) => {
                                const info = intersectionInfo.find(
                                    (d) => d.Intersection_ID === id,
                                )
                                const img = laneImages[idx]

                                return (
                                    <div key={id}>
                                        <div style={{ marginBottom: 8 }}>
                                            <Tag
                                                color="error"
                                                style={{
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {info?.Name || `Lane ${id}`}
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

                <Card className="shadow-sm" style={{ borderRadius: 8 }}>
                    <Title
                        level={5}
                        style={{ marginBottom: 16, color: '#666' }}
                    >
                        Records
                    </Title>
                    <Table<ViolationLogRecord>
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
                                ? 'bg-red-50 cursor-pointer'
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
