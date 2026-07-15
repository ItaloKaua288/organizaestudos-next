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
  nameBtn?: string | React.ReactNode;
  title?: string;
  description?: string;
  nameConfirmBtn?: string;
  children?: React.ReactNode;
};

export function DialogDemo({ nameBtn, title, description, nameConfirmBtn, children }: DialogDemoProps) {
  return (
    <Dialog>
      <form>
        <DialogTrigger render={<Button variant="outline">{nameBtn || "Open Dialog"}</Button>} />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title || "Title"}</DialogTitle>
            <DialogDescription>
              {description || "Description for the dialog."}
            </DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button type="submit">{nameConfirmBtn || "Confirmar"}</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
