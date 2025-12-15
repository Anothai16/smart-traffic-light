// src/views/traffic/IntersectionManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Tag,
    Typography,
    Flex,
    message,
    InputNumber
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { IntersectionManagementService } from '@/services/IntersectionManagementService';

const { Title } = Typography;
const { confirm } = Modal;

// Interface สำหรับข้อมูลใน Table (รวมข้อมูลจริงจาก DB + Mock Status)
interface IntersectionTableItem {
    Intersection_ID: number;
    Name: string;
    Location: string;
    IP_Address: string;
    Intersection_Number: number;
    status: 'Online' | 'Offline'; // Mock field
}

const IntersectionManagement: React.FC = () => {
    const [intersections, setIntersections] = useState<IntersectionTableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingIntersection, setEditingIntersection] = useState<IntersectionTableItem | null>(null);
    const [form] = Form.useForm();

    // 1. ฟังก์ชันดึงข้อมูลจาก API (Read)
    const fetchIntersections = useCallback(async () => {
        setLoading(true);
        try {
            const response = await IntersectionManagementService.getAllIntersections();
            if (response.data && response.data.data) {
                // แปลงข้อมูลจาก API และ Mock Status เข้าไป
                const mappedData: IntersectionTableItem[] = response.data.data.map((item: any) => ({
                    Intersection_ID: item.Intersection_ID,
                    Name: item.Name,
                    Location: item.Location,
                    IP_Address: item.IP_Address,
                    Intersection_Number: item.Intersection_Number,
                    status: Math.random() > 0.2 ? 'Online' : 'Offline', // ✅ Mock Status ตรงนี้
                }));
                setIntersections(mappedData);
            }
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลทางแยกได้');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIntersections();
    }, [fetchIntersections]);

    const handleAdd = () => {
        setEditingIntersection(null);
        setIsModalVisible(true);
        form.resetFields();
    };

    const handleEdit = (record: IntersectionTableItem) => {
        setEditingIntersection(record);
        setIsModalVisible(true);
        form.setFieldsValue(record);
    };

    // 2. ฟังก์ชันลบข้อมูล (Delete)
    const handleDelete = (record: IntersectionTableItem) => {
        confirm({
            title: `คุณต้องการลบแยก "${record.Name}" ใช่ไหม?`,
            icon: <ExclamationCircleOutlined />,
            content: 'การดำเนินการนี้ไม่สามารถยกเลิกได้',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await IntersectionManagementService.deleteIntersection(record.Intersection_ID);
                    message.success(`ลบแยก "${record.Name}" เรียบร้อยแล้ว`);
                    fetchIntersections(); // Refresh Table
                } catch (error) {
                    message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
                }
            },
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    // 3. ฟังก์ชันบันทึกข้อมูล (Create / Update)
    const handleModalSubmit = () => {
        form.validateFields()
            .then(async (values) => {
                try {
                    // จัดเตรียม Payload ให้ตรงกับ API
                    const payload = {
                        Name: values.Name,
                        Location: values.Location,
                        IP_Address: values.IP_Address,
                        Intersection_Number: Number(values.Intersection_Number)
                    };

                    if (editingIntersection) {
                        // --- แก้ไข (Update) ---
                        await IntersectionManagementService.updateIntersection(
                            editingIntersection.Intersection_ID,
                            payload
                        );
                        message.success(`แก้ไขข้อมูล "${values.Name}" เรียบร้อยแล้ว`);
                    } else {
                        // --- เพิ่มใหม่ (Create) ---
                        await IntersectionManagementService.createIntersection(payload);
                        message.success(`เพิ่มข้อมูล "${values.Name}" เรียบร้อยแล้ว`);
                    }

                    setIsModalVisible(false);
                    form.resetFields();
                    fetchIntersections(); // Refresh Table
                } catch (error) {
                    console.error(error);
                    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    // ✅ ปรับปรุง Column: ย้ายหมายเลขแยกไปซ้ายสุด และกำหนด Width/Style กันตกบรรทัด
    const columns: TableProps<IntersectionTableItem>['columns'] = [
        {
            title: 'หมายเลขแยก', // 🟢 ย้ายมาเป็นลำดับที่ 1
            dataIndex: 'Intersection_Number',
            key: 'Intersection_Number',
            width: 120, // กำหนดความกว้างคงที่
            align: 'center',
            sorter: (a, b) => a.Intersection_Number - b.Intersection_Number,
        },
        {
            title: 'ชื่อแยก',
            dataIndex: 'Name',
            key: 'Name',
            width: 200, // กำหนดความกว้างให้พอดี
            sorter: (a, b) => a.Name.localeCompare(b.Name),
            // ใส่ style เพื่อบังคับไม่ให้ตัดบรรทัด
            render: (text) => <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div>,
        },
        {
            title: 'ตำแหน่ง',
            dataIndex: 'Location',
            key: 'Location',
            width: 250, // ให้พื้นที่เยอะหน่อยสำหรับที่อยู่ยาวๆ
            render: (text) => <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div>,
        },
        {
            title: 'IP Address',
            dataIndex: 'IP_Address',
            key: 'IP_Address',
            width: 150,
            render: (text) => <div style={{ whiteSpace: 'nowrap' }}>{text}</div>,
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: 'Online' | 'Offline') => (
                <Tag color={status === 'Online' ? 'green' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'จัดการ',
            key: 'action',
            width: 200,
            fixed: 'right', // (Optional) ตรึงปุ่มจัดการไว้ขวาสุดถ้าต้องการ
            render: (_, record) => (
                <Flex gap="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        Delete
                    </Button>
                </Flex>
            ),
        },
    ];

    return (
        // ✅ FIX: ใช้ Wrapper div แบบเดียวกับหน้าอื่นๆ เพื่อล็อค Layout
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            <Flex vertical gap="large">
                <Flex justify="space-between" align="middle" className="mb-2">
                    {/* ✅ FIX: ใช้ Title level 4 และ style เดิม */}
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Intersection Management
                    </Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        Add new Intersection
                    </Button>
                </Flex>

                <Card className="shadow-lg rounded-lg border border-gray-200">
                    <Table
                        columns={columns}
                        dataSource={intersections}
                        rowKey="Intersection_ID"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        // ✅ เพิ่ม scroll fixed pixel เพื่อป้องกันการดัน Layout
                        scroll={{ x: 1000 }} 
                    />
                </Card>

                <Modal
                    title={editingIntersection ? 'Edit intersection detail' : 'Add new intersection'}
                    open={isModalVisible} // ใช้ open แทน visible ใน antd เวอร์ชั่นใหม่ (แต่ถ้าเวอร์ชั่นเก่าใช้ visible ก็แก้เป็น visible ได้ครับ)
                    onOk={handleModalSubmit}
                    onCancel={handleCancel}
                    okText={editingIntersection ? 'Save' : 'Add'}
                    cancelText="Cancel"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        name="intersection_form"
                        initialValues={{ Intersection_Number: 1 }}
                    >
                        <Form.Item
                            name="Name"
                            label="Intersection Name"
                            rules={[{ required: true, message: 'Please insert intersection name!' }]}
                        >
                            <Input />
                        </Form.Item>
                        
                        <Form.Item
                            name="Intersection_Number"
                            label="Intersection Number"
                            rules={[{ required: true, message: 'Please insert number!' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={1} />
                        </Form.Item>

                        <Form.Item
                            name="Location"
                            label="Location"
                            rules={[{ required: true, message: 'Please insert location!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="IP_Address"
                            label="IP Address"
                            rules={[
                                { required: true, message: 'Please insert IP Address!' },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Form>
                </Modal>
            </Flex>
        </div>
    );
};

export default IntersectionManagement;