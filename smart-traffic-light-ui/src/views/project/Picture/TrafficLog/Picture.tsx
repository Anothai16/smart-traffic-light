// src/views/PictureLog.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Card,
    Flex,
    Form,
    Image,
    Spin,
    Table,
    Tag,
    Typography,
} from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/th'

import { apiGetImagesByDateAndLane, ImageObject } from '@/services/ImageService'
import DatePickerFormItem from '@/components/shared/DatePickerItem'

dayjs.extend(customParseFormat)
dayjs.locale('th')

const { Title } = Typography

const LANE_OPTIONS = ['Lane_1', 'Lane_2', 'Lane_3', 'Lane_4'] as const
type Lane = (typeof LANE_OPTIONS)[number]

type LogRow = {
    key: string
    date: string // YYYY-MM-DD
    time: string // HH:mm
}

function pickClosestImageByTime(
    images: ImageObject[],
    target: Dayjs | null,
): ImageObject | null {
    if (!images || images.length === 0) return null
    if (!target || !target.isValid()) return images[0] ?? null

    let best: ImageObject | null = null
    let bestDiff = Number.MAX_SAFE_INTEGER

    for (const img of images) {
        const t = dayjs(img.timestamp)
        if (!t.isValid()) continue
        const diff = Math.abs(t.diff(target, 'millisecond'))
        if (diff < bestDiff) {
            bestDiff = diff
            best = img
        }
    }

    return best ?? images[0] ?? null
}

const PictureLog = () => {
    const [form] = Form.useForm()
    const [settingModePagination, setSettingModePagination] = useState({
        current: 1,
        pageSize: 10,
    })

    // คง logic ช่วงวันที่ไว้เหมือนเดิม
    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)
    const handleSettingModeTableChange = (page: number, pageSize: number) => {
        setSettingModePagination({ current: page, pageSize: pageSize })
    }
    // ✅ MOCK ตารางล่าง: date + time (ไม่มีวินาที)
    const mockRows: LogRow[] = useMemo(() => {
        const times = ['08:00', '12:00', '16:00', '20:00']
        const daysBack = 10
        const base = dayjs()

        const rows: LogRow[] = []
        for (let i = 0; i <= daysBack; i++) {
            const d = base.subtract(i, 'day').format('YYYY-MM-DD')
            for (const t of times) {
                rows.push({
                    key: `${d}_${t}`,
                    date: d,
                    time: t,
                })
            }
        }

        return rows.sort((a, b) =>
            dayjs(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm', true).diff(
                dayjs(`${a.date} ${a.time}`, 'YYYY-MM-DD HH:mm', true),
            ),
        )
    }, [])

    // filter ด้วยช่วง startDate - endDate (คงไว้)
    const displayRows = useMemo(() => {
        if (!startDate && !endDate) return mockRows

        return mockRows.filter((row) => {
            const d = dayjs(row.date, 'YYYY-MM-DD', true)
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
    }, [mockRows, startDate, endDate])

    // เลือก/ยกเลิกด้วย Checkbox (เลือกได้ทีละ 1 รายการ)
    const [selectedRow, setSelectedRow] = useState<LogRow | null>(null)
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

    const [laneImages, setLaneImages] = useState<(ImageObject | null)[]>([
        null,
        null,
        null,
        null,
    ])
    const [loadingImages, setLoadingImages] = useState(false)
    const [errorImages, setErrorImages] = useState<string | null>(null)

    const clearPreview = useCallback(() => {
        setSelectedRow(null)
        setSelectedKeys([])
        setLaneImages([null, null, null, null])
        setErrorImages(null)
        setLoadingImages(false)
    }, [])

    const loadImagesForRow = useCallback(async (row: LogRow) => {
        setSelectedRow(row)
        setLaneImages([null, null, null, null])
        setErrorImages(null)
        setLoadingImages(true)

        try {
            const target = dayjs(
                `${row.date} ${row.time}`,
                'YYYY-MM-DD HH:mm',
                true,
            )

            const results = await Promise.all(
                LANE_OPTIONS.map(async (lane) => {
                    const res = await apiGetImagesByDateAndLane(row.date, lane)
                    return { lane, images: res }
                }),
            )

            const picked = LANE_OPTIONS.map((lane) => {
                const found = results.find((x) => x.lane === lane)
                return pickClosestImageByTime(found?.images ?? [], target)
            })

            setLaneImages(picked)
        } catch (err: any) {
            setErrorImages(err?.message || 'Failed to load images.')
        } finally {
            setLoadingImages(false)
        }
    }, [])

    // ถ้า filter แล้วรายการที่เลือกหายไปจากตาราง -> เคลียร์
    useEffect(() => {
        if (!selectedRow) return
        const stillExists = displayRows.some((r) => r.key === selectedRow.key)
        if (!stillExists) clearPreview()
    }, [displayRows, selectedRow, clearPreview])

    // ✅ ซ่อน checkbox เลือกทั้งหมดด้วย hideSelectAll
    const rowSelection: TableProps<LogRow>['rowSelection'] = {
        selectedRowKeys: selectedKeys,
        hideSelectAll: true,
        onSelect: (record, selected) => {
            if (selected) {
                setSelectedKeys([record.key])
                loadImagesForRow(record)
            } else {
                clearPreview()
            }
        },
        getCheckboxProps: (record) => ({
            // ถ้าเลือกอยู่ 1 อันแล้ว ให้ disable อันอื่น (กันเลือกหลายอันพร้อมกัน)
            disabled:
                selectedKeys.length === 1 && record.key !== selectedKeys[0],
        }),
    }

    const columns: ColumnsType<LogRow> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 260,
            render: (d: string) =>
                dayjs(d, 'YYYY-MM-DD', true).format('DD MMMM YYYY'),
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 180,
        },
    ]

    return (
        <div
            style={{ padding: 24, backgroundColor: '#fff', minHeight: '100vh' }}
        >
            <Flex vertical gap="large">
                {/* Header + Date Range Filter */}
                <Form form={form} layout="inline" style={{ width: '100%' }}>
                    <Flex
                        justify="space-between"
                        align="middle"
                        className="mb-2 p-4 w-full border-b border-gray-200"
                    >
                        <Title level={4} style={{ margin: 0 }}>
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

                {/* 4 ช่องด้านบน */}
                <Card className="shadow-xl rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <Title level={5} style={{ margin: 0 }}>
                            Selected Images Preview (Lane 1–4)
                        </Title>

                        <div className="text-sm text-gray-600">
                            {selectedRow ? (
                                <>
                                    {dayjs(
                                        selectedRow.date,
                                        'YYYY-MM-DD',
                                        true,
                                    ).format('DD MMMM YYYY')}{' '}
                                    {selectedRow.time}
                                </>
                            ) : null}
                        </div>
                    </div>

                    {errorImages && (
                        <Alert
                            className="mb-4"
                            type="error"
                            message="Error"
                            description={errorImages}
                            showIcon
                        />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {LANE_OPTIONS.map((lane: Lane, idx: number) => {
                            const img = laneImages[idx]
                            return (
                                <div key={lane} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <Tag color="blue">{lane}</Tag>
                                    </div>

                                    <div className="w-full aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
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
                                            <div className="text-sm text-gray-400">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {img && (
                                        <div className="mt-2">
                                            <div className="text-xs text-gray-700 truncate">
                                                {img.title}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {dayjs(img.timestamp).format(
                                                    'HH:mm',
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </Card>

                {/* ตารางล่าง */}
                <Card className="shadow-xl rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <Title level={5} style={{ margin: 0 }}>
                            Log Records
                        </Title>
                    </div>

                    {displayRows.length === 0 ? (
                        <Alert
                            type="info"
                            showIcon
                            message="ไม่พบข้อมูล"
                            description="ไม่พบรายการในช่วงวันที่ที่เลือก"
                        />
                    ) : (
                        <Table<LogRow>
                            rowKey="key"
                            columns={columns}
                            dataSource={displayRows}
                            rowSelection={rowSelection}
                            pagination={{
                                ...settingModePagination,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                                onChange: handleSettingModeTableChange,
                            }}
                        />
                    )}
                </Card>
            </Flex>
        </div>
    )
}

export default PictureLog
