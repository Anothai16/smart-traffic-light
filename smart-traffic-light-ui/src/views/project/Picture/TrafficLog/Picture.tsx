// src/views/PictureLog.tsx

import React, { useCallback, useEffect, useState } from 'react'
import { Card, Flex, Form, Image, Spin, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/en'

import {
    apiGetImagesByDateAndLane,
    apiGetIntersectionData,
    apiGetLogRecords,
    ImageObject,
    IntersectionData,
    LogRecord,
} from '@/services/ImageService'

import DatePickerFormItem from '@/components/shared/DatePickerItem'

dayjs.extend(customParseFormat)
dayjs.locale('en')

const { Title, Text } = Typography

// 🟢 กำหนดให้หน้าจอมี 4 ช่องเสมอ (Sequence 1-4)
const FIXED_LANES = [1, 2, 3, 4] as const

/**
 * Finds the closest image within a ±10-second window.
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
    const [modeLogPagination, setModeLogPagination] = useState({
        current: 1,
        pageSize: 50,
    })

    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)

    const [logRows, setLogRows] = useState<LogRecord[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)

    // เก็บข้อมูล Config ของเลนที่ดึงจาก DB
    // 🟢 Initialize เป็น Array ว่างเสมอ เพื่อกัน Error .find is not a function
    const [intersectionInfo, setIntersectionInfo] = useState<
        IntersectionData[]
    >([])

    const [selectedRow, setSelectedRow] = useState<LogRecord | null>(null)

    // เก็บรูปภาพที่จะแสดงใน 4 ช่อง
    const [laneImages, setLaneImages] = useState<(ImageObject | null)[]>([
        null,
        null,
        null,
        null,
    ])
    const [loadingImages, setLoadingImages] = useState(false)

    // 1. ดึง Log Records
    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true)
        try {
            const data = await apiGetLogRecords('Lane_1')
            setLogRows(data)
        } catch (error) {
            console.error('Failed to fetch logs', error)
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // 2. ดึงข้อมูลชื่อเลนจาก DB (Intersection Data)
    useEffect(() => {
        const fetchIntersectionInfo = async () => {
            try {
                // ใช้ any เพื่อรับค่า response ดิบๆ มาตรวจสอบก่อน
                const response: any = await apiGetIntersectionData()

                // 🟢 แก้ไข Logic การแกะข้อมูล เพื่อป้องกัน Error
                if (response && Array.isArray(response.data)) {
                    // กรณี API ส่งมาแบบ { success: true, data: [...] }
                    setIntersectionInfo(response.data)
                } else if (Array.isArray(response)) {
                    // กรณี API ส่งมาแบบ [...]
                    setIntersectionInfo(response)
                } else {
                    console.warn(
                        'Unknown data format from apiGetIntersectionData:',
                        response,
                    )
                    setIntersectionInfo([]) // Fallback เป็น array ว่าง
                }
            } catch (error) {
                console.error('Error fetching intersection info:', error)
                setIntersectionInfo([])
            }
        }
        fetchIntersectionInfo()
    }, [])

    const displayRows = logRows.filter((row) => {
        if (row.time < '05:00:00' || row.time > '18:00:00') {
            return false
        }

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

    const handleModeLogTableChange = (page: number, pageSize: number) => {
        setModeLogPagination({ current: page, pageSize: pageSize })
    }

    const clearPreview = useCallback(() => {
        setSelectedRow(null)
        setLaneImages([null, null, null, null])
        setLoadingImages(false)
    }, [])

    const loadImagesForRow = useCallback(async (row: LogRecord) => {
        setSelectedRow(row)
        setLaneImages([null, null, null, null])
        setLoadingImages(true)

        try {
            const targetStr = `${row.date} ${row.time}`
            const target = dayjs(targetStr, 'YYYY-MM-DD HH:mm:ss')

            const results = await Promise.all(
                FIXED_LANES.map(async (laneSeq) => {
                    const laneApiName = `Lane_${laneSeq}`
                    try {
                        const res = await apiGetImagesByDateAndLane(
                            row.date,
                            laneApiName,
                        )
                        return { laneSequence: laneSeq, images: res }
                    } catch (e) {
                        return { laneSequence: laneSeq, images: [] }
                    }
                }),
            )

            const picked = FIXED_LANES.map((laneSeq) => {
                const found = results.find((x) => x.laneSequence === laneSeq)
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

    const columns: ColumnsType<LogRecord> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 200,
            render: (d: string) => dayjs(d).format('DD MMMM YYYY'),
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 150,
        },
    ]

    const onRow: TableProps<LogRecord>['onRow'] = (record) => ({
        onClick: () => {
            if (selectedRow?.key === record.key) {
                clearPreview()
                return
            }
            loadImagesForRow(record)
        },
    })

    const rowClassName: TableProps<LogRecord>['rowClassName'] = (record) => {
        return record.key === selectedRow?.key
            ? 'cursor-pointer bg-gray-200'
            : 'cursor-pointer hover:bg-gray-50'
    }

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
                                    placeholder: 'Select start date',
                                    onChange: (v) => setStartDate(v ?? null),
                                }}
                            />
                            <DatePickerFormItem.To
                                label="End Date"
                                startDateName="startDate"
                                datePickerProps={{
                                    placeholder: 'Select end date',
                                    onChange: (v) => setEndDate(v ?? null),
                                }}
                            />
                        </Flex>
                    </Flex>
                </Form>

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
                            {FIXED_LANES.map((laneSeq, idx) => {
                                // 🟢 เพิ่มการตรวจสอบว่า intersectionInfo เป็น Array จริงหรือไม่ก่อนเรียก .find
                                const info = Array.isArray(intersectionInfo)
                                    ? intersectionInfo.find(
                                          (d) => d.Lane_Sequence === laneSeq,
                                      )
                                    : undefined

                                const img = laneImages[idx]

                                return (
                                    <div key={laneSeq} className="relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <Tag
                                                color="blue"
                                                style={{
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    fontSize: 16,
                                                }}
                                            >
                                                {/* ใช้ Optional Chaining (?) ป้องกันจอขาว */}
                                                {info?.Name
                                                    ? info.Name
                                                    : intersectionInfo.length ===
                                                        0
                                                      ? 'Loading...'
                                                      : ''}
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

                <Card className="shadow-lg rounded-lg border border-gray-200">
                    <Title
                        level={5}
                        style={{ marginBottom: 16, color: '#666' }}
                    >
                        Records
                    </Title>
                    <Table<LogRecord>
                        rowKey="key"
                        columns={columns}
                        dataSource={displayRows}
                        loading={loadingLogs}
                        pagination={{
                            ...modeLogPagination,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            onChange: handleModeLogTableChange,
                        }}
                        onRow={onRow}
                        rowClassName={rowClassName}
                    />
                </Card>
            </Flex>
        </div>
    )
}

export default PictureLog
