import {
    HiOutlineColorSwatch,
    HiOutlineDesktopComputer,
    HiOutlineTemplate,
    HiOutlineViewGridAdd,
    HiOutlineHome,
} from 'react-icons/hi'
import { FaTrafficLight ,FaTachometerAlt } from 'react-icons/fa'
import { BiSolidDashboard } from "react-icons/bi";
import { LuHistory } from "react-icons/lu";
import { UserOutlined , PictureOutlined , DashboardOutlined} from '@ant-design/icons'
import { GrPerformance } from "react-icons/gr";
import { TbDeviceCctvFilled } from "react-icons/tb";
import { GrDocumentConfig } from "react-icons/gr";
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <HiOutlineHome />,
    traffic: <FaTrafficLight />,
    user: <UserOutlined />,
    picture: <PictureOutlined />,
    dashboard: <BiSolidDashboard />,
    history: <LuHistory />,
    performance: <GrPerformance />,
    camera: <TbDeviceCctvFilled />,
    permissionconfig: <GrDocumentConfig />,
}

export default navigationIcon
