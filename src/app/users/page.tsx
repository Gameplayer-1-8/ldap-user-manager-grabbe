"use client"
import { useState, useEffect } from "react"
import { Header } from "../../components/layout/Header"
import { Button } from "../../components/ui/button"
import { Plus, MoreHorizontal, Pencil, KeyRound, Lock, Trash2, AlertCircle } from "lucide-react"
import { UserModal } from "../../components/users/UserModal"
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
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

interface User {
  uid: string
  displayName: string
  mail: string
  initials: string
  photo?: string | null
  birthday?: string | null
  department?: string
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  disabled?: boolean
}

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get<User[]>("/api/users")
      setUsers(res.data)
    } catch (err: any) {
      console.error("Failed to fetch users", err)
      setError(err.response?.data?.error || err.message || "Fehler beim Laden der Benutzer")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLock = async (user: User) => {
    try {
      await axios.patch(`/api/users/${user.uid}`, {
        disabled: !user.disabled
      })
      fetchUsers()
    } catch (err: any) {
      console.error("Failed to toggle lock", err)
      setError(err.response?.data?.error || "Fehler beim Sperren/Entsperren")
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <>
    <Header 
        title="Benutzerverwaltung" 
        description="Verwalten Sie LDAP-Benutzerkonten, deren Berechtigungen und Profile." 
        action={
          <Button onClick={() => {
            setSelectedUser(null)
            setModalOpen(true)
          }} className="rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] px-6">
            <Plus className="mr-2 h-4 w-4" strokeWidth={3} /> Nutzer hinzufügen
          </Button>
        }
      />
      
      <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <TableHead className="w-[80px] pl-4">Profil</TableHead>
                <TableHead>Anzeigename</TableHead>
                <TableHead>Benutzername (uid)</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead className="text-right pr-4">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4 py-3"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right pr-4">
                      <Skeleton className="h-8 w-8 rounded-full inline-block" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 && !error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Keine Benutzer gefunden.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid} className="group hover:bg-slate-50/80 transition-colors">
                    <TableCell className="pl-4 py-3">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm hover:scale-110 transition-transform">
                        <AvatarImage src={user.photo || ""} alt={user.displayName} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">{user.initials}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {user.displayName}
                        {user.disabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold tracking-tight uppercase border border-red-200 shadow-sm animate-pulse">Gesperrt</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{user.uid}</TableCell>
                    <TableCell className="text-slate-500">{user.mail}</TableCell>
                    <TableCell className="text-right pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-200 data-[state=open]:bg-slate-200">
                            <span className="sr-only">Menü öffnen</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="font-medium text-xs uppercase tracking-wider text-slate-500">Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setModalOpen(true)
                          }}>
                            <Pencil className="mr-2 h-4 w-4 text-slate-400" /> Profil bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setModalOpen(true)
                          }}>
                            <KeyRound className="mr-2 h-4 w-4 text-blue-500" /> Passwort ändern
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleLock(user)}>
                            {user.disabled ? (
                              <><Lock className="mr-2 h-4 w-4 text-green-500 rotate-180" /> Konto entsperren</>
                            ) : (
                              <><Lock className="mr-2 h-4 w-4 text-orange-500" /> Konto sperren</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Benutzer löschen
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

      <UserModal 
        open={modalOpen} 
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setSelectedUser(null)
        }} 
        onSuccess={fetchUsers} 
        user={selectedUser}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedUser?.displayName || ""}
        title="Benutzer löschen?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden. Der Benutzer wird auch aus allen Gruppen entfernt."
        onConfirm={async () => {
          if (selectedUser) {
            await axios.delete(`/api/users/${selectedUser.uid}`)
            fetchUsers()
          }
        }}
      />
    </>
  )
}
