// src/services/ImageService.ts

import ApiService from './ApiService'

export interface ImageObject {
    id: string
    url: string
    title: string
    timestamp: string
    lane: string
}

export interface LogRecord {
    key: string
    date: string
    time: string
}

export interface IntersectionData {
    Intersection_ID: number
    Name: string
    IP_Address?: string
    Location?: string
}

export async function apiGetLogRecords(
    laneName: string = 'Lane_1',
): Promise<LogRecord[]> {
    const response = await ApiService.fetchData<LogRecord[]>({
        url: `/image-log/records?lane=${encodeURIComponent(laneName)}`,
        method: 'get',
    })
    return response.data
}

export async function apiGetImagesByDateAndLane(
    date: string,
    lane: string,
): Promise<ImageObject[]> {
    const response = await ApiService.fetchData<ImageObject[]>({
        url: `/image-log/images?date=${date}&lane=${encodeURIComponent(lane)}`,
        method: 'get',
    })
    return response.data
}

export async function apiGetIntersectionData(): Promise<IntersectionData[]> {
    const response = await ApiService.fetchData<IntersectionData[]>({
        url: 'master/intersection',
        method: 'get',
    })

    return response.data
}
