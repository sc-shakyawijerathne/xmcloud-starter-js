import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { PromoImageProps } from './promo-image.props';
import PromoImageRightClient from './PromoImageRight.client';

export const PromoImageRight: React.FC<PromoImageProps> = (props) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="Promo Image: Right" />;
  }

  return <PromoImageRightClient {...props} />;
};
