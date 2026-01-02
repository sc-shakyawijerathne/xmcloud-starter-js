'use client';

import { useContext, useRef } from 'react';
import { useInView } from 'framer-motion';
import NextImage, { ImageProps } from 'next/image';
import { ImageField, Image as ContentSdkImage, useSitecore } from '@sitecore-content-sdk/nextjs';
import { ImageOptimizationContext } from '@/components/image/image-optimization.context';
import placeholderImageLoader from '@/utils/placeholderImageLoader';

type Props = {
  image?: ImageField;
  className?: string;
  sizes?: string;
  priority?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export default function ClientImage({ image, className, sizes, ...rest }: Props) {
  const { page } = useSitecore();
  const { isEditing, isPreview } = page.mode;

  const { unoptimized } = useContext(ImageOptimizationContext);
  const ref = useRef(null);
  const inView = useInView(ref);

  const src = image?.value?.src ?? '';
  const isSvg = src.endsWith('.svg');
  const isPicsum = src.includes('picsum.photos');

  // Return null if not in editing/preview mode and no image source
  if (!isEditing && !isPreview && !src) {
    return null;
  }

  const isUnoptimized =
    unoptimized ||
    isSvg ||
    (src.startsWith('https://') &&
      typeof window !== 'undefined' &&
      !src.includes(window.location.hostname));

  if (isEditing || isPreview || isSvg) {
    return <ContentSdkImage field={image} className={className} />;
  }

  return (
    <NextImage
      ref={ref}
      {...(image?.value as ImageProps)}
      className={className}
      unoptimized={isUnoptimized}
      priority={inView}
      loader={isPicsum ? placeholderImageLoader : undefined}
      placeholder="blur"
      blurDataURL={src}
      sizes={sizes}
      {...(!image?.value?.width && isSvg ? { width: 16, height: 16 } : {})}
      {...rest}
    />
  );
}
