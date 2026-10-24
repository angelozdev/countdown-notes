import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'

type StepperProps = {
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
}

/** − valor +, con un campo editable que se limita a [min, max] al confirmar. */
export function Stepper({
  label,
  min,
  max,
  value,
  onChange,
  decreaseLabel,
  increaseLabel
}: StepperProps) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  const [shown, setShown] = useState(value)
  // el borrador sigue al valor cuando cambia desde afuera (−, + o un límite)
  if (shown !== value) {
    setShown(value)
    setDraft(String(value))
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  function commit() {
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) setDraft(String(value))
    else {
      const next = clamp(parsed)
      setDraft(String(next))
      onChange(next)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-base font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon-lg"
          className="size-12"
          aria-label={decreaseLabel}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          <Minus aria-hidden />
        </Button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
          }}
          className="h-12 w-20 rounded-md border border-input bg-transparent text-center text-xl font-bold tabular-nums"
        />
        <Button
          variant="secondary"
          size="icon-lg"
          className="size-12"
          aria-label={increaseLabel}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  )
}
