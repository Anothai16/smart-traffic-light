import React, { useState } from 'react'
import {
    Card,
    Flex,
    Typography,
    Image,
    Form,
    Row,
    Col,
    Divider
} from 'antd'
import { ClockCircleOutlined, CarOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/en'

import DatePickerFormItem from '@/components/shared/DatePickerItem'

// --- Mock Data Section ---
const generateMockImages = (lane) => {
    const images = [];
    const count = lane === 2 ? 2 : 4; 
    for (let i = 1; i <= count; i++) {
        images.push({
            id: `${lane}-${i}`,
            lane: lane,
            timestamp: dayjs().subtract(i * 15, 'minute').format('HH:mm'),
            date: dayjs().format('DD/MM/YYYY'),
            url: `https://placehold.co/600x400/292929/FFF?text=Lane+${lane}+-+Img+${i}`
        });
    }
    return images;
};

const MOCK_DATA = [
    ...generateMockImages(1),
    ...generateMockImages(2),
    ...generateMockImages(3),
    ...generateMockImages(4),
];

dayjs.locale('en')

const { Title, Text } = Typography

const TrafficViolations = () => {
    const [form] = Form.useForm()
    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [endDate, setEndDate] = useState<Dayjs | null>(null)

    const getImagesByLane = (laneId) => {
        return MOCK_DATA.filter(img => img.lane === laneId);
    };

    const ImageGrid = ({ laneId }) => {
        const images = getImagesByLane(laneId);

        if (images.length === 0) {
            return (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                    <Text type="secondary">No images found for this lane.</Text>
                </div>
            );
        }

        return (
            <Row gutter={[16, 16]}>
                {images.map((item) => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item.id}>
                        <Card 
                            hoverable
                            size="small"
                            style={{ borderRadius: 8, overflow: 'hidden' }}
                            bodyStyle={{ padding: 12 }}
                            cover={
                                <Image
                                    alt={`Lane ${item.lane}`}
                                    src={item.url}
                                    style={{ objectFit: 'cover', height: 180 }}
                                />
                            }
                        >
                            <Flex vertical gap={4}>
                                <Flex align="center" gap="small" style={{ color: '#555', marginTop: 4 }}>
                                    <ClockCircleOutlined style={{ fontSize: 12 }}/> 
                                    <Text style={{ fontSize: 13 }}>{item.timestamp}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>({item.date})</Text>
                                </Flex>
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <div style={{ padding: 24 }}>
            {/* --- Filter Section --- */}
            <Form form={form} layout="inline" style={{ width: '100%', marginBottom: 16 }}>
                <Flex style={{ width: '100%' }} justify="space-between" align="center" wrap="wrap" gap="middle">
                    
                    <Title level={4} style={{ margin: 0 }}>
                        Red Light Violations
                    </Title>

                    <Flex align="center" justify="flex-end" gap="middle" style={{ marginLeft: 'auto' }}>
                        <DatePickerFormItem.From
                            label="Start Date"
                            endDateName="endDate"
                            datePickerProps={{ 
                                placeholder: 'Select start date',
                                format: 'DD/MM/YYYY',
                                showTime: false, // ✅ เพิ่มบรรทัดนี้: ปิดการแสดงเวลา
                                onChange: setStartDate 
                            }}
                        />
                        <DatePickerFormItem.To
                            label="End Date"
                            startDateName="startDate"
                            datePickerProps={{ 
                                placeholder: 'Select end date', 
                                format: 'DD/MM/YYYY',
                                showTime: false, // ✅ เพิ่มบรรทัดนี้: ปิดการแสดงเวลา
                                onChange: setEndDate 
                            }}
                        />
                    </Flex>
                </Flex>
            </Form>

            {/* --- Images Gallery Section --- */}
            <Card>
                <Flex vertical gap="large">
                    {[1, 2, 3, 4].map((lane, index) => (
                        <div key={lane}>
                            <Flex align="center" gap="small" style={{ marginBottom: 16 }}>
                                <CarOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                <Title level={4} style={{ margin: 0 }}>Lane {lane}</Title>
                            </Flex>

                            <ImageGrid laneId={lane} />

                            {index < 3 && <Divider style={{ margin: '32px 0' }} />}
                        </div>
                    ))}
                </Flex>
            </Card>
        </div>
    )
}

export default TrafficViolations