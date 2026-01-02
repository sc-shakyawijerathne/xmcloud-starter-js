import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { PromoImageProps } from './promo-image.props';
import PromoImageLeftClient from './PromoImageLeft.client';

export const PromoImageLeft: React.FC<PromoImageProps> = (props) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="Promo Image: Left" />;
  }

  return <PromoImageLeftClient {...props} />;
};
