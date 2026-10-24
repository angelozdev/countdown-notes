import { Badge } from '@/components/ui/badge'

export default function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <Badge>En construcción</Badge>
      <h1 className="font-heading text-6xl font-black tracking-tight sm:text-8xl">
        Countdown Notes
      </h1>
      <p className="text-lg text-muted-foreground">
        Acompañamiento para improvisar con la guitarra.
      </p>
    </main>
  )
}
