import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Flex, Tag, Typography, Modal, Form, DatePicker, Row, Col, Popconfirm, Space } from 'antd';
import { message } from 'antd'; // ✅ นำเข้า message
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { apiGetAccounts, apiCreateAccount, apiDeleteAccount } from '@/services/AccountConfigurationService';
import type { AxiosResponse, AxiosError } from 'axios';
import { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
dayjs.extend(utc);

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
    const [searchText, setSearchText] = useState('');
    
    // ✅ ใช้ Hook useMessage() เพื่อสร้าง instance ใหม่
    const [messageApi, contextHolder] = message.useMessage();

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await apiGetAccounts();
            if (response.status === 200) {
                setAccounts(response.data.accounts);
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            messageApi.error('Failed to fetch accounts.'); // ✅ เปลี่ยนเป็น messageApi
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleSearch = (value: string) => {
        setSearchText(value);
        const filteredData = accounts.filter(account =>
            Object.values(account).some(val =>
                String(val).toLowerCase().includes(value.toLowerCase())
            )
        );
        setAccounts(filteredData);
    };

    const handleDeleteAccount = async (adminId: number) => {
        try {
            const response = await apiDeleteAccount(adminId);
            if (response.status === 200 || response.status === 204) {
                messageApi.success('Account deleted successfully!'); // ✅ เปลี่ยนเป็น messageApi
                fetchAccounts();
            } else {
                messageApi.error('Failed to delete account.'); // ✅ เปลี่ยนเป็น messageApi
            }
        } catch (error) {
            const err = error as AxiosError<any>;
            console.error("Failed to delete account:", err);
            messageApi.error(err.response?.data?.message || 'Failed to delete account.'); // ✅ เปลี่ยนเป็น messageApi
        }
    };

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const onFinish = async (values: any) => {
        try {
            // ✅ แก้ไข: สร้าง payload โดยรวมข้อมูล Birthday และ Register date
            const payload = {
                username: values.username,
                password: values.password,
                firstName: values.firstName,
                lastName: values.lastName,
                idCard: values.idCard,
                email: values.email,
                phoneNumber: values.phoneNumber,
                role: 'Admin', // กำหนด role เป็น 'user'
                birthday: values.birthday?.format('YYYY-MM-DD'), // ✅ แปลงเป็นสตริง
                registerDate: values.registerDate?.format('YYYY-MM-DD'), // ✅ แปลงเป็นสตริง
            };

            await apiCreateAccount(payload); // ✅ ส่ง payload ใหม่
            messageApi.success('Account created successfully!');
            fetchAccounts();
            handleCancel();
        } catch (error) {
            console.error("Failed to create account:", error);
            messageApi.error('Failed to create account.');
        }
    };

    const columns: ColumnsType<Account> = [
        {
            title: 'Firstname',
            dataIndex: 'First_Name',
            key: 'First_Name',
            sorter: (a, b) => a.First_Name.localeCompare(b.First_Name),
        },
        {
            title: 'Lastname',
            dataIndex: 'Last_Name',
            key: 'Last_Name',
            sorter: (a, b) => a.Last_Name.localeCompare(b.Last_Name),
        },
        {
            title: 'Email',
            dataIndex: 'Email',
            key: 'Email',
            sorter: (a, b) => a.Email.localeCompare(b.Email),
        },
        {
            title: 'ID Card',
            dataIndex: 'ID_Card',
            key: 'ID_Card',
        },
        {
            title: 'Register date',
            dataIndex: 'Register_Date',
            key: 'Register_Date',
            render: (date: string) => {
            // ✅ ใช้ dayjs.utc() เพื่อให้ถือว่าข้อมูลที่ได้มาเป็น UTC
            const formattedDate = dayjs.utc(date);
            return formattedDate.isValid() ? formattedDate.format('YYYY-MM-DD') : '-';
        },
            sorter: (a, b) => a.Register_Date.localeCompare(b.Register_Date),
        },
        {
            title: 'Role',
            dataIndex: 'Role',
            key: 'Role',
            render: (role: Account['Role']) => (
                <Tag color={role === 'SuperAdmin' ? 'purple' : 'blue'}>
                    {role.toUpperCase()}
                </Tag>
            ),
            sorter: (a, b) => a.Role.localeCompare(b.Role),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Popconfirm
                    title="Delete the account"
                    description="Are you sure to delete this account?"
                    onConfirm={() => handleDeleteAccount(record.Admin_ID)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button type="primary" danger>Delete</Button>
                </Popconfirm>
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
                        dataSource={accounts}
                        rowKey="Admin_ID"
                        pagination={{ pageSize: 10 }}
                        loading={loading}
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