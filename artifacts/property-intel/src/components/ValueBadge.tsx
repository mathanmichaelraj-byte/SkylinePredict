import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { PropertyValueLabel } from '@workspace/api-client-react/src/generated/api.schemas';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ValueBadgeProps {
  label: PropertyValueLabel;
  className?: string;
  showIcon?: boolean;
}

export function ValueBadge({ label, className, showIcon = true }: ValueBadgeProps) {
  if (label === 'green') {
    return (
      <Badge variant="green" className={className}>
        {showIcon && <TrendingUp className="w-3 h-3 mr-1" />}
        Good Value
      </Badge>
    );
  }
  
  if (label === 'red') {
    return (
      <Badge variant="red" className={className}>
        {showIcon && <TrendingDown className="w-3 h-3 mr-1" />}
        Risky / Overpriced
      </Badge>
    );
  }

  return (
    <Badge variant="blue" className={className}>
      {showIcon && <Minus className="w-3 h-3 mr-1" />}
      Fair Priced
    </Badge>
  );
}
