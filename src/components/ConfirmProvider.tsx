"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { AlertCircle } from "lucide-react"

type ConfirmContextType = {
  confirm: (message: string) => Promise<boolean>
  prompt: (message: string, defaultValue?: string) => Promise<string | null>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}

export function usePrompt() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("usePrompt must be used within a ConfirmProvider")
  }
  return context.prompt
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPrompt, setIsPrompt] = useState(false)
  const [message, setMessage] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [resolver, setResolver] = useState<(value: any) => void>()

  const confirm = useCallback((msg: string) => {
    setMessage(msg)
    setIsPrompt(false)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolver(() => (val: any) => resolve(val))
    })
  }, [])

  const prompt = useCallback((msg: string, defaultValue: string = "") => {
    setMessage(msg)
    setInputValue(defaultValue)
    setIsPrompt(true)
    setIsOpen(true)
    return new Promise<string | null>((resolve) => {
      setResolver(() => (val: any) => resolve(val))
    })
  }, [])

  const handleConfirm = () => {
    if (resolver) resolver(isPrompt ? inputValue : true)
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (resolver) resolver(isPrompt ? null : false)
    setIsOpen(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-3xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-foreground">تأكيد الإجراء</h3>
              <p className="text-foreground/70 font-medium whitespace-pre-wrap">{message}</p>
              
              {isPrompt && (
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full mt-2 bg-background border border-border rounded-xl px-4 py-3 text-center font-bold outline-none focus:border-primary transition"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm()
                  }}
                />
              )}

              <div className="flex w-full gap-3 mt-4">
                <button 
                  onClick={handleCancel}
                  className="flex-1 bg-muted text-foreground font-bold py-3 rounded-xl hover:bg-muted/80 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition shadow-[0_4px_15px_rgba(239,68,68,0.3)]"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
