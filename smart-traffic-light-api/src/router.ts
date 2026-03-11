// src/router.ts

import { Elysia } from 'elysia';

import { authRoutes } from './routes/auth.routes';
import { accountConfigRoutes } from './routes/account-config.routes';
import { trafficRoutes } from './routes/traffic.routes';
import { settingHistoryRoutes } from './routes/settingHistory.routes';
import { imageLogRoutes } from './routes/image-log.routes'; 
import { intersectionRoutes } from './routes/intersection.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { imageViolationRoutes } from './routes/image-violation.routers';
import { systemRoutes } from './routes/system.routes';


export const appRoutes = new Elysia()
    .use(authRoutes)
    .use(accountConfigRoutes)
    .use(trafficRoutes)
    .use(settingHistoryRoutes)
    .use(imageLogRoutes)
    .use(imageViolationRoutes)
    .use(intersectionRoutes)
    .use(dashboardRoutes)
    .use(systemRoutes)
    .on('beforeHandle', ({ request }) => {
        console.log(`[Global Router] Received Request: ${request.method} ${request.url}`);
    });
