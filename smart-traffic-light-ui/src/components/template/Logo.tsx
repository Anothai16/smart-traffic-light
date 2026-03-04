import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth = 180,
    } = props

    return (
        <div
            className={classNames('logo', className)}
            style={style} // ปล่อยกรอบนอกไว้ตามธรรมชาติ
        >
            <img
                className={imgClass}
                src='/img/logo/logoRMUTT.png'
                //src={`${LOGO_SRC_PATH}logo-${mode}-${type}.png`}
                alt={`${APP_NAME} logo`}
                style={{ 
                    // บังคับขนาดที่รูปโดยตรง ถ้าเป็นตัวเลขให้เติม px อัตโนมัติ
                    width: typeof logoWidth === 'number' ? `${logoWidth}px` : logoWidth, 
                    height: 'auto',
                    maxWidth: 'none' // ทะลวงกำแพง CSS อื่นที่พยายามจะบีบรูปนี้
                }}
            />
        </div>
    )
}

export default Logo