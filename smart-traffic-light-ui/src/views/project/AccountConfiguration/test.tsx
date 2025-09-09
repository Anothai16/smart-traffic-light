import React, { useState } from 'react';
import { Card, Table, Input, Button, Flex, Tag, Typography, Modal, Form, DatePicker, Row, Col, message } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

// Mock Data for demonstration
interface Account {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    idCard: string;
    registerDate: string;
    role: 'admin' | 'superadmin';
}

const mockAccounts: Account[] = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        idCard: '1234567890123',
        registerDate: '2023-01-15',
        role: 'admin',
    },
    {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        idCard: '3210987654321',
        registerDate: '2023-02-20',
        role: 'superadmin',
    },
    {
        id: '3',
        firstName: 'Peter',
        lastName: 'Jones',
        email: 'peter.jones@example.com',
        idCard: '9876543210987',
        registerDate: '2023-03-10',
        role: 'admin',
    },
    {
        id: '4',
        firstName: 'Mary',
        lastName: 'Brown',
        email: 'mary.brown@example.com',
        idCard: '5678901234567',
        registerDate: '2023-04-05',
        role: 'superadmin',
    },
];

const getRoleTag = (role: Account['role']) => {
    switch (role) {
        case 'admin':
            return <Tag color="blue">{role}</Tag>;
        case 'superadmin':
            return <Tag color="purple">{role}</Tag>;
        default:
            return <Tag>{role}</Tag>;
    }
};

const ViewAllAccount = () => {
    const [dataSource, setDataSource] = useState<Account[]>(mockAccounts);
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleSearch = (value: string) => {
        setSearchText(value);
        const filteredData = mockAccounts.filter(account =>
            Object.values(account).some(val =>
                String(val).toLowerCase().includes(value.toLowerCase())
            )
        );
        setDataSource(filteredData);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Confirm Deletion',
            content: 'Are you sure you want to delete this account?',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => {
                const newDataSource = dataSource.filter(account => account.id !== id);
                setDataSource(newDataSource);
                messageApi.success('Account deleted successfully!');
            },
        });
    };

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const onFinish = (values: any) => {
        console.log('Received values of form: ', values);
        setIsModalOpen(false);
        form.resetFields();
    };

    const columns: TableProps<Account>['columns'] = [
        {
            title: 'Firstname',
            dataIndex: 'firstName',
            key: 'firstName',
            sorter: (a, b) => a.firstName.localeCompare(b.firstName),
        },
        {
            title: 'Lastname',
            dataIndex: 'lastName',
            key: 'lastName',
            sorter: (a, b) => a.lastName.localeCompare(b.lastName),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'ID Card',
            dataIndex: 'idCard',
            key: 'idCard',
        },
        {
            title: 'Register date',
            dataIndex: 'registerDate',
            key: 'registerDate',
            sorter: (a, b) => a.registerDate.localeCompare(b.registerDate),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: Account['role']) => getRoleTag(role),
            sorter: (a, b) => a.role.localeCompare(b.role),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button type="primary" danger onClick={() => handleDelete(record.id)}>
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex justify="space-between" align="middle">
                    <Title level={4} style={{ margin: 0 }}>
                        All Account
                    </Title>
                    <Flex gap="middle">
                        <Input.Search
                            placeholder="Search accounts"
                            onSearch={handleSearch}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <Button type="primary" onClick={showModal}>
                            ADD NEW ACCOUNT
                        </Button>
                    </Flex>
                </Flex>
                <Card>
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                    />
                </Card>

                <Modal
                    title="Create New Account"
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={null}
                    width={800}
                >
                    <Form
                        form={form}
                        name="create_account_form"
                        onFinish={onFinish}
                        layout="vertical"
                    >
                        {/* Personal Information Section */}
                        <Card
                            title="Personal Information"
                            style={{ marginBottom: '24px' }}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="firstName"
                                        label="Firstname"
                                        rules={[{ required: true, message: 'Please input your Firstname!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="lastName"
                                        label="Lastname"
                                        rules={[{ required: true, message: 'Please input your Lastname!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="idCard"
                                        label="ID card"
                                        rules={[{ required: true, message: 'Please input your ID card!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="birthday"
                                        label="Birthday"
                                        rules={[{ required: true, message: 'Please select your Birthday!' }]}
                                    >
                                        <DatePicker style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="phoneNumber"
                                        label="Phone Number"
                                        rules={[{ required: true, message: 'Please input your phone number!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                name="registerDate"
                                label="Register date"
                                rules={[{ required: true, message: 'Please select register date!' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Card>

                        {/* Account Information Section */}
                        <Card title="Account Information">
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        rules={[{ required: true, message: 'Please input your username!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[{ required: true, message: 'Please input your password!' }]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        dependencies={['password']}
                                        rules={[
                                            { required: true, message: 'Please confirm your password!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Submit and Cancel Buttons */}
                        <Flex justify="flex-end" style={{ marginTop: '24px' }}>
                            <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create
                            </Button>
                        </Flex>
                    </Form>
                </Modal>
            </Flex>
        </>
    );
};

export default ViewAllAccount;