import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { PromoImageProps } from './promo-image.props';
import PromoImageMiddleClient from './PromoImageMiddle.client';

export const PromoImageMiddle: React.FC<PromoImageProps> = (props) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="Promo Image: Middle" />;
  }

  return <PromoImageMiddleClient {...props} />;
};
