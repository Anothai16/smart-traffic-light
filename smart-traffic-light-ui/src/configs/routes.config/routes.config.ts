// routes.config.ts

import { lazy } from 'react'
import authRoute from './authRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: ['nav_home'], // <--- **Permission Key**
    },
    /** Example purpose only, please remove */
    {
        key: 'appsProject.dashboard',
        path: `/project/dashboard`,
        component: lazy(() => import('@/views/project/Dashboard')),
        authority: ['dashboard_view'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.trafficManagement',
        path: `/project/trafficManagement`,
        component: lazy(() => import('@/views/project/TrafficManagement')),
        authority: ['traffic_manage'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.AccountConfiguration',
        path: `/project/AccountConfiguration`,
        component: lazy(() => import('@/views/project/AccountConfiguration')),
        authority: ['account_config'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.Picture',
        path: `/project/Picture`,
        component: lazy(() => import('@/views/project/Picture')),
        authority: ['picture_view'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.SettingHistory',
        path: `/project/SettingHistory`,
        component: lazy(() => import('@/views/project/SettingHistory')),
        authority: ['setting_history'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.IntersectionView',
        path: `/project/IntersectionView`,
        component: lazy(() => import('@/views/project/IntersectionView')),
        authority: ['intersection_view'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.SystemPerformance',
        path: `/project/SystemPerformance`,
        component: lazy(() => import('@/views/project/SystemPerformance')),
        authority: ['system_performance'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.CameraManagement',
        path: `/project/CameraManagement`,
        component: lazy(() => import('@/views/project/CameraManagement')),
        authority: ['camera_manage'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.PictureTest',
        path: `/project/PictureTest`,
        component: lazy(() => import('@/views/project/PictureTest')),
        authority: ['picture_test'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.userPermissionConfig', // <--- **แก้ไข key เป็น 'appsProject.userPermissionConfig' ให้ตรงกับ menu key**
        path: `/project/userPermissionConfig`,
        component: lazy(() => import('@/views/project/UserPermissionConfig')),
        authority: ['user_permission_config'], // <--- **Permission Key**
    },
    {
        key: 'appsProject.accessdenied', // <--- **แก้ไข key เป็น 'appsProject.userPermissionConfig' ให้ตรงกับ menu key**
        path: `/access-denied`,
        component: lazy(() => import('@/views/auth/AccessDenied/index')),
        authority: [], // <--- **Permission Key**
    },
]