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
    Popconfirm,
    Button,
} from 'antd'
import { DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/en'

import {
    apiGetImagesByDateAndLane,
    apiGetIntersectionData,
    apiGetLogRecords,
    apiDeleteLogRecord,
    ImageObject,
    IntersectionData,
    LogRecord,
} from '@/services/ImageService'

import DatePickerFormItem from '@/components/shared/DatePickerItem'

dayjs.extend(customParseFormat)
dayjs.locale('en')

const { Title, Text } = Typography

const FIXED_INTERSECTIONS = [1, 2, 3, 4] as const

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

    const [loadingLogs, setLoadingLogs] = useState(false)
    const [loadingImages, setLoadingImages] = useState(false)
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true)
        try {
            const data = await apiGetLogRecords('Lane_1')
            setLogRows(data)
        } catch (error) {
            message.error('Failed to fetch logs')
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    // handleRefresh: ล้างรูปที่พรีวิวและแถวที่เลือก แต่ "ไม่ล้าง" startDate/endDate
    const handleRefresh = async () => {
        setLoading(true)
        await fetchLogs()
        setSelectedRow(null)
        setLaneImages([null, null, null, null])
        setLoading(false)
        message.success('Data refreshed')
    }

    useEffect(() => {
        fetchLogs()
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
    }, [])

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

    const handleDelete = async (record: LogRecord) => {
        try {
            await apiDeleteLogRecord(record.key, 'Lane_1')
            message.success('Deleted successfully')
            setLogRows((prev) => prev.filter((item) => item.key !== record.key))
            if (selectedRow?.key === record.key) {
                setSelectedRow(null)
                setLaneImages([null, null, null, null])
            }
        } catch (error) {
            message.error('Failed to delete record')
        }
    }

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

    const columns: ColumnsType<LogRecord> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (d) => dayjs(d).format('DD MMMM YYYY'),
        },
        { title: 'Time', dataIndex: 'time', key: 'time' },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Popconfirm
                        title="Delete this record?"
                        description="This will permanently delete the image."
                        onConfirm={() => handleDelete(record)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger type="text" icon={<DeleteOutlined />} />
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
                        <Title level={4} style={{ margin: 0, color: '#555' }}>
                            Traffic Log
                        </Title>
                        <Flex gap="middle" align="middle" wrap>
                            <DatePickerFormItem.From
                                label="Start Date"
                                endDateName="endDate"
                                datePickerProps={{
                                    onChange: (v) => setStartDate(v ?? null),
                                    needConfirm: false,
                                }}
                            />
                            <DatePickerFormItem.To
                                label="End Date"
                                startDateName="startDate"
                                datePickerProps={{
                                    onChange: (v) => setEndDate(v ?? null),
                                    needConfirm: false,
                                }}
                            />
                            <Button
                                type="primary"
                                icon={<SyncOutlined />}
                                onClick={handleRefresh}
                                loading={loading}
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
                            borderTop: '4px solid #1890ff',
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
                                <span className="text-lg">Log Preview</span>
                            </Title>
                            <div className="text-lg text-gray-500">
                                {selectedRow
                                    ? `${dayjs(selectedRow.date).format('DD MMM YYYY')} - ${selectedRow.time}`
                                    : 'Select a row to view images'}
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
                                                color="blue"
                                                style={{
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {info?.Name ||
                                                    (intersectionInfo.length ===
                                                    0
                                                        ? 'Loading...'
                                                        : `Lane ${id}`)}
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
                                                    preview
                                                    onError={(e) => {
                                                        const target =
                                                            e.currentTarget as HTMLImageElement
                                                        if (
                                                            !target.src.includes(
                                                                'retry=',
                                                            )
                                                        ) {
                                                            setTimeout(() => {
                                                                target.src = `${img.url}?retry=${new Date().getTime()}`
                                                            }, 1000)
                                                        }
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

                <Card className="shadow-sm" style={{ borderRadius: 8 }}>
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ marginBottom: 16 }}
                    >
                        <Title level={5} style={{ margin: 0, color: '#666' }}>
                            <span className="text-lg">Records</span>
                        </Title>
                        <span className="text-lg text-gray-700 font-normal">
                            Note: Images are deleted every Sunday at 12.00 AM
                        </span>
                    </Flex>

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
