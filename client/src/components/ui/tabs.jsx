import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext({ value: '', onValueChange: () => {} })

function Tabs({ value, onValueChange, className, children, ...props }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children, ...props }) {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx.value === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children, ...props }) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
