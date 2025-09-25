// src/views/PictureTest.tsx (FINAL VERSION: Multi-Mode Support)

import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { Card, Flex, Button, Typography, DatePicker, Spin, Alert, Image, Tag, Tooltip, Select } from 'antd';
import { FolderFilled, LeftOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';

import { apiGetAvailableImageDates, apiGetImagesByDateAndLane, ImageObject } from '@/services/ImageService'; 

dayjs.locale('th');
const { Title } = Typography;

const LANE_OPTIONS = [
    'Lane 1 (PC-A)',
    'Lane 2 (PC-B)',
    'Lane 3 (PC-C)',
    'Lane 4 (PC-D)',
];

// 🔴 NEW: ตัวเลือกสำหรับ Lane/Mode
const LANE_MODES = [
    { value: 'ALL', label: 'All Lanes (4 Lanes)' },
    ...LANE_OPTIONS.map(lane => ({ value: lane, label: lane })),
];

const TrafficLog = () => {
    // State สำหรับการนำทางและข้อมูล
    const [selectedDate, setSelectedDate] = useState<string | null>(null); 
    // 🔴 CHANGE: ใช้ 'ALL' เป็นค่าเริ่มต้น
    const [selectedMode, setSelectedMode] = useState<string>('ALL'); 
    const [availableDates, setAvailableDates] = useState<string[]>([]);   
    const [images, setImages] = useState<ImageObject[]>([]);
    
    // State สำหรับการกรองและการโหลด
    const [filteredDate, setFilteredDate] = useState<Dayjs | null>(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null);

    // 💡 Helper: กำหนดรายการ Lane ที่ต้องดึงข้อมูลตาม Mode ที่เลือก
    const lanesToFetch = useMemo(() => {
        return selectedMode === 'ALL' ? LANE_OPTIONS : [selectedMode];
    }, [selectedMode]);

    // *** 1. Logic การดึงรายการวันที่ (Folders) - ปรับให้รองรับหลาย Lane ***
    const loadAvailableDates = useCallback(async (lanes: string[]) => {
        setLoading(true);
        setError(null);
        setAvailableDates([]);
        
        // ถ้าไม่มี Lane ให้ดึงข้อมูล ให้จบการทำงาน
        if (lanes.length === 0) {
            setLoading(false);
            return;
        }

        try {
            const datePromises = lanes.map(lane => apiGetAvailableImageDates(lane));
            const results = await Promise.all(datePromises);
            
            // 💡 FIX: รวมผลลัพธ์ทั้งหมดและใช้ Set เพื่อคัดวันที่ซ้ำออก
            const allDates = results.flat();
            const uniqueDates = Array.from(new Set(allDates)); 
            
            setAvailableDates(uniqueDates);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch available dates for all lanes.');
            setAvailableDates([]);
        } finally {
            setLoading(false);
        }
    }, []); 

    // ✅ 2. useEffect: Trigger การโหลดเมื่อ Mode เปลี่ยน
    useEffect(() => {
        // เมื่อ Mode เปลี่ยน:
        setSelectedDate(null); // 1. กลับสู่หน้าเลือกวันที่
        setImages([]);        // 2. เคลียร์รูปภาพเก่า
        // 💡 เรียก loadAvailableDates ด้วย lanesToFetch
        loadAvailableDates(lanesToFetch); 
    }, [selectedMode, lanesToFetch, loadAvailableDates]);


    // กรองวันที่ตาม DatePicker และเรียงลำดับ
    const displayDates = useMemo(() => {
        const sortedDates = availableDates.slice().sort((a, b) => dayjs(b).diff(dayjs(a)));
        
        if (!filteredDate) return sortedDates;
        
        const filterStr = filteredDate.format('YYYY-MM-DD');
        return sortedDates.filter(date => date === filterStr);
    }, [availableDates, filteredDate]);


    // *** 3. Logic การโหลดรูปภาพเมื่อเลือกวันที่ - ปรับให้รองรับหลาย Lane ***
    const handleDateClick = async (date: string) => {
        setSelectedDate(date);
        setLoading(true); 
        setError(null);
        setImages([]);

        try {
            // 🔴 NEW: ถ้าเป็น 'ALL' ให้วนลูปดึงข้อมูลจากทุก Lane
            if (selectedMode === 'ALL') {
                const imagePromises = LANE_OPTIONS.map(lane => 
                    apiGetImagesByDateAndLane(date, lane)
                );
                const results = await Promise.all(imagePromises);
                // 💡 รวมรูปภาพทั้งหมดเข้าด้วยกัน
                const allImages = results.flat().sort((a, b) => a.timestamp.localeCompare(b.timestamp)); 
                setImages(allImages);
            } else {
                // โหมด Single Lane (โค้ดเดิม)
                const imageList = await apiGetImagesByDateAndLane(date, selectedMode); 
                setImages(imageList);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load images.');
        } finally {
            setLoading(false);
        }
    };
    
    // *** 4. Logic การจัดการการเปลี่ยน Mode (Lane) ***
    const handleModeChange = (mode: string) => {
        // การตั้งค่า State selectedMode ใหม่จะไปกระตุ้น useEffect ด้านบนให้ทำงาน
        setSelectedMode(mode);
        setFilteredDate(null); // รีเซ็ต DatePicker
    };

    // ----------------------------------------------------
    // UI View 2: แสดงรูปภาพภายในวันที่และ Lane ที่เลือก
    // ----------------------------------------------------
    const currentModeText = selectedMode === 'ALL' ? 'All Lanes' : selectedMode;
    
    if (selectedDate) {
        return (
            <Flex vertical gap="large" style={{ padding: '24px' }}>
                <Flex justify="space-between" align="middle" className="mb-6 p-4 border-b border-gray-200">
                    <Button onClick={() => setSelectedDate(null)} icon={<LeftOutlined />}>
                        Back to Dates ({currentModeText})
                    </Button>
                    <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                        Images for {dayjs(selectedDate).format('DD MMMM YYYY')} ({currentModeText})
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
                        <Alert message="ไม่พบข้อมูล" description={`ไม่พบรูปภาพในวันที่ ${selectedDate} สำหรับ ${currentModeText}`} type="info" showIcon />
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
                                                {/* 💡 แสดง Tag Lane เสมอ */}
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
        );
    }

    // ----------------------------------------------------
    // UI View 1: แสดงรายการวันที่ (Folders)
    // ----------------------------------------------------
    return (
        <Flex vertical gap="large" style={{ padding: '24px' }}>
            <Flex justify="space-between" align="middle" className="mb-6 p-4">
                <Title level={4} style={{ margin: 0 }} className="text-gray-800">
                    Traffic Log
                </Title>
                <Flex gap="middle" align="middle">
                    {/* 🔴 NEW: Selector สำหรับเลือก Mode/Lane */}
                    <Select
                        placeholder="Select Mode/Lane"
                        value={selectedMode}
                        onChange={handleModeChange}
                        options={LANE_MODES} // ใช้ LANE_MODES ใหม่
                        style={{ width: 200 }}
                        className="shadow-sm"
                    />
                    <DatePicker 
                        onChange={setFilteredDate} 
                        value={filteredDate}
                        placeholder="Filter by date" 
                        className="shadow-sm" 
                        allowClear
                    />
                </Flex>
            </Flex>
            <Card className="shadow-xl rounded-lg p-6 border border-gray-200">
                <Title level={5} style={{ marginTop: 0 }}>Available Dates for {currentModeText}</Title>
                
                {loading ? (
                    <Flex justify="center" align="middle" style={{ height: 300 }}>
                        <Spin size="large" tip="Loading Folders..." />
                    </Flex>
                ) : error ? (
                     <Alert message="Error" description={error} type="error" showIcon />
                ) : displayDates.length === 0 ? (
                    <Alert 
                        message="ไม่พบข้อมูล" 
                        description={filteredDate 
                            ? `ไม่พบ Folder รูปภาพในวันที่ ${filteredDate.format('DD/MM/YYYY')} สำหรับ ${currentModeText}`
                            : `ไม่พบ Folder รูปภาพใดๆ สำหรับ ${currentModeText}`
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
    );
};

export default TrafficLog;