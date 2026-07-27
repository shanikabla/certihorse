"use client"

import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { sendTextMessageAction } from "./actions"

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await sendTextMessageAction(formData)
        formRef.current?.reset()
      }}
      className="border-t bg-background pt-4 space-y-2"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <Textarea
        name="body"
        rows={3}
        maxLength={4000}
        required
        placeholder="Ton message…"
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          Envoyer
        </Button>
      </div>
    </form>
  )
}
