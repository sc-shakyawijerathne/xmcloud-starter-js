import type React from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { PageHeaderProps } from './page-header.props';
import PageHeaderDefaultClient from './PageHeaderDefault.client';

export const PageHeaderDefault: React.FC<PageHeaderProps & { isPageEditing: boolean }> = (
  props
) => {
  const { fields } = props;

  if (!fields) {
    return <NoDataFallback componentName="PageHeader" />;
  }

  return <PageHeaderDefaultClient {...props} />;
};
