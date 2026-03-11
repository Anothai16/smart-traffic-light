import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

/**
 * ใช้กับ DatePicker "วันเริ่มต้น"
 * เงื่อนไข:
 *  - ห้ามเลือกวันอนาคต
 *  - ถ้ามี endDate → ห้าม start > end
 */
export const disabledStartDate = (endDate?: Dayjs | null) => (current?: Dayjs | null) => {
  if (!current) return false;

  // ❌ ห้ามเลือกอนาคต
  if (current.isAfter(dayjs(), 'day')) return true;

  // ❌ ถ้ามีวันที่สิ้นสุด → ห้ามเลือกวันเริ่มหลังวันสิ้นสุด
  if (endDate && current.isAfter(endDate, 'day')) return true;

  return false;
};

/**
 * ใช้กับ DatePicker "วันสิ้นสุด"
 * เงื่อนไข:
 *  - ห้ามเลือกวันอนาคต
 *  - ถ้ามี startDate → ห้าม end < start
 */
export const disabledEndDate = (startDate?: Dayjs | null) => (current?: Dayjs | null) => {
  if (!current) return false;

  // ❌ ห้ามเลือกอนาคต
  if (current.isAfter(dayjs(), 'day')) return true;

  // ❌ ถ้ามีวันที่เริ่มต้น → ห้ามเลือกวันสิ้นสุดก่อนวันเริ่ม
  if (startDate && current.isBefore(startDate, 'day')) return true;

  return false;
};
