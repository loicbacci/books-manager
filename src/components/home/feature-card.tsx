import {
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiGlobalLine,
  RiStarLine,
} from "@remixicon/react";

import { Card, CardContent } from "@/components/ui/card";

const iconMap = {
  library: RiBookOpenLine,
  stats: RiBarChartBoxLine,
  rating: RiStarLine,
  language: RiGlobalLine,
};

type FeatureIcon = keyof typeof iconMap;

type FeatureCardProps = {
  icon: FeatureIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card className="w-64 text-center">
      <CardContent className="flex flex-col items-center gap-2">
        <Icon className="size-8 text-primary" />
        <h3 className="font-heading text-base font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
