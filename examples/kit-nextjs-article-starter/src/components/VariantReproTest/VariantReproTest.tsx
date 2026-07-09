import React from 'react';
import { Text, Field } from '@sitecore-content-sdk/react';
import { useComponentProps } from '@sitecore-content-sdk/nextjs';

type Fields = {
  title?: Field<string>;
};

export const Default = (
  props: ReturnType<typeof useComponentProps> & { fields?: Fields },
) => (
  <div
    data-testid="variant-repro-default"
    style={{ border: '3px solid green', padding: 16 }}
  >
    <h2>Variant Repro — Default RENDERED</h2>
    <Text field={props.fields?.title} />
  </div>
);
