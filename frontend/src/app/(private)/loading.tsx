export default function Loading() {
  return (
    <div role="progressbar" aria-label="Carregando" className="fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden">
      <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none" />
    </div>
  );
}
