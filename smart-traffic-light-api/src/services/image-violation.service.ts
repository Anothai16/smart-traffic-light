import * as fs from "fs";
import * as path from "path";

// กำหนด Path หลักสำหรับข้อมูลการกระทำผิด
const IMAGE_ROOT_PATH = process.env.IMAGE_ROOT_PATH || "violation_data";
const STATIC_PREFIX = process.env.STATIC_PREFIX || "/static/violation-images";
const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? "http://localhost:3000";

export interface ViolationLogRecord {
  key: string;
  date: string;
  time: string;
  lanes?: string; // สำหรับเก็บรายชื่อ Lane ที่พบข้อมูลในช่วงเวลานั้น
}

export const ImageViolationService = {
  /**
   * Logic ใหม่: อ่านทุก Lane และจัดกลุ่มตาม "วันที่_เวลา"
   */
  getLogRecordsFromFiles: (): ViolationLogRecord[] => {
    if (!fs.existsSync(IMAGE_ROOT_PATH)) return [];

    try {
      const groupedRecords: { [timeKey: string]: Set<string> } = {};
      // รายชื่อโฟลเดอร์ Lane ทั้งหมดที่ต้องการตรวจสอบ
      const laneFolders = ["Lane1", "Lane2", "Lane3", "Lane4"];

      laneFolders.forEach((laneFolder) => {
        const lanePath = path.join(IMAGE_ROOT_PATH, laneFolder);
        if (!fs.existsSync(lanePath)) return;

        // อ่านโฟลเดอร์วันที่ (YYYY-MM-DD)
        const dateFolders = fs
          .readdirSync(lanePath)
          .filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f));

        dateFolders.forEach((dateFolder) => {
          const fullDatePath = path.join(lanePath, dateFolder);
          const files = fs.readdirSync(fullDatePath);

          files.forEach((fileName) => {
            // Regex สำหรับดึง วันที่ และ เวลา จากชื่อไฟล์ (2026-01-13_15-30-00_...)
            const match = fileName.match(
              /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_/,
            );
            if (match) {
              const date = match[1];
              const time = match[2].replace(/-/g, ":");
              const timeKey = `${date} ${time}`; // ใช้เป็น Key ในการจัดกลุ่ม

              if (!groupedRecords[timeKey]) {
                groupedRecords[timeKey] = new Set();
              }
              // เก็บชื่อ Lane ไว้ (เช่น Lane_1) เพื่อนำไปแสดงผลที่ UI
              groupedRecords[timeKey].add(laneFolder.replace("Lane", "Lane_"));
            }
          });
        });
      });

      // แปลงจาก Object ที่จัดกลุ่มแล้วเป็น Array สำหรับส่งให้ Controller
      const finalRecords: ViolationLogRecord[] = Object.entries(
        groupedRecords,
      ).map(([timeKey, lanesSet]) => {
        const [date, time] = timeKey.split(" ");
        return {
          key: timeKey,
          date,
          time,
          lanes: Array.from(lanesSet).sort().join(", "), // รวมเป็น string เช่น "Lane_1, Lane_2"
        };
      });

      // เรียงลำดับจากใหม่ไปเก่า
      return finalRecords.sort((a, b) => b.key.localeCompare(a.key));
    } catch (error) {
      console.error("Error reading violation logs:", error);
      return [];
    }
  },

  /**
   * ดึงรูปภาพรายเลน (Logic เดิมแต่ปรับ Path ให้ตรงกับโฟลเดอร์ใหม่)
   */
  async getImagesByDateAndLane(date: string, laneName: string): Promise<any[]> {
    const laneFolderName = laneName.replace("_", ""); // Lane_1 -> Lane1
    const lanePath = path.join(IMAGE_ROOT_PATH, laneFolderName);
    if (!fs.existsSync(lanePath)) return [];

    const datePath = path.join(lanePath, date);
    if (!fs.existsSync(datePath)) return [];

    try {
      const fileNames = fs.readdirSync(datePath);
      const filteredFiles = fileNames.filter((name) =>
        name.match(/(\.jpg|\.jpeg|\.png)$/i),
      );

      return filteredFiles.map((fileName) => {
        const fullPath = path.join(datePath, fileName);
        let relativeUrlPath = path
          .relative(IMAGE_ROOT_PATH, fullPath)
          .replace(/\\/g, "/");
        const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${relativeUrlPath.split("/").map(encodeURIComponent).join("/")}`;

        const timeMatch = fileName.match(
          /^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})_/,
        );
        return {
          id: `${date}-${laneName}-${fileName}`,
          url: imageUrl,
          title: fileName,
          timestamp: timeMatch
            ? `${timeMatch[1]} ${timeMatch[2]}:${timeMatch[3]}:${timeMatch[4]}`
            : date,
          lane: laneName,
        };
      });
    } catch (error) {
      return [];
    }
  },
};
