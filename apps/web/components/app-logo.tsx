import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 240,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      width={width}
      className={cn(`w-[240px]`, className)}
      viewBox="0 0 750 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <polygon
          points="97.3 68.9 41.5 68.9 41.5 78 106.4 78 106.4 39.4 97.3 39.4 97.3 68.9"
          fill="#27aae0"
          strokeWidth="0"
        />
        <polygon
          points="23.2 68.9 23.2 21.2 97.3 21.2 97.3 30.3 106.4 30.3 106.4 12.1 14.1 12.1 14.1 78 32.3 78 32.3 68.9 23.2 68.9"
          fill="#27aae0"
          strokeWidth="0"
        />
        <polygon
          points="106.4 30.3 106.4 39.4 115.5 39.4 115.5 87.1 41.5 87.1 41.5 78 32.3 78 32.3 96.2 124.6 96.2 124.6 30.3 106.4 30.3"
          fill="#27aae0"
          strokeWidth="0"
        />
        <polygon
          points="97.3 39.4 97.3 30.3 32.3 30.3 32.3 68.9 41.5 68.9 41.5 39.4 97.3 39.4"
          fill="#27aae0"
          strokeWidth="0"
        />
      </g>

      <g>
        <path
          className={'fill-foreground dark:fill-white'}
          d="M161.4,69.5l5.4-6.4c3.7,3.1,7.6,5,12.3,5s5.9-1.5,5.9-3.9h0c0-2.2-1.4-3.3-7.9-5-7.9-2-13.1-4.2-13.1-12h0c0-7.4,6-12.3,14.4-12.3s11.1,1.9,15.3,5.2l-4.7,6.8c-3.6-2.5-7.2-4.1-10.7-4.1s-5.3,1.6-5.3,3.6h0c0,2.5,1.7,3.4,8.5,5.1,8,2.1,12.5,5,12.5,11.8h0c0,8.1-6.2,12.7-15.1,12.7s-12.5-2.2-17.5-6.6Z"
          strokeWidth="0"
        />
        <path
          className={'fill-foreground dark:fill-white'}
          d="M202,35.3h8v32h20v8h-28v-40Z"
          strokeWidth="0"
        />
        <path
          className={'fill-foreground dark:fill-white'}
          d="M237,35.3h9v40h-9v-40Z"
          strokeWidth="0"
        />
        <path
          className={'fill-foreground dark:fill-white'}
          d="M255,35.3h15.7c12.6,0,21.3,8.6,21.3,19.9h0c0,11.4-8.7,20.1-21.3,20.1h-15.7v-40ZM264,43.3v24h6.9c7.3,0,12.1-4.8,12.1-11.9h0c0-7.2-4.9-12.1-12.1-12.1h-6.9Z"
          strokeWidth="0"
        />
        <path
          className={'fill-foreground dark:fill-white'}
          d="M300,35.3h29v8h-21v8h19v8h-19v8h22v8h-30v-40Z"
          strokeWidth="0"
        />
      </g>
      <path
        className={'fill-foreground dark:fill-white'}
        d="M339,36.3h3v18h25v-19h3v40h-3v-19h-25v19h-3v-39Z"
        strokeWidth="0"
      />
      <path
        className={'fill-foreground dark:fill-white'}
        d="M382,35.3h28v3h-25v16h23v3h-23v15h26v3h-29v-40Z"
        strokeWidth="0"
      />
      <path
        className={'fill-foreground dark:fill-white'}
        d="M420,35.3h16.8c4.9,0,8.8,1.5,11.2,3.9,1.9,1.9,3,4.6,3,7.4v1.1c0,6.5-5,10.2-11.7,11l13.1,16.5h-3.8l-12.7-16h-13v16h-3v-40ZM436.4,56.3c6.6,0,11.6-3.4,11.6-9.1h0c0-5.5-4.2-8.9-11.4-8.9h-13.6v18h13.4Z"
        strokeWidth="0"
      />
      <path
        className={'fill-foreground dark:fill-white'}
        d="M459,55.6h0c0-11,8-20.7,20.1-20.7s19.9,9.6,19.9,20.5h0c0,11-8,20.7-20.1,20.7s-19.9-9.6-19.9-20.5ZM496,55.6v-.8c0-8.9-6.8-16.6-15.7-17.3-10.6-.8-18.3,7.5-18.3,17.8v.8c0,8.9,6.8,16.6,15.7,17.3,10.6.8,18.3-7.5,18.3-17.8Z"
        strokeWidth="0"
      />
      <path
        className={'fill-foreground dark:fill-white'}
        d="M509,35.3h28v3h-25v16h23v3h-24v15h26v3h-28v-40Z"
        strokeWidth="0"
      />
      <path
        className={'fill-foreground dark:fill-white'}
        d="M544.2,69.5l1.9-2.2c4.4,4,8.4,5.9,14.2,5.9s10.7-7.9,10.7-7.9h0c0-4.2-2.2-6.7-11.4-8.5-9.7-2-13.6-5.2-13.6-11.3h0c0,0,5.1-10.4,12.5-10.4s9.6,1.6,13.6,4.8l-1.9,2.3c-3.7-3.2-7.5-4.5-11.8-4.5s-10.4,7.5-10.4,7.5h0c0,4.2,2.2,6.8,11.8,8.8,9.3,1.9,13.2,5.2,13.2,11.1h0c0,0-5.2,10.8-12.9,10.8s-11.2-2.1-16-6.3Z"
        strokeWidth="0"
      />
    </svg>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'} prefetch={true}>
      <LogoImage className={className} />
    </Link>
  );
}
