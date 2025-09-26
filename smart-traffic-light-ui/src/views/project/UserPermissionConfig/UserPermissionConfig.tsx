import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Card, Flex, Button, Typography, Table, Checkbox, 
    Tooltip, Alert, Spin, notification
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
    SaveOutlined, ReloadOutlined, SettingOutlined, InfoCircleOutlined, SyncOutlined, 
    CheckOutlined 
} from '@ant-design/icons';
import { 
    apiGetPermissionConfigData, 
    apiUpdateRolePermissions, 
    PermissionConfigData 
} 
from '@/services/PermissionConfigService'; 

// --- Interface for Toast Configuration ---
interface ToastConfig {
    title: string;
    description: React.ReactNode;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number; // Duration in milliseconds
    placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

// Create a Wrapper for Ant Design Notification
const toast = { 
    push: (config: ToastConfig) => { 
        const { title, description, type, duration = 4500, placement } = config; 
        const antdDuration = duration === 0 ? 0 : (duration / 1000); 
        
        const notificationConfig = {
            message: <span className='font-bold'>{title}</span>,
            description: description,
            placement: placement || 'topRight' as const,
            duration: antdDuration,
        };

        if (type === 'success') {
            notification.success(notificationConfig);
        } else if (type === 'error') {
            notification.error(notificationConfig);
        } else if (type === 'info') {
            notification.info(notificationConfig);
        } else if (type === 'warning') {
            notification.warning(notificationConfig);
        } else {
            notification.open(notificationConfig);
        }
    } 
}; 

const { Title, Text } = Typography;

// --- 1. DATA STRUCTURES ---

interface MenuItem { key: string; title: string; }

interface PermissionCompareRow extends MenuItem {
    superAdminAccess: boolean;
    adminAccess: boolean; 
    adminChange: boolean | undefined; 
}

const UserPermissionConfig = () => {
    
    const [configData, setConfigData] = useState<PermissionConfigData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [changedPermissions, setChangedPermissions] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    // สมมติว่ามีการดึง Role Name ที่แท้จริงจาก Redux หรือ Context
    const superAdminRoleName: string = useMemo(() => 'Super Admin', []); 
    const adminRoleName: string = useMemo(() => 'Admin', []); 

    // FETCH DATA HOOK
    const fetchData = useCallback(async (showSuccessToast = false) => { 
        setIsLoading(true);
        setError(null);
        setChangedPermissions({}); 
        try {
            const response = await apiGetPermissionConfigData();
            // 🔑 FIX: ใช้ response.data.data ตามโครงสร้าง Axios
            setConfigData(response.data.data); 

            if (showSuccessToast) { 
                toast.push({
                    title: "Data Loaded Successfully",
                    description: "Latest permissions data has been loaded",
                    type: "success",
                    duration: 1500,
                    placement: 'topRight',
                });
            }
            
        } catch (err: any) {
            console.error('API Error in fetchData:', err);
            const errorMessage = err.message || 'Could not load permissions data from server';
            setError(errorMessage);
            toast.push({
                title: "Error",
                description: errorMessage,
                type: "error",
                duration: 3000,
                placement: 'topRight',
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect: Load data when component mounts (suppress success toast)
    useEffect(() => {
        fetchData(false); 
    }, [fetchData]);

    // PREPARE DATA FOR TABLE
    const allMenuItems: MenuItem[] = useMemo(() => configData?.allKeys || [], [configData]);
    const superAdminPermissions = useMemo(() => configData?.permissionsByRole[superAdminRoleName] || [], [configData]);
    const adminPermissions = useMemo(() => configData?.permissionsByRole[adminRoleName] || [], [configData]);
    
    const hasAccess = (permissionsList: string[], key: string) => permissionsList.includes(key);

    const tableData: PermissionCompareRow[] = useMemo(() => {
        return allMenuItems.map(item => {
            const originalAdminAccess = hasAccess(adminPermissions, item.key);
            
            return {
                key: item.key,
                title: item.title,
                superAdminAccess: hasAccess(superAdminPermissions, item.key), 
                adminAccess: originalAdminAccess,
                adminChange: changedPermissions[item.key] !== undefined 
                    ? changedPermissions[item.key] 
                    : undefined,
            };
        });
    }, [changedPermissions, adminPermissions, superAdminPermissions, allMenuItems]);

    const isDirty = Object.keys(changedPermissions).length > 0;

    const handleAdminPermissionChange = (key: string, checked: boolean) => {
        setChangedPermissions(prev => {
            const originalAccess = adminPermissions.includes(key);
            
            if (checked === originalAccess) {
                const newChanges = { ...prev };
                delete newChanges[key];
                return newChanges;
            }

            return {
                ...prev,
                [key]: checked,
            };
        });
    };

    // Handler to save data
    const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
        const changesToSend: Record<string, boolean> = {};
        tableData.forEach(row => {
            if (row.adminChange !== undefined) {
                changesToSend[row.key] = row.adminChange; 
            }
        });

        await apiUpdateRolePermissions(adminRoleName, changesToSend); 
            
        // Save Success Toast (MUST show)
        toast.push({
            title: "Save Successful",
            description: `Permissions for role **${adminRoleName}** have been updated successfully`,
            type: "success",
            duration: 2000,
        });

        // Fetch new data after save (suppress success toast)
        await fetchData(false); 

        } catch (error: any) {
            const errorMessage = error.message || 'Please check Console';
            toast.push({
                title: "Save Failed",
                description: `Could not save permissions: ${errorMessage}`,
                type: "error",
                duration: 3000,
            });
            console.error('Error saving permissions:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // --- 2. COLUMNS DEFINITION ---

    const columns: ColumnsType<PermissionCompareRow> = [
        {
            // ✅ FIX: เปลี่ยนหัวข้อคอลัมน์จาก 'Menu / Feature' เป็น 'Title / รายการสิทธิ์'
            title: 'Title', 
            dataIndex: 'title',
            key: 'title',
            width: '40%',
            render: (text: string, record) => (
                <Flex align="center" gap="small">
                    <Text strong>{text}</Text>
                    <Tooltip title={`Permission Key: ${record.key}`}>
                        <InfoCircleOutlined className="text-gray-400 cursor-help" />
                    </Tooltip>
                </Flex>
            ),
        },
        // Super Admin Column: Display Checkbox (Always Checked and Disabled)
        {
            title: superAdminRoleName, 
            dataIndex: 'superAdminAccess',
            key: 'superAdminAccess',
            width: '15%',
            align: 'center',
            render: (hasAccess: boolean, record) => (
                <Flex justify="center">
                    {configData && allMenuItems.some(item => item.key === record.key) ? (
                        <Tooltip title={`Role ${superAdminRoleName} has access (cannot be edited)`}>
                            <Checkbox
                                checked={true} // บังคับให้ติ๊กถูกเสมอ
                                disabled={true} // ห้ามกด
                            />
                        </Tooltip>
                    ) : (
                        // Placeholder เดิม (สำหรับตอนโหลดข้อมูลยังไม่เสร็จ)
                        <div className="w-5 h-5 border border-gray-300 rounded" /> 
                    )}
                </Flex>
            ),
        },
        // Admin Column: Editable Checkbox
        {
            title: adminRoleName, 
            dataIndex: 'adminAccess',
            key: 'adminAccess',
            width: '25%',
            align: 'center',
            render: (adminAccess: boolean, record) => {
                const currentAccess = record.adminChange !== undefined 
                    ? record.adminChange 
                    : adminAccess;
                const isChanged = record.adminChange !== undefined;

                return (
                    <Flex justify="center" align="center">
                        <Checkbox
                            checked={currentAccess}
                            onChange={(e) => handleAdminPermissionChange(record.key, e.target.checked)}
                            disabled={adminRoleName === superAdminRoleName} 
                        />
                        {isChanged && (
                            <Tooltip title="Pending changes waiting to be saved">
                                <span className="ml-2 text-yellow-600 font-bold">*</span>
                            </Tooltip>
                        )}
                    </Flex>
                );
            },
        },
    ];

    // --- 3. UI RENDERING ---

    return (
        <div className="p-4 md:p-8">
            <Title level={3} className="!mb-6 text-gray-800">
                <SettingOutlined className="mr-2" /> Administrator Permission Configuration (Role Comparison)
            </Title>
            
            <Card className="shadow-lg">
                <Flex justify="space-between" align="center" wrap="wrap" className="mb-6">
                    <Alert 
                        message={`This configuration edits the permissions for the role '${adminRoleName}' by comparing it with '${superAdminRoleName}' (${superAdminRoleName} permissions cannot be edited).`}
                        type="info"
                        showIcon
                        className="w-full md:w-auto"
                    />
                    
                    <Flex gap="small" className="mt-4 md:mt-0">
                        {/* Refresh Button: Explicit refresh, show success toast (fetchData(true)) */}
                        <Button 
                            icon={<SyncOutlined />} 
                            onClick={() => fetchData(true)} 
                            loading={isLoading}
                            disabled={isSaving}
                            className="mr-2"
                        >
                            Refresh Latest Data
                        </Button>
                        
                        {isDirty && (
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={() => setChangedPermissions({})}
                            >
                                Cancel Changes
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSavePermissions}
                            disabled={!isDirty || isSaving || isLoading || !!error}
                            loading={isSaving}
                            className="font-bold bg-green-500 hover:!bg-green-600"
                        >
                            Save {adminRoleName} Permissions
                        </Button>
                    </Flex>
                </Flex>

                {/* Loading/Error State */}
                {isLoading && (
                    <Flex justify="center" className="py-12">
                        <Spin size="large" tip="กำลังโหลดข้อมูลสิทธิ์..." />
                    </Flex>
                )}
                
                {error && <Alert message="ข้อผิดพลาดในการโหลดข้อมูล" description={error} type="error" showIcon className="mb-4" />}

                {/* Table View */}
                {!isLoading && !error && configData && (
                    <Card title="Compare Menu Access Permissions" className="border border-gray-200">
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            rowKey="key"
                            pagination={false}
                            bordered
                        />
                    </Card>
                )}
            </Card>
        </div>
    );
};

export default UserPermissionConfig;