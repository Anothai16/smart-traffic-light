// src/views/Picture.tsx 

import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { Card, Flex, Button, Typography, DatePicker, Spin, Alert, Image, Tag, Tooltip, Select } from 'antd';
import { FolderFilled, LeftOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';

// *** นำเข้า Service และ Interface ที่สร้างขึ้น ***
import { apiGetAvailableImageDates, apiGetImagesByDateAndLane, ImageObject } from '@/services/ImageService'; 

dayjs.locale('th');
const { Title } = Typography;

// กำหนดรายการ Lane ที่สอดคล้องกับ Backend
const LANE_OPTIONS = [
    'Lane 1 (PC-A)',
    'Lane 2 (PC-B)',
    'Lane 3 (PC-C)',
    'Lane 4 (PC-D)',
];

const PictureLog = () => {
    // State สำหรับการนำทางและข้อมูล
    const [selectedDate, setSelectedDate] = useState<string | null>(null); 
    const [selectedLane, setSelectedLane] = useState<string>(LANE_OPTIONS[0]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);   
    const [images, setImages] = useState<ImageObject[]>([]);
    
    // State สำหรับการกรองและการโหลด
    const [filteredDate, setFilteredDate] = useState<Dayjs | null>(null); 
    const [loading, setLoading] = useState(true); // ใช้ loading รวม
    const [error, setError] = useState<string | null>(null);

    // *** 1. Logic การดึงรายการวันที่ (Folders) - ใช้ useCallback และรับ lane ***
    const loadAvailableDates = useCallback(async (lane: string) => {
        setLoading(true);
        setError(null);
        setAvailableDates([]); // 💡 FIX: เคลียร์ State วันที่เก่าก่อนเริ่มโหลดใหม่
        try {
            // ✅ FIX: ส่ง lane ไปที่ API เพื่อให้ Backend กรองข้อมูล
            const dates = await apiGetAvailableImageDates(lane); 
            setAvailableDates(dates);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch available dates.');
            setAvailableDates([]); 
        } finally {
            setLoading(false);
        }
    }, []); 

    // ✅ 2. useEffect: Logic หลักที่ทำให้ State เสถียรเมื่อ Lane เปลี่ยน
    useEffect(() => {
        // เมื่อ Lane เปลี่ยน:
        setSelectedDate(null); // 1. กลับสู่หน้าเลือกวันที่
        setImages([]);        // 2. เคลียร์รูปภาพเก่า
        loadAvailableDates(selectedLane); // 3. โหลดวันที่ใหม่สำหรับ Lane นี้
    }, [selectedLane, loadAvailableDates]);


    // กรองวันที่ตาม DatePicker
    const displayDates = useMemo(() => {
        // เรียงวันที่ (ล่าสุดไปเก่าสุด) ก่อนกรอง
        const sortedDates = availableDates.slice().sort((a, b) => dayjs(b).diff(dayjs(a)));
        
        if (!filteredDate) return sortedDates;
        
        const filterStr = filteredDate.format('YYYY-MM-DD');
        return sortedDates.filter(date => date === filterStr);
    }, [availableDates, filteredDate]);


    // *** 3. Logic การโหลดรูปภาพเมื่อเลือกวันที่ ***
    const handleDateClick = async (date: string) => {
        if (!selectedLane) {
            alert("Please select a Lane first.");
            return;
        }
        setSelectedDate(date);
        setLoading(true); 
        setError(null);
        setImages([]); // เคลียร์รูปภาพเก่า

        try {
            // เรียก API ด้วย date และ selectedLane
            const imageList = await apiGetImagesByDateAndLane(date, selectedLane); 
            setImages(imageList);
        } catch (err: any) {
            setError(err.message || 'Failed to load images.');
        } finally {
            setLoading(false);
        }
    };
    
    // *** 4. Logic การจัดการการเปลี่ยน Lane ***
    const handleLaneChange = (lane: string) => {
        // การตั้งค่า State selectedLane ใหม่จะไปกระตุ้น useEffect ด้านบนให้ทำงานทันที
        setSelectedLane(lane);
    };

    // ----------------------------------------------------
    // UI View 2: แสดงรูปภาพภายในวันที่และ Lane ที่เลือก
    // ----------------------------------------------------
    if (selectedDate) {
        return (
            // ✅ FIX: ใช้ Wrapper div แบบเดียวกับ AccountConfiguration เพื่อล็อค Layout
            <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
                <Flex vertical gap="large">
                    <Flex justify="space-between" align="middle" className="mb-6 p-4 border-b border-gray-200">
                        <Button onClick={() => setSelectedDate(null)} icon={<LeftOutlined />}>
                            Back to Dates ({selectedLane})
                        </Button>
                        <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                            Images for {dayjs(selectedDate).format('DD MMMM YYYY')} ({selectedLane})
                        </Title>
                        <div></div>
                    </Flex>

                    <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                        {loading ? (
                            <Flex justify="center" align="middle" style={{ height: 300 }}>
                                <Spin size="large" tip="Loading Images..." />
                            </Flex>
                        ) : error ? (
                            <Alert message="Error" description={error} type="error" showIcon />
                        ) : images.length === 0 ? (
                            <Alert message="ไม่พบข้อมูล" description={`ไม่พบรูปภาพในวันที่ ${selectedDate} สำหรับ ${selectedLane}`} type="info" showIcon />
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {images.map(img => (
                                    <Card
                                        key={img.id}
                                        hoverable
                                        className="p-1 shadow-md rounded-lg"
                                        cover={
                                            <Image
                                                alt={img.title}
                                                src={img.url}
                                                style={{ height: 180, objectFit: 'cover', borderRadius: '4px 4px 0 0' }}
                                                preview={{ maskClassName: 'rounded-t-lg' }}
                                            />
                                        }
                                    >
                                        <Card.Meta 
                                            title={<Tooltip title={img.title}><div className="truncate text-sm font-semibold">{img.title}</div></Tooltip>}
                                            description={
                                                <Flex vertical gap={4}>
                                                    <Tag color="blue" className='w-fit'>{img.lane}</Tag>
                                                    <div className="text-xs text-gray-500">
                                                        {dayjs(img.timestamp).format('HH:mm:ss')}
                                                    </div>
                                                </Flex>
                                            }
                                        />
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Card>
                </Flex>
            </div>
        );
    }

    // ----------------------------------------------------
    // UI View 1: แสดงรายการวันที่ (Folders)
    // ----------------------------------------------------
    return (
        // ✅ FIX: ใช้ Wrapper div แบบเดียวกับ AccountConfiguration เพื่อล็อค Layout
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            <Flex vertical gap="large">
                <Flex justify="space-between" align="middle" className="mb-6 p-4">
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Traffic Log
                    </Title>
                    <Flex gap="middle" align="middle">
                        {/* Selector สำหรับเลือก Lane */}
                        <Select
                            placeholder="Select Lane"
                            value={selectedLane}
                            onChange={handleLaneChange}
                            options={LANE_OPTIONS.map(lane => ({ value: lane, label: lane }))}
                            style={{ width: 200 }}
                            className="shadow-sm"
                        />
                        <DatePicker 
                            onChange={setFilteredDate} 
                            placeholder="Filter by date" 
                            className="shadow-sm" 
                            allowClear
                        />
                    </Flex>
                </Flex>
                
                <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                    <Title level={5} style={{ marginTop: 0 }}>Available Dates for {selectedLane}</Title>
                    
                    {loading ? (
                        <Flex justify="center" align="middle" style={{ height: 300 }}>
                            <Spin size="large" tip="Loading Folders..." />
                        </Flex>
                    ) : error ? (
                         <Alert message="Error" description={error} type="error" showIcon />
                    ) : displayDates.length === 0 ? ( // 💡 ตรวจสอบจาก displayDates ที่ถูกกรองแล้ว
                        <Alert 
                            message="ไม่พบข้อมูล" 
                            description={filteredDate 
                                ? `ไม่พบ Folder รูปภาพในวันที่ ${filteredDate.format('DD/MM/YYYY')} สำหรับ ${selectedLane}`
                                : `ไม่พบ Folder รูปภาพใดๆ สำหรับ ${selectedLane}`
                            } 
                            type="info" 
                            showIcon 
                        />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {displayDates.map(date => (
                                <Card
                                    key={date}
                                    className="flex flex-col items-center justify-center p-6 text-center shadow-md rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                                    onClick={() => handleDateClick(date)} 
                                >
                                    <FolderFilled style={{ fontSize: '48px', color: '#facc15' }} />
                                    <div className="mt-4 font-bold text-lg text-gray-700">{dayjs(date).format('YYYY.MM.DD')}</div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>
            </Flex>
        </div>
    );
};

export default PictureLog;