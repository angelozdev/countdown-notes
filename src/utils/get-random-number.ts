type TOptions = Partial<{
  min: number
  max: number
}>

function getRandomNumber({ max = 100, min = 0 }: TOptions = {}) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default getRandomNumber
