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
  children?: React.ReactNode;
  variant?: "button" | "label";
  disableBtns?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DialogDemo({ disableBtns, classNameBtn, contentBtn, title, description, nameConfirmBtn, children, variant = "button", onSubmit, open, onOpenChange }: DialogDemoProps) {
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

      <DialogContent className="sm:max-w-sm">
        <form className="min-w-0" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{title || "Title"}</DialogTitle>
            <DialogDescription>
              {description || "Description for the dialog."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {children}
          </div>

          {!disableBtns ?
            (<DialogFooter>
              <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>}>
              </DialogClose>
              <Button type="submit">{nameConfirmBtn || "Confirmar"}</Button>
            </DialogFooter>)
            : null
          } 

        </form>
      </DialogContent>
    </Dialog>
  )
}
