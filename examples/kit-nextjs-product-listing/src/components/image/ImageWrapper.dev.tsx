import { cn } from '@/lib/utils';
import { ImageField, Image as ContentSdkImage, Page } from '@sitecore-content-sdk/nextjs';
import NextImage, { ImageProps } from 'next/image';
import placeholderImageLoader from '@/utils/placeholderImageLoader';

type ImageWrapperProps = {
  image?: ImageField;
  className?: string;
  priority?: boolean;
  sizes?: string;
  blurDataURL?: string;
  alt?: string;
  wrapperClass?: string;
  page?: Page;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// Read unoptimized setting from environment variable (server-side)
const unoptimized = process.env.NEXT_PUBLIC_NEXT_IMAGE_UNOPTIMIZED === 'true';

export const Default: React.FC<ImageWrapperProps> = (props) => {
  const { image, className, wrapperClass, sizes, page, priority = false, blurDataURL, ...rest } = props;
  
  // Get editing/preview mode from page prop if available
  const isEditing = page?.mode?.isEditing ?? false;
  const isPreview = page?.mode?.isPreview ?? false;
  if (isEditing == true)
    console.log('ImageWrapper rendering in editing mode with image:', image);
  if (isPreview == true)
    console.log('ImageWrapper rendering in preview mode with image:', image);

  if (!isEditing && !image?.value?.src) {
    console.debug('image not found', image);
    return <></>;
  }

  const imageSrc = image?.value?.src ? image?.value?.src : '';
  const isSvg = imageSrc.includes('.svg');
  
  // Determine if image should be unoptimized
  // For server components, we check if it's an external URL by checking if it starts with https://
  // and doesn't match common internal patterns (this is a simplified check for server-side)
  const isExternalUrl = imageSrc.startsWith('https://') && 
    !imageSrc.includes(process.env.NEXT_PUBLIC_SITECORE_SITE_NAME || '');
  
  const isUnoptimized = unoptimized || isSvg || isExternalUrl;
  const isPicsumImage = imageSrc.includes('picsum.photos');

  return (
    <div className={cn('image-container', wrapperClass)}>
      {isEditing || isPreview || isSvg ? (
        <ContentSdkImage field={image} className={className} />
      ) : (
        <NextImage
          key={image?.value?.src}
          loader={isPicsumImage ? placeholderImageLoader : undefined}
          {...(image?.value as ImageProps)}
          className={className}
          unoptimized={isUnoptimized}
          priority={priority}
          sizes={isSvg ? undefined : sizes}
          {...(blurDataURL ? { blurDataURL, placeholder: 'blur' as const } : {})}
          //if image is an svg and no width is provide, set a default to avoid error, this will be overwritten by css
          {...(!image?.value?.width && isSvg ? { width: 16, height: 16 } : {})}
          {...rest}
        />
      )}
    </div>
  );
};
