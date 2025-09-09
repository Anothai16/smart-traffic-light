// --- src/types/index.ts ---

/**
 * กำหนด Type ของข้อมูลผู้ใช้ที่จะถูกเก็บใน JWT (JSON Web Token)
 * ซึ่งจะใช้ในการยืนยันตัวตนและการตรวจสอบสิทธิ์
 */
export interface JWTPayload {
    userId: number; // ID ของผู้ใช้ (Admin)
    email: string;
    firstName: string;
    lastName: string;
    authority: string[]; // สิทธิ์ของผู้ใช้ เช่น ['admin', 'user']
}