// src/components/layouts/UserDropdown/_UserDropdown.tsx

import React, { useState } from 'react';
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useAuth from '@/utils/hooks/useAuth'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { HiOutlineLogout, HiOutlineKey, HiOutlineUser } from 'react-icons/hi'
import type { CommonProps } from '@/@types/common'
import type { JSX } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

// ✅ เพิ่มการ import สำหรับ Modal และ Form
import { Modal, Form, Input, message } from 'antd';
import { apiChangePassword } from '@/services/AccountConfigurationService';

type DropdownList = {
    label: string
    path?: string // ✅ เปลี่ยนเป็น optional
    icon: JSX.Element
    onClick?: () => void // ✅ เพิ่ม onClick เข้ามา
}

const dropdownItemList: DropdownList[] = []

const _UserDropdown = ({ className }: CommonProps) => {
    const { signOut } = useAuth()
    
    const user = useSelector((state: RootState) => state.auth.user);

    // ✅ State สำหรับควบคุม Modal และสถานะการโหลด
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [form] = Form.useForm();

    // ✅ ฟังก์ชันเปิด Modal
    const showChangePasswordModal = () => {
        setIsModalVisible(true);
    };

    // ✅ ฟังก์ชันเมื่อกด OK ใน Modal
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setConfirmLoading(true);

            // TODO: ส่งข้อมูลไปยัง API เพื่อเปลี่ยนรหัสผ่าน
            await apiChangePassword(values.oldPassword, values.newPassword);
            
            message.success('Password has been changed successfully!');
            setIsModalVisible(false);
            form.resetFields();
        } catch (error: any) {
            console.error('Error changing password:', error);
            message.error(error.message || 'Failed to change password. Please try again.');
        } finally {
            setConfirmLoading(false);
        }
    };

    // ✅ ฟังก์ชันเมื่อกด Cancel ใน Modal
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const UserAvatar = (
        <div className={classNames(className, 'flex items-center gap-2')}>
            <Avatar size={32} shape="circle" icon={<HiOutlineUser />} />
            <div className="hidden md:block">
                <div className="text-xs capitalize">{user?.Role}</div> 
                <div className="font-bold">{user?.firstName}</div> 
            </div>
        </div>
    )

    // ✅ เพิ่มรายการ "Change Password" ใน dropdownItemList
    const updatedDropdownItemList: DropdownList[] = [
        ...dropdownItemList,
        {
            label: 'Change Password',
            icon: <HiOutlineKey />,
            onClick: showChangePasswordModal,
        },
    ];

    return (
        <div>
            <Dropdown
                menuStyle={{ minWidth: 240 }}
                renderTitle={UserAvatar}
                placement="bottom-end"
            >
                <Dropdown.Item variant="header">
                    <div className="py-2 px-3 flex items-center gap-2">
                        <Avatar shape="circle" icon={<HiOutlineUser />} />
                        <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div className="text-xs">{user?.email}</div>
                        </div>
                    </div>
                </Dropdown.Item>
                <Dropdown.Item variant="divider" />
                {updatedDropdownItemList.map((item) => (
                    <Dropdown.Item
                        key={item.label}
                        eventKey={item.label}
                        className="mb-1 px-0"
                        // ✅ เพิ่ม onClick ที่ Dropdown.Item สำหรับเมนูที่ไม่มี path
                        onClick={item.onClick}
                    >
                        {item.path ? (
                            // ✅ แก้ไข: ใช้ Link เมื่อ item มี path เท่านั้น
                            <Link
                                className="flex h-full w-full px-2"
                                to={item.path}
                            >
                                <span className="flex gap-2 items-center w-full">
                                    <span className="text-xl opacity-50">
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </span>
                            </Link>
                        ) : (
                            <span className="flex gap-2 items-center w-full px-2">
                                <span className="text-xl opacity-50">
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </span>
                        )}
                    </Dropdown.Item>
                ))}
                <Dropdown.Item
                    eventKey="Sign Out"
                    className="gap-2"
                    onClick={signOut}
                >
                    <span className="text-xl opacity-50">
                        <HiOutlineLogout />
                    </span>
                    <span>Sign Out</span>
                </Dropdown.Item>
            </Dropdown>

            {/* ✅ Modal สำหรับเปลี่ยนรหัสผ่าน */}
            <Modal
                title="Change Password"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={confirmLoading}
                okText="Change"
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="change-password-form"
                    className="mt-4"
                >
                    <Form.Item
                        name="oldPassword"
                        label="Old Password"
                        rules={[{ required: true, message: 'Please input your old password!' }]}
                    >
                        <Input.Password placeholder="Enter old password" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[{ required: true, message: 'Please input your new password!' }]}
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={['newPassword']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Please confirm your new password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Confirm new password" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown