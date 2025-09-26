// index.ts (Navigation Configuration)

import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_COLLAPSE,
} from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'Home',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_TITLE,
        authority: ['nav_home'], // <--- **Permission Key สำหรับกลุ่ม Home**
        subMenu: [
            {
                key: 'appsProject.dashboard',
                path: `/project/dashboard`,
                title: 'Dashboard',
                translateKey: 'appsProject.dashboard',
                icon: 'dashboard',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['dashboard_view'], // <--- Permission Key
                subMenu: [],
            },
            {
                key: 'appsProject.trafficManagement',
                path: `/project/trafficManagement`,
                title: 'Traffic Management',
                translateKey: 'appsProject.trafficManagement',
                icon: 'traffic',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['traffic_manage'], // <--- Permission Key
                subMenu: [],
            },
            {
                key: 'appsProject.AccountConfiguration',
                path: `/project/AccountConfiguration`,
                title: 'Account Configuration',
                translateKey: 'appsProject.AccountConfiguration',
                icon: 'user',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['account_config'], // <--- Permission Key
                subMenu: [],
            },
            {
                key: 'appsProject.Picture',
                path: `/project/Picture`,
                title: 'Picture',
                translateKey: 'appsProject.Picture',
                icon: 'picture',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['picture_view'], // <--- Permission Key
                subMenu: [],
            },
            {
                key: 'appsProject.SettingHistory',
                path: `/project/SettingHistory`,
                title: 'Setting History',
                translateKey: 'appsProject.SettingHistory',
                icon: 'history',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['setting_history'], // <--- Permission Key
                subMenu: [],
            },
            {
                key: 'appsProject.CameraManagement',
                path: `/project/CameraManagement`,
                title: 'Camera Management',
                translateKey: 'appsProject.CameraManagement',
                icon: 'camera',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['camera_manage'], // <--- Permission Key
                subMenu: [],
            },
            {
                key: 'appsProject.userPermissionConfig',
                path: `/project/userPermissionConfig`,
                title: 'Config User Permission',
                translateKey: 'appsProject.userPermissionConfig',
                icon: 'permissionconfig',
                type: NAV_ITEM_TYPE_ITEM,
                authority: ['user_permission_config'], // <--- Permission Key
                subMenu: [],
                    },     
        ],
    },
    {
        key: 'test',
        path: '/test',
        title: 'Test Menu',
        translateKey: 'Test Menu',
        icon: '',
        type: NAV_ITEM_TYPE_TITLE,
        authority: ['nav_test'], // <--- **Permission Key สำหรับกลุ่ม Test Menu**
        subMenu: [
            {
                key: 'appsProject.CameraManagement',
                path: '',
                title: 'Performance & Camera',
                translateKey: 'appsProject.CameraManagement',
                icon: 'performance',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: ['perf_camera_group'], // <--- Permission Key สำหรับเมนูย่อยแบบ Collapse
                subMenu: [
                    {
                        key: 'appsProject.IntersectionView',
                        path: `/project/IntersectionView`,
                        title: 'Intersection View',
                        translateKey: 'appsProject.IntersectionView',
                        icon: 'history',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: ['intersection_view'], // <--- Permission Key
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.SystemPerformance',
                        path: `/project/SystemPerformance`,
                        title: 'System Performance',
                        translateKey: 'appsProject.SystemPerformance',
                        icon: 'history',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: ['system_performance'], // <--- Permission Key
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.PictureTest',
                        path: `/project/PictureTest`,
                        title: 'Picture Test',
                        translateKey: 'appsProject.PictureTest',
                        icon: 'history',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: ['picture_test'], // <--- Permission Key
                        subMenu: [],
                    },
                ],
            },
        ]
    }
    /** Example purpose only, please remove */
]
export default navigationConfig