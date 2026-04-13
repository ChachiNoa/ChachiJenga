import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Progress = forwardRef(({ className, value = 0, max = 100, ...props }, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      ref={ref}
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})
Progress.displayName = 'Progress'

export { Progress }
