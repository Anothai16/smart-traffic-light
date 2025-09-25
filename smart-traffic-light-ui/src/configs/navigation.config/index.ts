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
                        authority: [],
                        subMenu: [],
                    },
                    {
                        key: 'appsProject.Picture',
                        path: `/project/Picture`,
                        title: 'Picture',
                        translateKey: 'appsProject.Picture',
                        icon: 'picture',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
                        subMenu: [],
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
                        path: `/project/CameraManagement`,
                        title: 'Camera Management',
                        translateKey: 'appsProject.CameraManagement',
                        icon: 'camera',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [],
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
        authority: [],
        subMenu: [
            {
                        key: 'appsProject.CameraManagement',
                        path: '',
                        title: 'Performance & Camera',
                        translateKey: 'appsProject.CameraManagement',
                        icon: 'performance',
                        type: NAV_ITEM_TYPE_COLLAPSE,
                        authority: [],
                        subMenu: [
                            {
                                key: 'appsProject.IntersectionView',
                                path: `/project/IntersectionView`,
                                title: 'Intersection View',
                                translateKey: 'appsProject.IntersectionView',
                                icon: 'history',
                                type: NAV_ITEM_TYPE_ITEM,
                                authority: [],
                                subMenu: [],
                            },
                            {
                                key: 'appsProject.SystemPerformance',
                                path: `/project/SystemPerformance`,
                                title: 'System Performance',
                                translateKey: 'appsProject.SystemPerformance',
                                icon: 'history',
                                type: NAV_ITEM_TYPE_ITEM,
                                authority: [],
                                subMenu: [],
                            },
                            {
                                key: 'appsProject.PictureTest',
                                path: `/project/PictureTest`,
                                title: 'Picture Test',
                                translateKey: 'appsProject.PictureTest',
                                icon: 'history',
                                type: NAV_ITEM_TYPE_ITEM,
                                authority: [],
                                subMenu: [],
                            },
                        ],
                    },
                
        ]
    }
    /** Example purpose only, please remove */
     
]
export default navigationConfig
