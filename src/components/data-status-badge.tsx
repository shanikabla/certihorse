import { ShieldCheck, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"

type Status = "CERTIFIE" | "DECLARE"

interface Props {
  status: Status
  // Optional source label shown after the status, e.g. "véto · 12/05/26"
  source?: string
  className?: string
}

/**
 * The single visual representation of the CERTIFIE/DECLARE distinction. Used
 * everywhere a "product fact" is shown so that the two statuses are never
 * confused. CERTIFIE is solid + shielded; DECLARE is outlined + edit-pencil.
 */
export function DataStatusBadge({ status, source, className }: Props) {
  if (status === "CERTIFIE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-foreground text-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
          className,
        )}
      >
        <ShieldCheck className="size-3" aria-hidden />
        Certifié
        {source && <span className="opacity-70 normal-case font-normal">· {source}</span>}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-foreground/40 text-foreground/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
    >
      <Pencil className="size-3" aria-hidden />
      Déclaré
      {source && <span className="opacity-70 normal-case font-normal">· {source}</span>}
    </span>
  )
}
