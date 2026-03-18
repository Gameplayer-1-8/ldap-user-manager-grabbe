"use client"
import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  itemName: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Delete failed", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md animate-in fade-in zoom-in duration-300">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 ring-8 ring-red-50/50">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-center text-slate-500 pt-2">
            {description} <br />
            <span className="font-bold text-slate-900 mt-2 inline-block">"{itemName}"</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex gap-3 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 rounded-xl"
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lösche...
              </>
            ) : (
              "Endgültig löschen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
