import { ImageLogService } from '../services/image-log.service';

export const ImageLogController = {
    async getImagesByDateAndLane(date: string, lane: string) {
        return await ImageLogService.getImagesByDateAndLane(date, lane); 
    },
    async getLogRecords(lane: string) {
        return ImageLogService.getLogRecordsFromFiles(lane);
    },
};