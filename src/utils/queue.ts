class Queue<T> {
  items: Map<number, T>
  #head: number
  #tail: number

  constructor(initialItems?: T[]) {
    this.items = new Map<number, T>(
      initialItems?.map((item, index) => [index, item])
    )
    this.#head = 0
    this.#tail = initialItems?.length ?? 0
  }

  enqueue(item: T) {
    this.items.set(this.#tail, item)
    this.#tail++
  }

  enqueuGroup(items: T[]) {
    items.forEach(this.enqueue.bind(this))
  }

  dequeue(): T | undefined {
    if (this.#head === this.#tail) {
      return undefined
    }

    const item = this.items.get(this.#head)
    this.items.delete(this.#head)
    this.#head++
    return item
  }

  empty() {
    this.items.clear()
    this.#head = 0
    this.#tail = 0
  }

  get peek(): T | undefined {
    if (this.#head === this.#tail) {
      return undefined
    }

    return this.items.get(this.#head)
  }

  get isEmpty(): boolean {
    return this.#head === this.#tail
  }

  get size(): number {
    return this.#tail - this.#head
  }
}

export default Queue
