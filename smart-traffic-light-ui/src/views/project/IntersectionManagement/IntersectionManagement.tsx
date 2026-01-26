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
    InputNumber,
    Tooltip
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    ExclamationCircleOutlined,
    HolderOutlined,
    OrderedListOutlined,
    CheckOutlined,
    CloseOutlined,
    ReloadOutlined 
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { IntersectionManagementService } from '@/services/IntersectionManagementService';

const { Title } = Typography;
const { confirm } = Modal;

interface IntersectionTableItem {
    Intersection_ID: number;
    Name: string;
    Location: string;
    IP_Address: string;
    Intersection_Number: number;
    Lane_Sequence: number; 
    status: 'Online' | 'Offline';
}

const IntersectionManagement: React.FC = () => {
    const [intersections, setIntersections] = useState<IntersectionTableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingIntersection, setEditingIntersection] = useState<IntersectionTableItem | null>(null);
    const [form] = Form.useForm();

    const [isReorderMode, setIsReorderMode] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const fetchIntersections = useCallback(async () => {
        setLoading(true);
        try {
            const response = await IntersectionManagementService.getAllIntersections();
            if (response.data && response.data.data) {
                const mappedData: IntersectionTableItem[] = response.data.data.map((item: any) => ({
                    Intersection_ID: item.Intersection_ID,
                    Name: item.Name,
                    Location: item.Location,
                    IP_Address: item.IP_Address,
                    Intersection_Number: Number(item.Intersection_Number),
                    Lane_Sequence: Number(item.Lane_Sequence || 1),
                    status: (Math.random() > 0.2 ? 'Online' : 'Offline') as 'Online' | 'Offline',
                })).sort((a, b) => a.Intersection_Number - b.Intersection_Number);
                
                setIntersections(mappedData);
            }
        } catch (error) {
            console.error(error);
            message.error('Failed to fetch intersection data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIntersections();
    }, [fetchIntersections]);

    const onDragStart = (e: React.DragEvent, index: number) => {
        if (!isReorderMode) return;
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (!isReorderMode || draggedItemIndex === null || draggedItemIndex === index) return;

        const newList = [...intersections];
        const draggedItem = newList[draggedItemIndex];
        newList.splice(draggedItemIndex, 1);
        newList.splice(index, 0, draggedItem);
        
        setDraggedItemIndex(index);
        setIntersections(newList);
    };

    const handleSaveOrder = async () => {
        setLoading(true);
        try {
            const promises = intersections.map((item, idx) => {
                const payload = {
                    Name: item.Name,
                    Intersection_Number: item.Intersection_Number,
                    Location: item.Location,
                    IP_Address: item.IP_Address,
                    Lane_Sequence: idx + 1 
                };
                return IntersectionManagementService.updateIntersection(item.Intersection_ID, payload as any);
            });
            await Promise.all(promises);
            setIsReorderMode(false);
            message.success('Lane sequence updated successfully');
            fetchIntersections(); 
        } catch (err) {
            message.error('Error occurred while updating the sequence');
        } finally {
            setLoading(false);
        }
    };

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

    const handleDelete = (record: IntersectionTableItem) => {
        confirm({
            title: `Are you sure you want to delete "${record.Name}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await IntersectionManagementService.deleteIntersection(record.Intersection_ID);
                    message.success(`Intersection "${record.Name}" deleted successfully`);
                    fetchIntersections(); 
                } catch (error) {
                    message.error('Error occurred while deleting data');
                }
            },
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleModalSubmit = () => {
        form.validateFields()
            .then(async (values) => {
                try {
                    const payload = {
                        Name: values.Name,
                        Location: values.Location,
                        IP_Address: values.IP_Address,
                        Intersection_Number: Number(values.Intersection_Number),
                        Lane_Sequence: editingIntersection ? editingIntersection.Lane_Sequence : Number(values.Lane_Sequence)
                    };

                    if (editingIntersection) {
                        await IntersectionManagementService.updateIntersection(editingIntersection.Intersection_ID, payload);
                        message.success(`Updated "${values.Name}" successfully`);
                    } else {
                        await IntersectionManagementService.createIntersection(payload);
                        message.success(`Added "${values.Name}" successfully`);
                    }
                    setIsModalVisible(false);
                    form.resetFields();
                    fetchIntersections(); 
                } catch (error) {
                    message.error('Error occurred while saving data');
                }
            });
    };

    const columns: TableProps<IntersectionTableItem>['columns'] = [
        ...(isReorderMode ? [{
            title: 'Move',
            key: 'drag-handle',
            width: 60,
            align: 'center' as const,
            render: () => <HolderOutlined style={{ cursor: 'grab', color: '#1890ff', fontSize: '18px' }} />,
        }] : []),
        {
            title: 'No.',
            dataIndex: 'Intersection_Number',
            key: 'Intersection_Number',
            width: 110,
            align: 'center',
            sorter: !isReorderMode ? (a, b) => a.Intersection_Number - b.Intersection_Number : undefined,
        },
        {
            title: 'Lane Sequence',
            dataIndex: 'Lane_Sequence',
            key: 'Lane_Sequence',
            width: 120,
            align: 'center',
            sorter: !isReorderMode ? (a, b) => a.Lane_Sequence - b.Lane_Sequence : undefined,
            render: (val, _, index) => (
                <Tag color={isReorderMode ? "orange" : "blue"}>
                    {isReorderMode ? index + 1 : val}
                </Tag>
            )
        },
        {
            title: 'Name',
            dataIndex: 'Name',
            key: 'Name',
            width: 180,
            render: (text) => <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{text}</div>,
        },
        { title: 'Location', dataIndex: 'Location', key: 'Location', width: 220 },
        { title: 'IP Address', dataIndex: 'IP_Address', key: 'IP_Address', width: 140 },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: 'Online' | 'Offline') => (
                <Tag color={status === 'Online' ? 'green' : 'red'}>{status.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, record) => (
                <Flex gap="small">
                    <Button disabled={isReorderMode} type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
                    <Button disabled={isReorderMode} type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Delete</Button>
                </Flex>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <Flex vertical gap="large">
                <Flex justify="space-between" align="middle" className="mb-2">
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">Intersection Management</Title>
                    <Flex gap="small">
                        {!isReorderMode && (
                            <Tooltip title="Refresh Data">
                                <Button
                                    icon={<ReloadOutlined spin={loading} />} 
                                    onClick={fetchIntersections}
                                    disabled={loading}
                                >Refresh</Button>
                            </Tooltip>
                        )}

                        {isReorderMode ? (
                            <>
                                <Button icon={<CloseOutlined />} onClick={() => { setIsReorderMode(false); fetchIntersections(); }}>Cancel</Button>
                                <Button type="primary" danger icon={<CheckOutlined />} onClick={handleSaveOrder} loading={loading}>Save Sequence</Button>
                            </>
                        ) : (
                            <Button 
                                icon={<OrderedListOutlined />} 
                                onClick={() => {
                                    const sortedByLane = [...intersections].sort((a, b) => a.Lane_Sequence - b.Lane_Sequence);
                                    setIntersections(sortedByLane);
                                    setIsReorderMode(true);
                                }}
                            >
                                Reorder Lanes
                            </Button>
                        )}
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={isReorderMode}>Add New Intersection</Button>
                    </Flex>
                </Flex>

                <Card styles={{ body: { padding: 0 } }} className={`shadow-sm rounded-lg overflow-hidden border ${isReorderMode ? 'border-blue-400 border-2' : 'border-gray-200'}`}>
                    <Table
                        columns={columns}
                        dataSource={intersections}
                        rowKey="Intersection_ID"
                        loading={loading}
                        pagination={isReorderMode ? false : { pageSize: 10 }}
                        scroll={{ x: 1000 }} 
                        onRow={(_, index) => ({
                            draggable: isReorderMode,
                            onDragStart: (e) => onDragStart(e, index!),
                            onDragOver: (e) => onDragOver(e, index!),
                            style: { cursor: isReorderMode ? 'move' : 'default' }
                        })}
                    />
                </Card>

                <Modal
                    title={editingIntersection ? 'Edit Intersection Detail' : 'Add New Intersection'}
                    open={isModalVisible}
                    onOk={handleModalSubmit}
                    onCancel={handleCancel}
                    okText={editingIntersection ? 'Save' : 'Add'}
                    destroyOnClose
                >
                    <Form form={form} layout="vertical" initialValues={{ Intersection_Number: 1, Lane_Sequence: 1 }}>
                        <Form.Item name="Name" label="Intersection Name" rules={[{ required: true, message: 'Required' }]}><Input placeholder="e.g. Gate 1" /></Form.Item>
                        <Flex gap="middle">
                            <Form.Item name="Intersection_Number" label="No." style={{ flex: 1 }} rules={[{ required: true, message: 'Required' }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                            
                            {!editingIntersection && (
                                <Form.Item name="Lane_Sequence" label="Lane Sequence" style={{ flex: 1 }} rules={[{ required: true, message: 'Required' }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                            )}
                        </Flex>
                        <Form.Item name="Location" label="Location" rules={[{ required: true, message: 'Required' }]}><Input placeholder="e.g. Main Road" /></Form.Item>
                        <Form.Item name="IP_Address" label="IP Address" rules={[{ required: true, message: 'Required' }]}><Input placeholder="e.g. 192.168.1.1" /></Form.Item>
                    </Form>
                </Modal>
            </Flex>
        </div>
    );
};

export default IntersectionManagement;