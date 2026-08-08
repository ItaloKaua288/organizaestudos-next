export default function Loading() {
  return (
    <div className="fixed left-0 right-0 top-18 z-100 h-0.5 overflow-hidden">
      <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}