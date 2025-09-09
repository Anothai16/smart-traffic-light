import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Flex, Tag, Typography, Modal, Form, DatePicker, Row, Col, message, Popconfirm, Space } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import { apiGetAccounts, apiCreateAccount, apiDeleteAccount } from '@/services/AccountConfigurationService';
import type { AxiosResponse, AxiosError } from 'axios';
import { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Account {
    Admin_ID: number;
    Username: string;
    First_Name: string;
    Last_Name: string;
    Email: string;
    ID_Card: string;
    Register_Date: string;
    Birthday: string; 
    Role: string;
}

interface AccountApiResponse {
    accounts: Account[];
}

interface DeleteAccountResponse {
    message: string;
}

const ViewAllAccount: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await apiGetAccounts();
            if (response.status === 200) {
                setAccounts(response.data.accounts);
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            message.error('Failed to fetch accounts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleCreateAccount = async (values: any) => {
        try {
            setLoading(true);
            // ✅ สร้าง payload ใหม่ที่มีเฉพาะข้อมูลที่จำเป็นสำหรับ API
            const payload = {
                username: values.username,
                password: values.password,
                firstName: values.firstName,
                lastName: values.lastName,
                idCard: values.idCard,
                email: values.email,
                phoneNumber: values.phoneNumber,
                role: 'user', // กำหนดค่า default role
            };

            const response = await apiCreateAccount(payload);
            if (response.status === 200) {
                message.success('Account created successfully!');
                handleCancel();
                fetchAccounts();
            } else {
                message.error('Failed to create account.');
            }
        } catch (error) {
            const err = error as AxiosError<any>;
            console.error("Failed to create account:", err);
            message.error(err.response?.data?.message || 'Failed to create account.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteAccount = async (adminId: number) => {
        try {
            const response = await apiDeleteAccount(adminId);
            if (response.status === 200) {
                message.success('Account deleted successfully!');
                fetchAccounts();
            } else {
                message.error('Failed to delete account.');
            }
        } catch (error) {
            const err = error as AxiosError<any>;
            console.error("Failed to delete account:", err);
            message.error(err.response?.data?.message || 'Failed to delete account.');
        }
    };

    const columns: ColumnsType<Account> = [
        {
            title: 'Username',
            dataIndex: 'Username',
            key: 'Username',
        },
        {
            title: 'Full Name',
            key: 'fullName',
            render: (_, record) => `${record.First_Name} ${record.Last_Name}`,
        },
        {
            title: 'Email',
            dataIndex: 'Email',
            key: 'Email',
        },
        {
            title: 'ID Card',
            dataIndex: 'ID_Card',
            key: 'ID_Card',
        },
        {
            title: 'Role',
            dataIndex: 'Role',
            key: 'Role',
            render: (role: string) => (
                <Tag color={role === 'superadmin' ? 'purple' : 'blue'}>
                    {role.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Register Date',
            dataIndex: 'Register_Date',
            key: 'Register_Date',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Popconfirm
                        title="Delete the account"
                        description="Are you sure to delete this account?"
                        onConfirm={() => handleDeleteAccount(record.Admin_ID)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="primary" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: '24px' }}>
                <Title level={3}>All Accounts</Title>
                <Button type="primary" onClick={showModal}>
                    Create Account
                </Button>
            </Flex>

            <Card>
                <Table
                    columns={columns}
                    dataSource={accounts}
                    rowKey="Admin_ID"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Create New Account"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width={1000}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateAccount}
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
        </>
    );
};

export default ViewAllAccount;