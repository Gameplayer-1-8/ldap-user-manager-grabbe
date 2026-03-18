import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-6 flex items-center justify-between sticky top-0 z-40 w-full transition-all duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 font-medium">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {action}
      </div>
    </div>
  )
}
