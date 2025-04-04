import { cn } from "@/lib/utils";

export const presets = {
  red: "bg-red-100 text-red-700 dark:bg-red-300 dark:text-red-900",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-300 dark:text-orange-900",
  yellow:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-300 dark:text-yellow-900",
  green: "bg-green-100 text-green-700 dark:bg-green-300 dark:text-green-900",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-300 dark:text-blue-900",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-300 dark:text-purple-900",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-300 dark:text-pink-900",
};

export function ModerationAlert({
  children,
  className,
  preset = "orange",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  preset?: keyof typeof presets;
}>) {
  return (
    <div
      className={cn(
        "flex flex-col w-full items-center border-b-2 p-4 text-center gap-4 justify-between rounded-xl",
        presets[preset],
        className,
      )}
    >
      {children}
    </div>
  );
}
