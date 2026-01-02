import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { PromoImageProps } from './promo-image.props';
import PromoImageDefaultClient from './PromoImageDefault.client';

export const PromoImageDefault: React.FC<PromoImageProps> = (props) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="Promo Image" />;
  }

  return <PromoImageDefaultClient {...props} />;
};
