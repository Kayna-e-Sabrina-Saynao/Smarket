import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { premiumColors, premiumRadius, premiumShadows } from "@/src/theme/premium-ui";

type PlanCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  onPress: () => void;
  current?: boolean;
};

export function PlanCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  buttonText,
  onPress,
  current = false,
}: PlanCardProps) {
  const content = (
    <View style={[styles.card, highlighted && styles.cardHighlighted]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.name, highlighted && styles.nameHighlighted]}>{name}</Text>
          <Text style={[styles.price, highlighted && styles.priceHighlighted]}>{price}</Text>
        </View>

        {highlighted ? (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>Recomendado</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.description, highlighted && styles.descriptionHighlighted]}>
        {description}
      </Text>

      <View style={styles.featuresList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <MaterialIcons
              name="check-circle"
              size={18}
              color={highlighted ? premiumColors.primary : "#86A68F"}
            />
            <Text style={[styles.featureText, highlighted && styles.featureTextHighlighted]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <PremiumButton
        label={current ? "Plano atual" : buttonText}
        onPress={onPress}
        secondary={!highlighted}
        disabled={current}
        style={[styles.button, current && styles.buttonCurrent]}
      />
    </View>
  );

  if (!highlighted) {
    return content;
  }

  return (
    <LinearGradient colors={["#d8f2df", "#eff8f2"]} style={styles.highlightWrap}>
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  highlightWrap: {
    borderRadius: premiumRadius.xl,
    padding: 1.5,
    marginBottom: 16,
  },
  card: {
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
  },
  cardHighlighted: {
    backgroundColor: "#F9FFFB",
    borderColor: "#BBF7D0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  name: {
    color: premiumColors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  nameHighlighted: {
    color: premiumColors.text,
  },
  price: {
    color: premiumColors.primary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  priceHighlighted: {
    color: premiumColors.primary,
  },
  recommendedBadge: {
    backgroundColor: premiumColors.text,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  recommendedBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  description: {
    color: premiumColors.textSecondary,
    lineHeight: 21,
    marginTop: 14,
    marginBottom: 16,
  },
  descriptionHighlighted: {
    color: premiumColors.textSecondary,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureText: {
    color: premiumColors.text,
    flex: 1,
    lineHeight: 20,
  },
  featureTextHighlighted: {
    color: premiumColors.text,
  },
  button: {
    marginTop: 20,
  },
  buttonCurrent: {
    opacity: 0.88,
  },
});
