import { ImageViolationService } from "../services/image-violation.service";

export const ImageViolationController = {
  async getImagesByDateAndLane(date: string, lane: string) {
    return await ImageViolationService.getImagesByDateAndLane(date, lane);
  },

  async getLogRecords(lane: string) {
    return ImageViolationService.getLogRecordsFromFiles(lane);
  },
};