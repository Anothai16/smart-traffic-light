// src/views/account-config/AccountConfiguration.tsx

import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Table,
    Input,
    Button,
    Flex,
    Tag,
    Typography,
    Modal,
    Form,
    DatePicker,
    Row,
    Col,
    Popconfirm,
    Space,
    Select,
    message,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {
    apiGetAccounts,
    apiCreateAccount,
    apiDeleteAccount,
    apiUpdateAccount,
} from '@/services/AccountConfigurationService'
import type { AxiosError } from 'axios'
import { ColumnsType } from 'antd/es/table'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

const { Title } = Typography
dayjs.extend(utc)

// Interface สำหรับข้อมูลบัญชี
interface Account {
    Admin_ID: number
    Username: string
    First_Name: string
    Last_Name: string
    Email: string
    ID_Card: string
    Register_Date: string
    Role: string
    Phone_Number: string
}

interface ErrorResponseData {
    message: string
}

const AccountConfiguration: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)

    const [messageApi, contextHolder] = message.useMessage()

    const userAuthority = useSelector(
        (state: RootState) => state.auth.user.authority,
    )

    const roleOptions = userAuthority.includes('SuperAdmin')
        ? [
              { value: 'Admin', label: 'Admin' },
              { value: 'SuperAdmin', label: 'SuperAdmin' },
          ]
        : [{ value: 'Admin', label: 'Admin' }]

    const fetchAccounts = async () => {
        try {
            setLoading(true)
            const response = await apiGetAccounts()
            if (response.status === 200) {
                // 🟢 กรองเอา ID 0 (User Not Found) ออก ไม่ให้แสดงในตาราง
                const activeAccounts = response.data.accounts.filter(
                    (account: Account) => account.Admin_ID !== 0
                )
                setAccounts(activeAccounts)
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error)
            messageApi.error('Failed to fetch accounts.')
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = useCallback(async () => {
        await fetchAccounts()
        messageApi.success('Data refreshed successfully!')
    }, [fetchAccounts, messageApi])

    useEffect(() => {
        fetchAccounts()
    }, [])

    const handleSearch = (value: string) => {
        setSearchText(value)
        
        // 🟢 ถ้าลบคำค้นหาจนว่างเปล่า ให้ดึงข้อมูลใหม่กลับมาแสดงทั้งหมด
        if (!value) {
            fetchAccounts()
            return
        }

        const filteredData = accounts.filter((account) =>
            Object.values(account).some((val) =>
                String(val).toLowerCase().includes(value.toLowerCase()),
            ),
        )
        setAccounts(filteredData)
    }

    const handleDeleteAccount = async (adminIds: number[]) => {
        try {
            const response = await apiDeleteAccount(adminIds)
            if (response.status === 200 || response.status === 204) {
                messageApi.success('Account deleted successfully!')
                fetchAccounts()
            } else {
                messageApi.error('Failed to delete account.')
            }
        } catch (error) {
            const err = error as AxiosError<any>
            console.error('Failed to delete account:', err)
            messageApi.error(
                err.response?.data?.message || 'Failed to delete account.',
            )
        }
    }

    const handleEdit = (record: Account) => {
        setEditingAccount(record)
        setIsModalOpen(true)
        form.setFieldsValue({
            First_Name: record.First_Name,
            Last_Name: record.Last_Name,
            Email: record.Email,
            ID_Card: record.ID_Card,
            Phone_Number: record.Phone_Number,
            Role: record.Role,
            Register_Date: record.Register_Date
                ? dayjs(record.Register_Date)
                : null,
            Username: record.Username,
            password: undefined,
            confirmPassword: undefined,
        })
    }

    const showModal = () => {
        setEditingAccount(null)
        setIsModalOpen(true)
        form.resetFields()
        form.setFieldsValue({
            Register_Date: dayjs(),
        })
    }

    const handleCancel = () => {
        setIsModalOpen(false)
        form.resetFields()
    }

    function isAxiosError(
        error: any,
    ): error is import('axios').AxiosError<ErrorResponseData> {
        return error?.isAxiosError === true
    }

    const onFinish = async (values: any) => {
        try {
            setLoading(true)

            if (editingAccount) {
                // แก้ไข (Edit):
                const passwordFields =
                    values.password && values.confirmPassword
                        ? {
                              password: values.password,
                          }
                        : {}

                const payload = {
                    First_Name: values.First_Name,
                    Last_Name: values.Last_Name,
                    ID_Card: values.ID_Card,
                    Email: values.Email,
                    Phone_Number: values.Phone_Number,
                    Role: values.Role,
                    Register_Date: values.Register_Date
                        ? values.Register_Date.format('YYYY-MM-DD')
                        : null,
                    ...passwordFields,
                }

                await apiUpdateAccount(editingAccount.Admin_ID, payload)
                messageApi.success('Account updated successfully!')
            } else {
                //  สร้างใหม่ (Create):
                const payload = {
                    username: values.Username,
                    password: values.password,
                    First_Name: values.First_Name,
                    Last_Name: values.Last_Name,
                    ID_Card: values.ID_Card,
                    Email: values.Email,
                    Phone_Number: values.Phone_Number,
                    Role: values.Role,
                    Register_Date: dayjs().format('YYYY-MM-DD'),
                }
                await apiCreateAccount(payload)
                messageApi.success('Account created successfully!')
            }

            fetchAccounts()
            handleCancel()
        } catch (error: unknown) {
            if (
                isAxiosError(error) &&
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                message.error(error.response.data.message)
            } else {
                message.error('An unexpected error occurred.')
            }
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnsType<Account> = [
        {
            title: 'Firstname',
            dataIndex: 'First_Name',
            key: 'First_Name',
            sorter: (a, b) => a.First_Name.localeCompare(b.First_Name),
            width: 150,
        },
        {
            title: 'Lastname',
            dataIndex: 'Last_Name',
            key: 'Last_Name',
            sorter: (a, b) => a.Last_Name.localeCompare(b.Last_Name),
            width: 150,
        },
        {
            title: 'Email',
            dataIndex: 'Email',
            key: 'Email',
            sorter: (a, b) => a.Email.localeCompare(b.Email),
            width: 200,
        },
        {
            title: 'ID Card',
            dataIndex: 'ID_Card',
            key: 'ID_Card',
            width: 150,
            render: (text: string) => {
                if (!text || text.length <= 4) {
                    return text
                }
                const maskedPart = '********'
                const lastFour = text.slice(-4)
                return `${maskedPart}${lastFour}`
            },
        },
        {
            title: 'Register date',
            dataIndex: 'Register_Date',
            key: 'Register_Date',
            width: 120,
            render: (date: string) => {
                const formattedDate = dayjs.utc(date)
                return formattedDate.isValid()
                    ? formattedDate.format('YYYY-MM-DD')
                    : '-'
            },
            sorter: (a, b) => a.Register_Date.localeCompare(b.Register_Date),
        },
        {
            title: 'Role',
            dataIndex: 'Role',
            key: 'Role',
            width: 100,
            render: (role: Account['Role']) => (
                <Tag color={role === 'SuperAdmin' ? 'purple' : 'blue'}>
                    {role ? role.toUpperCase() : '-'}
                </Tag>
            ),
            sorter: (a, b) => a.Role.localeCompare(b.Role),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="middle">
                    {userAuthority.includes('SuperAdmin') && (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        >
                            Edit
                        </Button>
                    )}
                    <Popconfirm
                        title="Delete the account"
                        description="Are you sure to delete this account?"
                        onConfirm={() => handleDeleteAccount([record.Admin_ID])}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
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
            {contextHolder}
            <Flex vertical gap="large">
                <Flex
                    justify="space-between"
                    align="middle"
                    wrap="wrap"
                    gap="small"
                >
                    <Title level={4} style={{ margin: 0 }}>
                        Account Configuration
                    </Title>
                    <Flex gap="middle">
                        <Input.Search
                            placeholder="Search accounts"
                            onSearch={handleSearch}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <Button
                            type="primary"
                            onClick={showModal}
                            icon={<PlusOutlined />}
                        >
                            ADD NEW ACCOUNT
                        </Button>
                        <Button
                            onClick={handleRefresh}
                            icon={<SyncOutlined />}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                    </Flex>
                </Flex>

                <Card className="shadow-lg rounded-lg border border-gray-200">
                    <Table
                        columns={columns}
                        dataSource={accounts}
                        rowKey="Admin_ID"
                        pagination={{ pageSize: 10 }}
                        loading={loading}
                        scroll={{ x: 1000 }}
                    />
                </Card>

                <Modal
                    title={
                        editingAccount ? 'Edit Account' : 'Create New Account'
                    }
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={null}
                    width={750}
                >
                    <Form
                        form={form}
                        name="account_form"
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
                                        name="First_Name"
                                        label="Firstname"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please input your Firstname!',
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="Last_Name"
                                        label="Lastname"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please input your Lastname!',
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="ID_Card"
                                        label="ID card"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'กรุณากรอกหมายเลขบัตรประชาชน!',
                                            },
                                            {
                                                validator: (_, value) => {
                                                    const pattern = /^\d{13}$/
                                                    if (!value) {
                                                        return Promise.resolve()
                                                    }
                                                    if (!pattern.test(value)) {
                                                        return Promise.reject(
                                                            new Error(
                                                                'กรุณากรอกหมายเลขบัตรประชาชนเป็นตัวเลข 13 หลักเท่านั้น!',
                                                            ),
                                                        )
                                                    }
                                                    return Promise.resolve()
                                                },
                                            },
                                        ]}
                                    >
                                        <Input maxLength={13} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="Email"
                                        label="Email"
                                        rules={[
                                            {
                                                required: true,
                                                type: 'email',
                                                message:
                                                    'Please input a valid email!',
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="Phone_Number"
                                        label="Phone Number"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'กรุณากรอกเบอร์โทรศัพท์!',
                                            },
                                            {
                                                validator: (_, value) => {
                                                    const pattern = /^\d{10}$/
                                                    if (!value) {
                                                        return Promise.resolve()
                                                    }
                                                    if (!pattern.test(value)) {
                                                        return Promise.reject(
                                                            new Error(
                                                                'กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10 หลักเท่านั้น!',
                                                            ),
                                                        )
                                                    }
                                                    return Promise.resolve()
                                                },
                                            },
                                        ]}
                                    >
                                        <Input maxLength={10} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="Register_Date"
                                        label="Register date"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please select register date!',
                                            },
                                        ]}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                        <Card title="Account Information">
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                        name="Username"
                                        label="Username"
                                        rules={[
                                            {
                                                required: !editingAccount,
                                                message:
                                                    'Please input your username!',
                                            },
                                        ]}
                                    >
                                        <Input disabled={!!editingAccount} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="Role"
                                        label="Role"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please select a role!',
                                            },
                                        ]}
                                    >
                                        <Select options={roleOptions} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[
                                            {
                                                required: !editingAccount,
                                                message:
                                                    'Please input your password!',
                                            },
                                            {
                                                min: 8,
                                                message:
                                                    'Password must be at least 8 characters long.',
                                            },
                                            {
                                                pattern: new RegExp(
                                                    '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}',
                                                ),
                                                message:
                                                    'Password must include uppercase, lowercase, number, and special character.',
                                            },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const username =
                                                        getFieldValue(
                                                            'Username',
                                                        )
                                                    if (
                                                        value &&
                                                        username &&
                                                        value
                                                            .toLowerCase()
                                                            .includes(
                                                                username.toLowerCase(),
                                                            )
                                                    ) {
                                                        return Promise.reject(
                                                            new Error(
                                                                'Password cannot contain your username.',
                                                            ),
                                                        )
                                                    }
                                                    return Promise.resolve()
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            placeholder={
                                                editingAccount
                                                    ? 'Enter new password to change'
                                                    : 'Enter password'
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        dependencies={['password']}
                                        rules={[
                                            {
                                                required: !editingAccount,
                                                message:
                                                    'Please confirm your password!',
                                            },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const password =
                                                        getFieldValue(
                                                            'password',
                                                        )

                                                    if (
                                                        !password &&
                                                        !value &&
                                                        editingAccount
                                                    ) {
                                                        return Promise.resolve()
                                                    }

                                                    if (
                                                        !value ||
                                                        password === value
                                                    ) {
                                                        return Promise.resolve()
                                                    }
                                                    return Promise.reject(
                                                        new Error(
                                                            'The two passwords that you entered do not match!',
                                                        ),
                                                    )
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            placeholder={
                                                editingAccount
                                                    ? 'Confirm new password'
                                                    : 'Confirm password'
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                        <Flex justify="flex-end" style={{ marginTop: '24px' }}>
                            <Button
                                onClick={handleCancel}
                                style={{ marginRight: '8px' }}
                            >
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingAccount ? 'Save' : 'Create'}
                            </Button>
                        </Flex>
                    </Form>
                </Modal>
            </Flex>
        </div>
    )
}

export default AccountConfiguration