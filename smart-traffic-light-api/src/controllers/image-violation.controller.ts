import { ImageViolationService } from "../services/image-violation.service";

export const ImageViolationController = {
  async getImagesByDateAndLane(date: string, lane: string) {
    return await ImageViolationService.getImagesByDateAndLane(date, lane);
  },

  // 🟢 แก้ไข: ใส่ ? เพื่อให้รับค่า undefined ได้ (กรณีดึงทุกเลน)
  async getLogRecords(lane?: string) {
    return ImageViolationService.getLogRecordsFromFiles(lane);
  },
};