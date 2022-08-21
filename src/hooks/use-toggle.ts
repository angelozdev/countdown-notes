import React from 'react'

function useToggle(initialValue = false): [boolean, () => void] {
  const [isActive, setIsActive] = React.useState(initialValue)

  const toggle = React.useCallback(() => {
    setIsActive((prevValue) => !prevValue)
  }, [])

  return [isActive, toggle]
}

export default useToggle
