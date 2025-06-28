interface CheckProps {
    variant?: "light" | "dark" | "x" | "x-faded";
    className?: string;
}

export default function Check({ variant = "light", className = "" }: CheckProps) {
    const hasWidthClass = className.includes('w-');
    const classes = [
        !hasWidthClass && "w-5.5",
        "object-contain",
        className
    ].filter(Boolean).join(" ");

    const getSrc = () => {
        switch (variant) {
            case "dark":
                return "/check-dark.svg";
            case "x":
                return "/check-x.svg";
            case "x-faded":
                return "/check-x-faded.svg";
            default:
                return "/check-light.svg";
        }
    };

    return (
        <img src={getSrc()} alt="check" className={classes} />
    );
} 