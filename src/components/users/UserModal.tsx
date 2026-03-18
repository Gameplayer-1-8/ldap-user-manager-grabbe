"use client"
import { useState, useEffect } from "react"
import { UploadCloud, Loader2, AlertCircle } from "lucide-react"
import axios from "axios"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface User {
  uid: string
  displayName: string
  mail: string
  initials: string
  birthday?: string | null
  department?: string
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  photo?: string | null
  cloudQuota?: string | null
  mailQuota?: string | null
  disabled?: boolean
}

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  user?: User | null
}

export function UserModal({ open, onOpenChange, onSuccess, user }: UserModalProps) {
  const isEdit = !!user
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    uid: "",
    givenName: "",
    sn: "",
    mail: "",
    userPassword: "",
    initials: "",
    birthday: "",
    department: "lehrer",
    phone: "",
    mobile: "",
    photo: "",
    cloudQuota: "10",
    mailQuota: "1",
    disabled: false,
  })

  const [uidTouched, setUidTouched] = useState(false)
  const [mailTouched, setMailTouched] = useState(false)
  const [initialsTouched, setInitialsTouched] = useState(false)

  const getPasswordStrength = (password: string) => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return Math.min(4, Math.floor(score * 0.8)) // Scale to 0-4
  }

  const strength = getPasswordStrength(formData.userPassword)
  const strengthLabels = ["Sehr schwach", "Schwach", "Mittel", "Stark", "Sehr stark"]
  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"]

  // Initialize form when user changes or modal opens
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          uid: user.uid,
          givenName: user.displayName.split(' ')[0] || "",
          sn: user.displayName.split(' ').slice(1).join(' ') || "",
          mail: user.mail,
          userPassword: "",
          initials: user.initials,
          birthday: user.birthday || "",
          department: user.department || "lehrer",
          phone: user.phone || "",
          mobile: user.mobile || "",
          fax: user.fax || "",
          photo: user.photo || "",
          cloudQuota: user.cloudQuota ? user.cloudQuota.replace('GB', '') : "10",
          mailQuota: user.mailQuota ? user.mailQuota.replace('GB', '') : "1",
          disabled: !!user.disabled,
        })
        setUidTouched(true)
        setMailTouched(true)
        setInitialsTouched(true)
      } else {
        setFormData({ uid: "", givenName: "", sn: "", mail: "", userPassword: "", initials: "", birthday: "", department: "lehrer", phone: "", mobile: "", fax: "", photo: "", cloudQuota: "10", mailQuota: "1", disabled: false })
        setUidTouched(false)
        setMailTouched(false)
        setInitialsTouched(false)
      }
      setApiError(null)
      setErrors({})
    }
  }, [open, user])

  // Auto-generate uid (f.lastname), mail, and initials based on givenName and sn
  useEffect(() => {
    if (!isEdit && formData.givenName && formData.sn) {
      const cleanSn = formData.sn.toLowerCase().replace(/\s+/g, '')
      const firstLetter = formData.givenName.charAt(0).toLowerCase()
      
      const generatedUid = `${firstLetter}.${cleanSn}`
      const generatedMail = `${generatedUid}@grabbe-gymnasium.cloud`
      const generatedInitials = formData.sn.substring(0, 3).toUpperCase()
      
      setFormData(prev => ({
        ...prev,
        uid: uidTouched ? prev.uid : generatedUid,
        mail: mailTouched ? prev.mail : (uidTouched ? prev.mail : generatedMail),
        initials: initialsTouched ? prev.initials : generatedInitials
      }))
    }
  }, [formData.givenName, formData.sn, uidTouched, mailTouched, initialsTouched, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target as HTMLInputElement
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    
    if (id === "uid") setUidTouched(true)
    if (id === "mail") setMailTouched(true)
    if (id === "initials") setInitialsTouched(true)
    
    setFormData(prev => ({ ...prev, [id]: finalValue }))
    
    // Clear field-specific error
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500 * 1024) { // 500KB Limit for LDAP
        setApiError("Das Bild ist zu groß (max. 500KB).")
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    // Validate
    const newErrors: Record<string, string> = {}
    if (!formData.uid) newErrors.uid = "Dieses Feld ist erforderlich"
    if (!formData.givenName) newErrors.givenName = "Vorname ist erforderlich"
    if (!formData.sn) newErrors.sn = "Nachname ist erforderlich"
    if (!formData.mail) newErrors.mail = "E-Mail ist erforderlich"
    
    // Passwort ist Pflicht bei Neuanlage, optional bei Edit
    if (!isEdit && !formData.userPassword) {
      newErrors.userPassword = "Passwort ist erforderlich"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      if (isEdit) {
        await axios.patch(`/api/users/${user.uid}`, formData)
      } else {
        await axios.post("/api/users", formData)
      }
      
      onOpenChange(false)
      if (onSuccess) onSuccess()
      
    } catch (err: any) {
      setApiError(err.response?.data?.error || err.message || "Unbekannter Fehler beim Speichern.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Benutzer bearbeiten" : "Benutzer anlegen"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? `Passen Sie die Profileigenschaften von ${user.displayName} an.`
              : "Legen Sie hier einen neuen LDAP-Benutzer an. Füllen Sie alle notwendigen Informationen aus."}
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="flex items-center gap-2 p-3 mt-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{apiError}</p>
          </div>
        )}

        <Tabs defaultValue="identity" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="identity" className="py-2">Identität</TabsTrigger>
            <TabsTrigger value="contact" className="py-2">Kontakt</TabsTrigger>
            <TabsTrigger value="additional" className="py-2">Zusätzlich</TabsTrigger>
            <TabsTrigger value="resources" className="py-2">Ressourcen</TabsTrigger>
            <TabsTrigger value="media" className="py-2">Medien</TabsTrigger>
          </TabsList>

          <div className="py-6 min-h-[300px]">
            <TabsContent value="identity" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="givenName" className={errors.givenName ? "text-red-500" : ""}>
                    Vorname <span className="text-red-500">*</span>
                  </Label>
                  <Input id="givenName" placeholder="Max" value={formData.givenName} onChange={handleChange} disabled={isSubmitting} error={!!errors.givenName} />
                  {errors.givenName && <p className="text-xs text-red-500">{errors.givenName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sn" className={errors.sn ? "text-red-500" : ""}>
                    Nachname <span className="text-red-500">*</span>
                  </Label>
                  <Input id="sn" placeholder="Mustermann" value={formData.sn} onChange={handleChange} disabled={isSubmitting} error={!!errors.sn} />
                  {errors.sn && <p className="text-xs text-red-500">{errors.sn}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="uid" className={errors.uid ? "text-red-500" : ""}>
                    uid (Benutzername) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="uid" placeholder="m.mustermann" value={formData.uid} onChange={handleChange} disabled={isSubmitting || isEdit} error={!!errors.uid} />
                  {errors.uid && <p className="text-xs text-red-500">{errors.uid}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="department">Abteilung / Rolle <span className="text-red-500">*</span></Label>
                  <select 
                    id="department" 
                    value={formData.department} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <option value="lehrer">Lehrer (ou=Lehrer)</option>
                    <option value="verwaltung">Verwaltung (ou=Verwaltung)</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="initials">Kürzel (Optional)</Label>
                  <Input id="initials" placeholder="EM" value={formData.initials} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="userPassword" className={errors.userPassword ? "text-red-500" : ""}>
                    Passwort <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="userPassword" 
                    type="password" 
                    placeholder={isEdit ? "Leer lassen, um Passwort nicht zu ändern" : "Sicheres Passwort wählen"} 
                    value={formData.userPassword} 
                    onChange={handleChange} 
                    disabled={isSubmitting}
                    error={!!errors.userPassword}
                  />
                  {formData.userPassword && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className={strength === 0 ? "text-slate-400" : strength <= 2 ? "text-orange-500" : "text-green-600"}>
                          Stärke: {strengthLabels[strength]}
                        </span>
                        <span className="text-slate-400">{formData.userPassword.length} Zeichen</span>
                      </div>
                      <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((step) => (
                          <div 
                            key={step} 
                            className={`h-full flex-1 transition-all duration-500 ${step <= strength ? strengthColors[strength] : "bg-transparent"}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.userPassword && <p className="text-xs text-red-500">{errors.userPassword}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="mail" className={errors.mail ? "text-red-500" : ""}>
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <Input id="mail" type="email" placeholder="m.mustermann@grabbe-gymnasium.cloud" value={formData.mail} onChange={handleChange} error={!!errors.mail} disabled={isSubmitting} />
                  {errors.mail && <p className="text-xs text-red-500">{errors.mail}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Festnetz (Optional)</Label>
                  <Input id="phone" placeholder="+49 5231 12345" value={formData.phone} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Handy (Optional)</Label>
                  <Input id="mobile" placeholder="+49 171 1234567" value={formData.mobile} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax (Optional)</Label>
                  <Input id="fax" placeholder="+49 5231 54321" value={formData.fax} onChange={handleChange} disabled={isSubmitting} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Geburtstag (Optional)</Label>
                  <Input id="birthday" type="date" value={formData.birthday} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div className="space-y-2 col-span-2 mt-4 pt-4 border-t border-slate-100">
                  <Label className="text-slate-900 font-semibold mb-3 block italic">Konto-Sicherheit</Label>
                  <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${formData.disabled ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="space-y-0.5">
                      <Label htmlFor="disabled" className="font-bold text-slate-900 cursor-pointer">Login für dieses Konto sperren</Label>
                      <p className="text-[11px] text-slate-500 leading-tight pr-4">Ist dieser Schalter aktiv, kann sich der Benutzer nicht mehr am Portal oder an angebundenen Diensten anmelden.</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <input 
                        type="checkbox" 
                        id="disabled" 
                        checked={formData.disabled} 
                        onChange={handleChange}
                        className="peer sr-only"
                        disabled={isSubmitting}
                      />
                      <div className="peer-checked:bg-red-500 h-6 w-11 rounded-full bg-slate-300 transition-all after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                      <UploadCloud className="h-4 w-4" />
                    </div>
                    <Label htmlFor="cloudQuota" className="font-semibold text-slate-700">Cloud Speicherplatz</Label>
                  </div>
                  <div className="relative">
                    <Input 
                      id="cloudQuota" 
                      type="number" 
                      placeholder="z.B. 50" 
                      value={formData.cloudQuota} 
                      onChange={handleChange} 
                      disabled={isSubmitting}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-sm font-medium">
                      GB
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">Gesamter Speicherplatz für Nextcloud/Dateien.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <Label htmlFor="mailQuota" className="font-semibold text-slate-700">Mail Postfach Größe</Label>
                  </div>
                  <select 
                    id="mailQuota" 
                    value={formData.mailQuota === "infinite" ? "infinite" : formData.mailQuota} 
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {[1, 5, 10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size} GB</option>
                    ))}
                    <option value="infinite">Unbegrenzt</option>
                  </select>
                  <p className="text-[11px] text-slate-400 italic">Maximalgröße des E-Mail-Postfachs.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-0">
              <div className="space-y-4">
                <Label>Profilbild (Optional)</Label>
                <div className="flex flex-col items-center gap-6 p-6 border border-slate-200 rounded-xl bg-slate-50/50">
                  {formData.photo ? (
                    <div className="relative group">
                      <img 
                        src={formData.photo} 
                        alt="Preview" 
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-slate-200" 
                      />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, photo: "" }))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-100 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <AlertCircle className="h-4 w-4 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-4 border-white shadow-inner">
                      {formData.initials || "?"}
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-2">
                    <input type="file" id="photo-upload" className="hidden" accept="image/jpeg,image/png" onChange={handleFileChange} disabled={isSubmitting} />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={isSubmitting}
                      className="rounded-full px-6"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> 
                      {formData.photo ? "Bild ändern" : "Bild hochladen"}
                    </Button>
                    <p className="text-[10px] text-slate-400">JPG oder PNG, max 500KB empfohlen.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-slate-100 pt-4 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Benutzer speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
