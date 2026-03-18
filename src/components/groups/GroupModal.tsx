"use client"
import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { TransferList, type TransferUser } from "./TransferList"

interface Group {
  cn: string
  description: string
  members: string[] // Array von UIDs oder DNs
}

interface GroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  group?: Group | null
}

export function GroupModal({ open, onOpenChange, onSuccess, group }: GroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<TransferUser[]>([])
  const [allUsers, setAllUsers] = useState<TransferUser[]>([])
  
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!group

  // 1. Alle verfügbaren User laden
  useEffect(() => {
    if (open) {
      const fetchAllUsers = async () => {
        try {
          setLoadingUsers(true)
          const res = await axios.get("/api/users")
          // Mappe LDAP User auf TransferUser Format
          const mapped: TransferUser[] = res.data.map((u: any) => ({
            uid: u.uid,
            displayName: u.displayName,
            photo: u.photo
          }))
          setAllUsers(mapped)
          
          // Falls im Edit-Modus: Aktuelle Mitglieder setzen
          if (group) {
            setGroupName(group.cn)
            setDescription(group.description === "-" ? "" : group.description)
            
            // Wir müssen die UIDs aus den DNs extrahieren falls das Backend DNs liefert,
            // oder das Backend liefert direkt UIDs. Unser GET Route liefert aktuell Strings.
            // Die Mitglieder in 'group.members' sind Strings (DNs oder UIDs).
            const currentMembers = mapped.filter(u => 
              group.members.some(m => m.includes(`uid=${u.uid},`) || m === u.uid)
            )
            setSelectedUsers(currentMembers)
          } else {
            setGroupName("")
            setDescription("")
            setSelectedUsers([])
          }
        } catch (err: any) {
          console.error("Failed to load users for group management", err)
          setError("Fehler beim Laden der Benutzerliste")
        } finally {
          setLoadingUsers(false)
        }
      }
      fetchAllUsers()
    }
  }, [open, group])

  const availableUsers = allUsers.filter(u => !selectedUsers.find(m => m.uid === u.uid))

  const handleSelect = (users: TransferUser[]) => {
    setSelectedUsers(prev => [...prev, ...users])
  }

  const handleDeselect = (users: TransferUser[]) => {
    setSelectedUsers(prev => prev.filter(m => !users.find(u => u.uid === m.uid)))
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const payload = {
        cn: groupName,
        description,
        members: selectedUsers.map(u => u.uid)
      }

      if (isEdit) {
        await axios.patch(`/api/groups/${group.cn}`, payload)
      } else {
        await axios.post("/api/groups", payload)
      }

      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Failed to save group", err)
      setError(err.response?.data?.error || err.message || "Fehler beim Speichern der Gruppe")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Gruppe bearbeiten" : "Gruppe anlegen"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? `Bearbeiten Sie die Details und Mitglieder für '${group.cn}'.`
              : "Definieren Sie eine neue LDAP-Gruppe und fügen Sie direkt Mitglieder hinzu."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 text-red-600 bg-red-50 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        <div className="py-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cn">Gruppenname (cn) <span className="text-red-500">*</span></Label>
              <Input 
                id="cn" 
                placeholder="z.B. Marketing" 
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                disabled={isSubmitting || isEdit}
              />
              {isEdit && <p className="text-[10px] text-slate-400">Der Name (cn) kann nicht direkt geändert werden.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input 
                id="description" 
                placeholder="Marketing Abteilung" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Gruppenmitglieder verwalten</Label>
              {loadingUsers && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
            </div>
            <TransferList 
              availableUsers={availableUsers}
              selectedUsers={selectedUsers}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!groupName || isSubmitting || loadingUsers}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Änderungen speichern" : "Gruppe erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
