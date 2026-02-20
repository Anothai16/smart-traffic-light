// SidePanel.tsx
import React from 'react'
import classNames from 'classnames'
import Drawer from '@/components/ui/Drawer'
import { HiOutlineUserGroup } from 'react-icons/hi'
import SidePanelContent from './SidePanelContent'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { setPanelExpand, useAppSelector, useAppDispatch } from '@/store'
import type { CommonProps } from '@/@types/common'

// 🔑 นำเข้า setActiveChat เพื่อจัดการสถานะการแชทเมื่อปิด Panel
import { setActiveChat } from '@/store/chat' 

type SidePanelProps = CommonProps

const _SidePanel = (props: SidePanelProps) => {
    const dispatch = useAppDispatch()
    const { className, ...rest } = props

    // ดึงสถานะการ Login และข้อมูล User
    const signedIn = useAppSelector((state) => state.auth.session.signedIn)
    const user = useAppSelector((state) => state.auth.user)
    
    const panelExpand = useAppSelector((state) => state.theme.panelExpand)
    const direction = useAppSelector((state) => state.theme.direction)

    const openPanel = () => {
        dispatch(setPanelExpand(true))
    }

    const closePanel = () => {
        dispatch(setPanelExpand(false))
        
        // 🔑 รีเซ็ต Active Chat เมื่อปิด Drawer
        dispatch(setActiveChat({ email: null }))

        const bodyClassList = document.body.classList
        if (bodyClassList.contains('drawer-lock-scroll')) {
            bodyClassList.remove('drawer-lock-scroll', 'drawer-open')
        }
    }

    // 🔑 เงื่อนไขตรวจสอบสิทธิ์ (Role-based Access Control)
    // หากไม่ได้ Login หรือไม่มีสิทธิ์ 'superadmin' ให้ไม่แสดงผลอะไรเลย (Hide Component)
    if (!signedIn || !user.authority?.includes('SuperAdmin')) {
        return null
    }

    return (
        <>
            {/* ปุ่มไอคอนที่จะปรากฏบน Header เฉพาะ Super Admin เท่านั้น */}
            <div
                className={classNames('text-2xl cursor-pointer', className)}
                onClick={openPanel}
                {...rest}
            >
                <HiOutlineUserGroup />
            </div>
            <Drawer
                title="Controller Panel"
                isOpen={panelExpand}
                placement={direction === 'rtl' ? 'left' : 'right'}
                width={375}
                onClose={closePanel}
                onRequestClose={closePanel}
            >
                {/* เนื้อหาข้างในที่มีปุ่ม Play Video และ PI Controller */}
                <SidePanelContent callBackClose={closePanel} />
            </Drawer>
        </>
    )
}

const SidePanel = withHeaderItem(_SidePanel)

export default SidePanel