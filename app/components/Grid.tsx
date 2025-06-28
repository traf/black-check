interface GridProps {
  rows: number;
  cols: number;
  className?: string;
}

export default function Grid({ rows, cols, className = "" }: GridProps) {
  const gridItems = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div 
      className={`w-full h-full grid absolute inset-0 -z-10 pointer-events-none ${className}`}
      style={{
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {gridItems.map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const isLastRow = row === rows - 1;
        const isLastCol = col === cols - 1;
        
        let borderClasses = "";
        if (!isLastCol) borderClasses += "border-r ";
        if (!isLastRow) borderClasses += "border-b ";
        borderClasses += "border-neutral-800";
        
        return (
          <div 
            key={index} 
            className={borderClasses}
          />
        );
      })}
    </div>
  );
} 