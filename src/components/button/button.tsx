import cx from 'classnames'
import styles from './button.module.css'

type NativeProps = React.ButtonHTMLAttributes<HTMLButtonElement>
type Props = NativeProps

function Button({ children, className, ...rest }: Props) {
  return (
    <button className={cx(styles['button'], className)} {...rest}>
      <span className={styles['content']}>{children}</span>
    </button>
  )
}

export default Button
