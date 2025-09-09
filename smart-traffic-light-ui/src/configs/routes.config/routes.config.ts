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
        authority: [],
    },
    {
        key: 'appsProject.Picture',
        path: `/project/Picture`,
        component: lazy(() => import('@/views/project/Picture')),
        authority: [],
    },
    {
        key: 'appsProject.SettingHistory',
        path: `/project/SettingHistory`,
        component: lazy(() => import('@/views/project/SettingHistory')),
        authority: [],
    },
]
