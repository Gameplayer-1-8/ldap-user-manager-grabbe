"use client"

import { Users, Users2, Settings, Server, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "../../lib/utils"
import axios from "axios"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    { name: "Benutzer", path: "/users", icon: Users },
    { name: "Gruppen", path: "/groups", icon: Users2 },
    { name: "Einstellungen", path: "/settings", icon: Settings },
  ]

  return (
    <aside className="w-[280px] bg-[#0A0F1C] text-slate-300 flex flex-col h-screen border-r border-slate-800/50 shadow-xl relative z-50">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
          <Server size={20} className="text-white shrink-0" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-slate-300">LDAP Admin</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Directory Manager</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500/80">Verwaltung</div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              )}
              
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-slate-200"
              )}>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 m-4 rounded-xl bg-slate-800/20 border border-slate-800 flex items-center gap-3 group/profile">
        <div className="h-9 w-9 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-slate-900">
          AD
        </div>
        <div className="flex flex-col flex-1 truncate">
          <span className="text-sm font-medium text-slate-200 truncate line-clamp-1">LDAP Admin</span>
          <span className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">Administrator</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
          title="Abmelden"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
