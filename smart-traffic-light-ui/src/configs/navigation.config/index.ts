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
                        key: 'appsProject.dashboard',
                        path: `/project/dashboard`,
                        title: 'Dashboard',
                        translateKey: 'appsProject.dashboard',
                        icon: 'dashboard',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.trafficManagement',
                        path: `/project/trafficManagement`,
                        title: 'Traffic Management',
                        translateKey: 'appsProject.trafficManagement',
                        icon: 'traffic',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.AccountConfiguration',
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
                        title: 'Picture Evidents',
                        translateKey: 'appsProject.Picture',
                        icon: 'picture',
                        type: NAV_ITEM_TYPE_COLLAPSE, 
                        authority: [],
                        subMenu: [
                            {
                                key: 'appsProject.Picture.Traffic',
                                path: `/project/Picture`, 
                                title: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Picture Traffic Evidents',
                                translateKey: 'appsProject.Picture.Traffic',
                                icon: 'appstore',
                                type: NAV_ITEM_TYPE_ITEM, 
                                authority: [],
                                subMenu: [],
                            },
                            {
                                key: 'appsProject.Picture.Traffic.Alert',
                                path: `/project/PictureAlert`, 
                                title: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Picture Traffic Alert',
                                translateKey: 'appsProject.Picture.Traffic.Alert',
                                icon: 'appstore',
                                type: NAV_ITEM_TYPE_ITEM, 
                                authority: [],
                                subMenu: [],
                            },
                        ],
                    },
                    {
                        key: 'appsProject.SettingHistory',
                        path: `/project/SettingHistory`,
                        title: 'Setting History',
                        translateKey: 'appsProject.SettingHistory',
                        icon: 'history',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.CameraManagement',
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
