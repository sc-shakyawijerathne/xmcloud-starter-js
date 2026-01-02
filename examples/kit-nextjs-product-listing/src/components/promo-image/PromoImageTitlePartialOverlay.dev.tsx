import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { PromoImageProps } from './promo-image.props';
import PromoImageTitlePartialOverlayClient from './PromoImageTitlePartialOverlay.client';

export const PromoTitlePartialOverlay: React.FC<PromoImageProps> = (props) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="Promo Image: Title Partial Overlay" />;
  }

  return <PromoImageTitlePartialOverlayClient {...props} />;
};
