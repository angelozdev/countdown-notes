import getRandomNumber from './get-random-number'

function shuffle<T>(array: Array<T>) {
  const shuffledArray = [...array]
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = getRandomNumber({ min: 0, max: i })
    ;[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]
  }
  return shuffledArray
}

export default shuffle
