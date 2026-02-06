"use client";

import { Box, Heading, Icon, Text } from "@chakra-ui/react";
import { FiBarChart2, FiBookOpen, FiGlobe, FiStar } from "react-icons/fi";

const iconMap = {
  library: FiBookOpen,
  stats: FiBarChart2,
  rating: FiStar,
  language: FiGlobe,
};

type FeatureIcon = keyof typeof iconMap;

type FeatureCardProps = {
  icon: FeatureIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const FeatureIcon = iconMap[icon];

  return (
    <Box
      bg="surface.raised"
      p={6}
      borderRadius="lg"
      boxShadow="card"
      maxW="250px"
      textAlign="center"
    >
      <Icon as={FeatureIcon} boxSize={8} color="brand.fg" mb={2} />
      <Heading as="h3" size="md" mb={2}>
        {title}
      </Heading>
      <Text color="fg.muted" fontSize="sm">
        {description}
      </Text>
    </Box>
  );
}
