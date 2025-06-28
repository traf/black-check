import Check from "./Check";

export default function Footer() {
  const progress = 10;
  const totalImages = 10;
  const highlightedImages = Math.floor(progress * totalImages / 64);
  return (
    <footer className="flex-center bg-neutral-950 w-full h-14 border-t border-neutral-800 flex-shrink-0">
      <div className="w-full h-full flex-between px-6 gap-4">
        <p className="text-sm">Black Check progress</p>
        <div className="flex-center gap-2">
          {Array.from({ length: totalImages }, (_, i) => (
            <Check
              key={i}
              variant={i < highlightedImages ? "light" : "x-faded"}
              className="w-4"
            />
          ))}
        </div>
        <p className="text-sm">{progress}/64</p>
      </div>
    </footer>
  );
} 