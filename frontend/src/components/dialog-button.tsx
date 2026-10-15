import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type DialogDemoProps = {
  contentBtn?: string | React.ReactNode;
  title?: string;
  classNameBtn?: string;
  description?: string;
  nameConfirmBtn?: string;
  classNameConfirmBtn?: string;
  variantConfirmBtn?: "link" | "default" | "outline" | "secondary" | "ghost" | "destructive" | null | undefined;
  children?: React.ReactNode;
  variant?: "button" | "label";
  disableBtns?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DialogDemo({ 
  disableBtns, 
  classNameBtn, 
  contentBtn, 
  title, 
  description, 
  nameConfirmBtn, 
  classNameConfirmBtn,
  variantConfirmBtn, 
  children, 
  variant = "button", 
  onSubmit, 
  open, 
  onOpenChange 
}: DialogDemoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {variant === "button" ? (
        <DialogTrigger render={<Button variant="outline" className={`${classNameBtn}`}>{contentBtn || "Open Dialog"}</Button>}></DialogTrigger>
      ) : (
        <DialogTrigger className="w-full" nativeButton={false} render={
          <span className="w-full h-auto min-h-0 block p-0 cursor-pointer">
            {contentBtn}
          </span>
        } />
      )}

      {/* 
        1. max-h-[90dvh]: Garante que o modal ocupe no máximo 90% da altura da tela (ótimo para celulares)
        2. w-[95vw] sm:max-w-sm: Garante margens laterais em telas muito pequenas
        3. flex flex-col: Transforma o Dialog em uma coluna flexível
      */}
      <DialogContent className="w-[95vw] sm:max-w-sm max-h-[90dvh] flex flex-col p-4 sm:p-6 overflow-hidden">
        
        {/* O Form precisa ocupar a altura inteira do modal e também ser uma coluna flexível */}
        <form className="flex flex-col flex-1 min-h-0 min-w-0" onSubmit={onSubmit}>
          
          {/* shrink-0 impede que o Header seja esmagado se o conteúdo for gigante */}
          <DialogHeader className="shrink-0">
            <DialogTitle>{title || "Title"}</DialogTitle>
            <DialogDescription>
              {description || "Description for the dialog."}
            </DialogDescription>
          </DialogHeader>

          {/* 
            flex-1: Faz o conteúdo expandir e ocupar o espaço restante
            overflow-y-auto: Adiciona barra de rolagem APENAS no conteúdo, preservando header e footer fixos
          */}
          <div className="flex-1 overflow-y-auto px-1 py-4">
            {children}
          </div>

          {!disableBtns ?
            (
              /* shrink-0 impede o Footer de ser esmagado. 
                 Adicionei mt-auto para empurrar o footer pra baixo caso o modal seja alto e o conteúdo curto */
              <DialogFooter className="shrink-0 mt-auto gap-2 sm:gap-0 pt-2">
                <DialogClose render={<Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>}>
                </DialogClose>
                <Button variant={variantConfirmBtn} className={`w-full sm:w-auto ${classNameConfirmBtn}`} type="submit">
                  {nameConfirmBtn || "Confirmar"}
                </Button>
              </DialogFooter>
            )
            : null
          } 

        </form>
      </DialogContent>
    </Dialog>
  )
}