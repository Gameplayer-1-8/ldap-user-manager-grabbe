"use client"
import { useState, useEffect } from "react"
import { Header } from "../../components/layout/Header"
import { Button } from "../../components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash2, Users, AlertCircle } from "lucide-react"
import { GroupModal } from "../../components/groups/GroupModal"
import { DeleteConfirmDialog } from "../../components/ui/delete-confirm-dialog"
import { Skeleton } from "../../components/ui/skeleton"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

interface Group {
  cn: string
  description: string
  memberCount: number
  members: string[]
}

export default function GroupsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get<Group[]>("/api/groups")
      setGroups(res.data)
    } catch (err: any) {
      console.error("Failed to fetch groups", err)
      setError(err.response?.data?.error || err.message || "Fehler beim Laden der Gruppen")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  return (
    <>
      <Header 
        title="Gruppenverwaltung" 
        description="Verwalten Sie LDAP-Gruppen und deren Mitglieder." 
        action={
          <Button onClick={() => {
            setSelectedGroup(null)
            setModalOpen(true)
          }} className="rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] px-6">
            <Plus className="mr-2 h-4 w-4" strokeWidth={3} /> Gruppe erstellen
          </Button>
        }
      />
      
      <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-2">
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-xl m-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="bg-transparent hover:bg-transparent">
                <TableHead className="pl-6">Gruppenname (cn)</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Mitglieder</TableHead>
                <TableHead className="text-right pr-6">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8 rounded-full" /></TableCell>
                    <TableCell className="text-right pr-6">
                      <Skeleton className="h-8 w-8 rounded-full inline-block" />
                    </TableCell>
                  </TableRow>
                ))
              ) : groups.length === 0 && !error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                    Keine Gruppen gefunden.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.cn} className="group hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-900 pl-6 py-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-200 shadow-sm shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      {group.cn}
                    </TableCell>
                    <TableCell className="text-slate-500">{group.description}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-600 text-xs font-semibold shadow-sm">
                        {group.memberCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-200 data-[state=open]:bg-slate-200">
                            <span className="sr-only">Menü öffnen</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="font-medium text-xs uppercase tracking-wider text-slate-500">Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedGroup(group)
                            setModalOpen(true)
                          }}>
                            <Pencil className="mr-2 h-4 w-4 text-slate-400" /> Gruppe bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => {
                              setSelectedGroup(group)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <GroupModal 
        open={modalOpen} 
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setSelectedGroup(null)
        }} 
        onSuccess={fetchGroups}
        group={selectedGroup} 
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedGroup?.cn || ""}
        title="Gruppe löschen?"
        description="Möchten Sie diese LDAP-Gruppe wirklich unwiderruflich löschen?"
        onConfirm={async () => {
          if (selectedGroup) {
            await axios.delete(`/api/groups/${selectedGroup.cn}`)
            fetchGroups()
          }
        }}
      />
    </>
  )
}
