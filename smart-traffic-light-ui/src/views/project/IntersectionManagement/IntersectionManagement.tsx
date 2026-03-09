// src/views/traffic/IntersectionManagement.tsx

import React, { useState, useEffect, useCallback } from 'react'
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
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { IntersectionManagementService } from '@/services/IntersectionManagementService'

const { Title } = Typography
const { confirm } = Modal

// Interface สำหรับข้อมูลใน Table
interface IntersectionTableItem {
    Intersection_ID: number
    Name: string
    Location: string
    IP_Address: string
    Lane_Sequence: number
    status: string
}

const IntersectionManagement: React.FC = () => {
    const [intersections, setIntersections] = useState<IntersectionTableItem[]>(
        [],
    )
    const [loading, setLoading] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingIntersection, setEditingIntersection] =
        useState<IntersectionTableItem | null>(null)
    const [form] = Form.useForm()

    // 1. ฟังก์ชันดึงข้อมูลจาก API
    const fetchIntersections = useCallback(async () => {
        try {
            const response =
                await IntersectionManagementService.getAllIntersections()
            if (response.data && response.data.data) {
                const mappedData: IntersectionTableItem[] =
                    response.data.data.map((item: any) => ({
                        Intersection_ID: item.Intersection_ID,
                        Name: item.Name,
                        Location: item.Location,
                        IP_Address: item.IP_Address,
                        Lane_Sequence: item.Lane_Sequence || 1,
                        status: item.Status || 'Offline',
                    }))
                setIntersections(mappedData)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    //  Auto Refresh ทุก 5 วินาที
    useEffect(() => {
        setLoading(true)
        fetchIntersections()

        const interval = setInterval(() => {
            fetchIntersections()
        }, 5000)

        return () => clearInterval(interval)
    }, [fetchIntersections])

    // const handleAdd = () => {
    //     setEditingIntersection(null)
    //     setIsModalVisible(true)
    //     form.resetFields()
    // }

    const handleEdit = (record: IntersectionTableItem) => {
        setEditingIntersection(record)
        setIsModalVisible(true)
        form.setFieldsValue(record)
    }

    // const handleDelete = (record: IntersectionTableItem) => {
    //     confirm({
    //         title: `คุณต้องการลบแยก "${record.Name}" ใช่ไหม?`,
    //         icon: <ExclamationCircleOutlined />,
    //         content: 'การดำเนินการนี้ไม่สามารถยกเลิกได้',
    //         okText: 'ลบ',
    //         okType: 'danger',
    //         cancelText: 'ยกเลิก',
    //         onOk: async () => {
    //             try {
    //                 await IntersectionManagementService.deleteIntersection(
    //                     record.Intersection_ID,
    //                 )
    //                 message.success(`ลบแยก "${record.Name}" เรียบร้อยแล้ว`)
    //                 fetchIntersections()
    //             } catch (error) {
    //                 message.error('เกิดข้อผิดพลาดในการลบข้อมูล')
    //             }
    //         },
    //     })
    // }

    const handleCancel = () => {
        setIsModalVisible(false)
        form.resetFields()
    }

    const handleModalSubmit = () => {
        form.validateFields()
            .then(async (values) => {
                try {
                    const payload = {
                        Name: values.Name,
                        Location: values.Location,
                        IP_Address: values.IP_Address,
                        Intersection_ID: Number(values.Intersection_ID),
                        Lane_Sequence: Number(values.Lane_Sequence),
                    }

                    if (editingIntersection) {
                        await IntersectionManagementService.updateIntersection(
                            editingIntersection.Intersection_ID,
                            payload,
                        )
                        message.success(
                            `แก้ไขข้อมูล "${values.Name}" เรียบร้อยแล้ว`,
                        )
                    } else {
                        await IntersectionManagementService.createIntersection(
                            payload,
                        )
                        message.success(
                            `เพิ่มข้อมูล "${values.Name}" เรียบร้อยแล้ว`,
                        )
                    }

                    setIsModalVisible(false)
                    form.resetFields()
                    fetchIntersections()
                } catch (error) {
                    console.error(error)
                    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
                }
            })
            .catch((info) => {
                console.log('Validate Failed:', info)
            })
    }

    const columns: TableProps<IntersectionTableItem>['columns'] = [
        {
            title: 'หมายเลขแยก',
            dataIndex: 'Intersection_ID',
            key: 'Intersection_ID',
            width: 110,
            align: 'center',
            sorter: (a, b) => a.Intersection_ID - b.Intersection_ID,
        },
        {
            title: 'ชื่อแยก',
            dataIndex: 'Name',
            key: 'Name',
            width: 180,
            sorter: (a, b) => a.Name.localeCompare(b.Name),
            render: (text) => (
                <div
                    style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {text}
                </div>
            ),
        },
        {
            title: 'ตำแหน่ง',
            dataIndex: 'Location',
            key: 'Location',
            width: 150,
            render: (text) => (
                <div
                    style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {text}
                </div>
            ),
        },
        {
            title: 'IP Address',
            dataIndex: 'IP_Address',
            key: 'IP_Address',
            width: 170,
            render: (text) => (
                <div style={{ whiteSpace: 'nowrap' }}>{text}</div>
            ),
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={status === 'Online' ? 'green' : 'red'}>
                    {status ? status.toUpperCase() : 'OFFLINE'}
                </Tag>
            ),
        },
        {
            title: 'จัดการ',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Flex gap="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    {/* <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        Delete
                    </Button> */}
                </Flex>
            ),
        },
    ]

    return (
        <div
            style={{
                padding: '24px',
                backgroundColor: '#fff',
                minHeight: '100vh',
            }}
        >
            <Flex vertical gap="large">
                <Flex justify="space-between" align="middle" className="mb-2">
                    <Title
                        level={4}
                        style={{ margin: 0 }}
                        className="text-gray-800"
                    >
                        Intersection Management
                    </Title>
                    {/* <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        Add new Intersection
                    </Button> */}
                </Flex>

                <Card className="shadow-lg rounded-lg border border-gray-200">
                    <Table
                        columns={columns}
                        dataSource={intersections}
                        rowKey="Intersection_ID"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 1000 }}
                    />
                </Card>

                <Modal
                    title={
                        editingIntersection
                            ? 'Edit intersection detail'
                            : 'Add new intersection'
                    }
                    open={isModalVisible}
                    onOk={handleModalSubmit}
                    onCancel={handleCancel}
                    okText={editingIntersection ? 'Save' : 'Add'}
                    cancelText="Cancel"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        name="intersection_form"
                        initialValues={{ Intersection_ID: 1, Lane_Sequence: 1 }}
                    >
                        <Form.Item
                            name="Name"
                            label="Intersection Name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please insert intersection name!',
                                },
                            ]}
                        >
                            <Input placeholder="ชื่อแยก" />
                        </Form.Item>

                        <Form.Item
                            name="Location"
                            label="Location"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please insert location!',
                                },
                            ]}
                        >
                            <Input placeholder="ระบุพิกัดหรือถนน" />
                        </Form.Item>

                        <Form.Item
                            name="IP_Address"
                            label="IP Address"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please insert IP Address!',
                                },
                            ]}
                        >
                            <Input placeholder="เช่น 192.168.1.100" />
                        </Form.Item>
                    </Form>
                </Modal>
            </Flex>
        </div>
    )
}

export default IntersectionManagement