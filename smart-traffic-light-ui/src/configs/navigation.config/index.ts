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
        authority: [],
        subMenu: [
            {
                        key: `/project/dashboard`,
                        path: `/project/dashboard`,
                        title: 'Dashboard',
                        translateKey: 'appsProject.dashboard',
                        icon: 'dashboard',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: `/project/trafficManagement`,
                        path: `/project/trafficManagement`,
                        title: 'Traffic Management',
                        translateKey: 'appsProject.trafficManagement',
                        icon: 'traffic',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: `/project/AccountConfiguration`,
                        path: `/project/AccountConfiguration`,
                        title: 'Account Configuration',
                        translateKey: 'appsProject.AccountConfiguration',
                        icon: 'user',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: ['SuperAdmin'],
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.Picture',
                        path: '', 
                        title: 'Photo Evidence',
                        translateKey: 'appsProject.Picture',
                        icon: 'picture',
                        type: NAV_ITEM_TYPE_COLLAPSE, 
                        authority: [],
                        subMenu: [
                            {
                                key: '/project/Picture/TrafficLog',
                                path: `/project/Picture/TrafficLog`, 
                                title: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Traffic Log',
                                translateKey: 'appsProject.Picture.Traffic',
                                icon: 'appstore',
                                type: NAV_ITEM_TYPE_ITEM, 
                                authority: [],
                                subMenu: [],
                            },
                            {
                                key: '/project/Picture/TrafficViolations',
                                path: `/project/Picture/TrafficViolations`, 
                                title: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Red Light Violations',
                                translateKey: 'appsProject.Picture.Traffic.Alert',
                                icon: 'appstore',
                                type: NAV_ITEM_TYPE_ITEM, 
                                authority: [],
                                subMenu: [],
                            },
                        ],
                    },
                    {
                        key: `/project/SettingHistory`,
                        path: `/project/SettingHistory`,
                        title: 'Setting History',
                        translateKey: 'appsProject.SettingHistory',
                        icon: 'history',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: `/project/IntersectionManagement`,
                        path: `/project/IntersectionManagement`,
                        title: 'Intersection Management',
                        translateKey: 'appsProject.CameraManagement',
                        icon: 'camera',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
        ],
    },
    /** Example purpose only, please remove */
     
]
export default navigationConfig
