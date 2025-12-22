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
    Row,
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
const TrafficViolations = () => {
    const [form] = Form.useForm()
    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)

    return (
        <div>
            <Form form={form} layout="inline" style={{ width: '100%' }}>
                {/* แถวหัว: ซ้ายเป็น Title, ขวาเป็นช่วงวันที่ */}
                <Flex
                    style={{ width: '100%' }}
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap="middle"
                >
                    <Title level={4} style={{ margin: 0 }}>
                        Traffic Log
                    </Title>

                    {/* กลุ่มวันที่ชิดขวา + เว้นระยะห่าง */}
                    <Flex align="center" justify="flex-end" gap="middle" style={{ marginLeft: 'auto' }}>
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
        </div>
    )
}
export default TrafficViolations
