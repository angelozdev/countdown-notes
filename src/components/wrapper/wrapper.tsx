import { PropsWithChildren } from 'react'
import cx from 'classnames'
import styles from './wrapper.module.css'

type Props = PropsWithChildren<{
  className?: string
}>

function Wrapper({ className, children }: Props) {
  return <div className={cx(styles['wrapper'], className)}>{children}</div>
}

export default Wrapper
