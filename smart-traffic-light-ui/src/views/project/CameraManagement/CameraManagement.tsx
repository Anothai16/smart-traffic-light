import React, { useState } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Typography,
    Flex,
    message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';

const { Title } = Typography;
const { confirm } = Modal;

// ข้อมูลจำลองสำหรับรายการกล้อง
interface Camera {
    id: string;
    name: string;
    location: string;
    status: 'Online' | 'Offline';
    ipAddress: string;
}

const mockCameras: Camera[] = [
    {
        id: 'cam-001',
        name: 'กล้องแยกที่ 1 (ทิศเหนือ)',
        location: 'แยกพหลโยธิน',
        status: 'Online',
        ipAddress: '192.168.1.101',
    },
    {
        id: 'cam-002',
        name: 'กล้องแยกที่ 2 (ทิศตะวันออก)',
        location: 'แยกรามอินทรา',
        status: 'Online',
        ipAddress: '192.168.1.102',
    },
    {
        id: 'cam-003',
        name: 'กล้องแยกที่ 3 (ทิศใต้)',
        location: 'แยกเกษตรนวมินทร์',
        status: 'Offline',
        ipAddress: '192.168.1.103',
    },
    {
        id: 'cam-004',
        name: 'กล้องแยกที่ 4 (ทิศตะวันตก)',
        location: 'แยกพระราม 9',
        status: 'Online',
        ipAddress: '192.168.1.104',
    },
];

const CameraManagement: React.FC = () => {
    const [cameras, setCameras] = useState<Camera[]>(mockCameras);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
    const [form] = Form.useForm();

    const handleAdd = () => {
        setEditingCamera(null);
        setIsModalVisible(true);
        form.resetFields();
    };

    const handleEdit = (record: Camera) => {
        setEditingCamera(record);
        setIsModalVisible(true);
        form.setFieldsValue(record);
    };

    const handleDelete = (record: Camera) => {
        confirm({
            title: `คุณต้องการลบกล้อง "${record.name}" ใช่ไหม?`,
            icon: <ExclamationCircleOutlined />,
            content: 'การดำเนินการนี้ไม่สามารถยกเลิกได้',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk() {
                setCameras(cameras.filter((cam) => cam.id !== record.id));
                message.success(`ลบกล้อง "${record.name}" เรียบร้อยแล้ว`);
            },
        });
    };

    // ✅ เพิ่มฟังก์ชันนี้เข้าไป
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleModalSubmit = () => {
        form.validateFields()
            .then((values) => {
                if (editingCamera) {
                    // แก้ไขกล้องที่มีอยู่
                    setCameras(
                        cameras.map((cam) => (cam.id === editingCamera.id ? { ...cam, ...values } : cam))
                    );
                    message.success(`แก้ไขกล้อง "${values.name}" เรียบร้อยแล้ว`);
                } else {
                    // เพิ่มกล้องใหม่
                    const newCamera: Camera = {
                        ...values,
                        id: `cam-${Math.random().toString(36).substr(2, 9)}`,
                        status: 'Online', // สมมติว่ากล้องใหม่จะเริ่มต้นด้วยสถานะ Online
                    };
                    setCameras([...cameras, newCamera]);
                    message.success(`เพิ่มกล้อง "${values.name}" เรียบร้อยแล้ว`);
                }
                setIsModalVisible(false);
                form.resetFields();
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    const columns: TableProps<Camera>['columns'] = [
        {
            title: 'ชื่อกล้อง',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'ตำแหน่ง',
            dataIndex: 'location',
            key: 'location',
            filters: [
                { text: 'แยกพหลโยธิน', value: 'แยกพหลโยธิน' },
                { text: 'แยกรามอินทรา', value: 'แยกรามอินทรา' },
                { text: 'แยกเกษตรนวมินทร์', value: 'แยกเกษตรนวมินทร์' },
            ],
            onFilter: (value, record) => record.location.indexOf(value as string) === 0,
        },
        {
            title: 'IP Address',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            render: (status: 'Online' | 'Offline') => (
                <Tag color={status === 'Online' ? 'green' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Online', value: 'Online' },
                { text: 'Offline', value: 'Offline' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'จัดการ',
            key: 'action',
            render: (_, record) => (
                <Flex gap="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        แก้ไข
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        ลบ
                    </Button>
                </Flex>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Title level={2}>การจัดการกล้อง</Title>
            <Flex justify="flex-end" className="mb-4">
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    เพิ่มกล้องใหม่
                </Button>
            </Flex>
            <Card className="shadow-lg rounded-lg">
                <Table
                    columns={columns}
                    dataSource={cameras}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingCamera ? 'แก้ไขข้อมูลกล้อง' : 'เพิ่มกล้องใหม่'}
                visible={isModalVisible}
                onOk={handleModalSubmit}
                onCancel={handleCancel}
                okText={editingCamera ? 'บันทึก' : 'เพิ่ม'}
                cancelText="ยกเลิก"
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="camera_form"
                >
                    <Form.Item
                        name="name"
                        label="ชื่อกล้อง"
                        rules={[{ required: true, message: 'กรุณาใส่ชื่อกล้อง!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="location"
                        label="ตำแหน่งที่ตั้ง"
                        rules={[{ required: true, message: 'กรุณาใส่ตำแหน่งที่ตั้ง!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="ipAddress"
                        label="IP Address"
                        rules={[{ required: true, message: 'กรุณาใส่ IP Address!' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CameraManagement;