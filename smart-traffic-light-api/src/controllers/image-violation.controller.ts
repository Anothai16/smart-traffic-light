import { ImageViolationService } from "../services/image-violation.service";

export const ImageViolationController = {
  /**
   * ดึงรูปภาพตามวันที่และเลน (ใช้ตอนกดเลือกแถวในตาราง)
   */
  async getImagesByDateAndLane(date: string, lane: string) {
    return await ImageViolationService.getImagesByDateAndLane(date, lane);
  },

  /**
   * ดึงข้อมูล Records ทั้งหมดแบบ Group ทุก Lane
   */
  async getLogRecords() {
    return ImageViolationService.getLogRecordsFromFiles();
  },
};
