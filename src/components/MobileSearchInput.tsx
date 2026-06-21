"use client";

import { useMobileInputFocus } from "@/hooks/useMobileInputFocus";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  inputClassName?: string;
};

export function MobileSearchInput({ inputClassName, className, onFocus, ...props }: Props) {
  const { ref, onFocus: keepVisible } = useMobileInputFocus<HTMLInputElement>();

  return (
    <div className={className}>
      <input
        {...props}
        ref={ref}
        enterKeyHint="search"
        autoComplete="off"
        className={
          inputClassName ??
          "scroll-mt-28 w-full border border-ink-violet bg-pure-white px-4 py-3 text-base scroll-pb-32"
        }
        onFocus={(e) => {
          keepVisible();
          onFocus?.(e);
        }}
      />
    </div>
  );
}
