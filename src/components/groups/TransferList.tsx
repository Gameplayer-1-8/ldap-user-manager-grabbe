"use client"
import { useState } from "react"
import { Search, ChevronRight, ChevronLeft } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

export interface TransferUser {
  uid: string
  displayName: string
  photo?: string | null
}

interface TransferListProps {
  availableUsers: TransferUser[]
  selectedUsers: TransferUser[]
  onSelect: (users: TransferUser[]) => void
  onDeselect: (users: TransferUser[]) => void
}

export function TransferList({ availableUsers, selectedUsers, onSelect, onDeselect }: TransferListProps) {
  const [leftSearch, setLeftSearch] = useState("")
  const [rightSearch, setRightSearch] = useState("")

  const [leftSelected, setLeftSelected] = useState<string[]>([])
  const [rightSelected, setRightSelected] = useState<string[]>([])

  const filteredAvailable = availableUsers.filter(u => 
    u.displayName.toLowerCase().includes(leftSearch.toLowerCase()) || 
    u.uid.toLowerCase().includes(leftSearch.toLowerCase())
  )

  const filteredAssigned = selectedUsers.filter(u => 
    u.displayName.toLowerCase().includes(rightSearch.toLowerCase()) || 
    u.uid.toLowerCase().includes(rightSearch.toLowerCase())
  )

  const handleMoveRight = () => {
    const toMove = availableUsers.filter(u => leftSelected.includes(u.uid))
    onSelect(toMove)
    setLeftSelected([])
  }

  const handleMoveLeft = () => {
    const toMove = selectedUsers.filter(u => rightSelected.includes(u.uid))
    onDeselect(toMove)
    setRightSelected([])
  }

  const toggleLeftSelection = (uid: string) => {
    setLeftSelected(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  const toggleRightSelection = (uid: string) => {
    setRightSelected(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  return (
    <div className="flex items-stretch gap-4 w-full h-[450px]">
      {/* Available Users List */}
      <div className="flex-1 flex flex-col border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
        <div className="p-3 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-sm text-slate-700">Verfügbare Benutzer</h4>
            <span className="bg-white text-slate-500 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200/60 shadow-sm">
              {filteredAvailable.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              value={leftSearch} 
              onChange={e => setLeftSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white rounded-lg shadow-xs" 
              placeholder="Benutzer suchen..." 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/30">
          {filteredAvailable.map(user => (
            <div 
              key={user.uid}
              onClick={() => toggleLeftSelection(user.uid)}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border ${
                leftSelected.includes(user.uid) 
                  ? "bg-blue-50/80 border-blue-200 shadow-sm ring-1 ring-blue-500/20" 
                  : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"
              }`}
            >
              {user.photo ? (
                <img src={user.photo} alt={user.displayName} className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600 ring-2 ring-white shadow-sm shrink-0">
                  {user.displayName.substring(0,2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="font-medium text-slate-900 text-sm truncate">{user.displayName}</div>
                <div className="text-xs text-slate-500 truncate">{user.uid}</div>
              </div>
            </div>
          ))}
          {filteredAvailable.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-sm font-medium">Keine Treffer</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col justify-center gap-3 px-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleMoveRight} 
          disabled={leftSelected.length === 0}
          className="rounded-full shadow-sm h-10 w-10 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleMoveLeft} 
          disabled={rightSelected.length === 0}
          className="rounded-full shadow-sm h-10 w-10 border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-300 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Assigned Users List */}
      <div className="flex-1 flex flex-col border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
        <div className="p-3 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-sm text-slate-700">Zugewiesene Mitglieder</h4>
            <span className="bg-white text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200 shadow-sm ring-1 ring-blue-500/10">
              {filteredAssigned.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              value={rightSearch} 
              onChange={e => setRightSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white rounded-lg shadow-xs" 
              placeholder="Mitglieder suchen..." 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/30">
          {filteredAssigned.map(user => (
            <div 
              key={user.uid}
              onClick={() => toggleRightSelection(user.uid)}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border ${
                rightSelected.includes(user.uid) 
                  ? "bg-blue-50/80 border-blue-200 shadow-sm ring-1 ring-blue-500/20" 
                  : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"
              }`}
            >
              {user.photo ? (
                <img src={user.photo} alt={user.displayName} className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 ring-2 ring-white shadow-sm shrink-0">
                  {user.displayName.substring(0,2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="font-medium text-slate-900 text-sm truncate">{user.displayName}</div>
                <div className="text-xs text-slate-500 truncate">{user.uid}</div>
              </div>
            </div>
          ))}
          {filteredAssigned.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 opacity-70">
              <div className="p-4 bg-white rounded-full shadow-sm ring-1 ring-slate-200">
                <span className="text-3xl">👻</span>
              </div>
              <p className="text-sm font-medium">Noch keine Zuweisungen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
