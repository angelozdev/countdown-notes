import React from 'react'
import cx from 'classnames'
import styles from './input.module.css'

type NativeProps = React.InputHTMLAttributes<HTMLInputElement>
type Props = NativeProps

function Input({ className, ...rest }: Props) {
  return <input className={cx(styles['input'], className)} {...rest} />
}

export default Input
