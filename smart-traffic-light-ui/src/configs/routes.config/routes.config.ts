import { lazy } from 'react'
import authRoute from './authRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
    },
    /** Example purpose only, please remove */
    {
        key: 'appsProject.dashboard',
        path: `/project/dashboard`,
        component: lazy(() => import('@/views/project/Dashboard')),
        authority: [],
    },
    {
        key: 'appsProject.trafficManagement',
        path: `/project/trafficManagement`,
        component: lazy(() => import('@/views/project/TrafficManagement')),
        authority: [],
    },
    {
        key: 'appsProject.AccountConfiguration',
        path: `/project/AccountConfiguration`,
        component: lazy(() => import('@/views/project/AccountConfiguration')),
        authority: ['SuperAdmin'],
    },
    {
        key: 'appsProject.Picture.TrafficLog',
        path: `/project/Picture/TrafficLog`,
        component: lazy(() => import('@/views/project/Picture/TrafficLog')),
        authority: [],
    },
    {
        key: 'appsProject.SettingHistory',
        path: `/project/SettingHistory`,
        component: lazy(() => import('@/views/project/SettingHistory')),
        authority: [],
    },
    {
        key: 'appsProject.CameraManagement',
        path: `/project/IntersectionManagement`,
        component: lazy(() => import('@/views/project/IntersectionManagement')),
        authority: [],
    },
    {
        key: 'appsProject.Picture.TrafficViolations',
        path: `/project/Picture/TrafficViolations`,
        component: lazy(() => import('@/views/project/Picture/TrafficViolations')),
        authority: [],
    },
]
