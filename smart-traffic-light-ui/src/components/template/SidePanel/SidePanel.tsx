import classNames from 'classnames'
import Drawer from '@/components/ui/Drawer'
import { HiOutlineUserGroup } from 'react-icons/hi'
import SidePanelContent from './SidePanelContent'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { setPanelExpand, useAppSelector, useAppDispatch } from '@/store'
import type { CommonProps } from '@/@types/common'
import { socket } from '@/services/socket'

// 🔑 FIX 1: นำเข้า setActiveChat
import { setActiveChat } from '@/store/chat' 

type SidePanelProps = CommonProps

const _SidePanel = (props: SidePanelProps) => {
    const dispatch = useAppDispatch()

    const { className, ...rest } = props

    const signedIn = useAppSelector((state) => state.auth.session.signedIn)

    const panelExpand = useAppSelector((state) => state.theme.panelExpand)
    const direction = useAppSelector((state) => state.theme.direction)

    const openPanel = () => {
        dispatch(setPanelExpand(true))
        // ส่ง event ไปขอข้อมูลผู้ใช้ออนไลน์ล่าสุดจาก Server
        socket.emit('request_online_users')
    }

    const closePanel = () => {
        dispatch(setPanelExpand(false))
        
        // 🔑 FIX 2: รีเซ็ต Redux State ของ activeChatEmail เมื่อ Drawer ถูกปิดด้วยทุกวิธี
        dispatch(setActiveChat({ email: null }))

        const bodyClassList = document.body.classList
        if (bodyClassList.contains('drawer-lock-scroll')) {
            bodyClassList.remove('drawer-lock-scroll', 'drawer-open')
        }
    }

    if (!signedIn) {
        return null
    }

    return (
        <>
            <div
                className={classNames('text-2xl', className)}
                onClick={openPanel}
                {...rest}
            >
                <HiOutlineUserGroup />
            </div>
            <Drawer
                title="Online Users"
                isOpen={panelExpand}
                placement={direction === 'rtl' ? 'left' : 'right'}
                width={375}
                onClose={closePanel}
                onRequestClose={closePanel} // ถูกเรียกเมื่อคลิกนอก, กด Esc
            >
                {/* SidePanelContent จะเรียก closePanel ผ่าน callBackClose เมื่อกดปุ่ม 'back' */}
                <SidePanelContent callBackClose={closePanel} />
            </Drawer>
        </>
    )
}

const SidePanel = withHeaderItem(_SidePanel)

export default SidePanel