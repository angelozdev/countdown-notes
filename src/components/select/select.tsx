import React from 'react'
import styles from './select.module.css'
import cx from 'classnames'

type NativeProps = React.SelectHTMLAttributes<HTMLSelectElement>
type Props = NativeProps & {
  items: Array<{
    value: string
    label: string
  }>
}

function Select({ items, className, ...rest }: Props) {
  return (
    <select className={cx(styles['select'], className)} {...rest}>
      {items.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}

export default Select
