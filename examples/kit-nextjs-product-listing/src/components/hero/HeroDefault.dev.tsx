import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { HeroProps } from './hero.props';
import HeroDefaultClient from './HeroDefault.client';

export const HeroDefault: React.FC<HeroProps> = (props) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="Hero" />;
  }

  return <HeroDefaultClient {...props} />;
};
