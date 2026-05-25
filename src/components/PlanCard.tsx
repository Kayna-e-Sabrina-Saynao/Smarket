import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
            <View style={[styles.featureDot, highlighted && styles.featureDotHighlighted]} />
            <Text style={[styles.featureText, highlighted && styles.featureTextHighlighted]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, highlighted && styles.buttonHighlighted, current && styles.buttonCurrent]}
        onPress={onPress}>
        <Text style={[styles.buttonText, highlighted && styles.buttonTextHighlighted]}>
          {current ? "Plano atual" : buttonText}
        </Text>
      </TouchableOpacity>
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
    borderRadius: 28,
    padding: 1.5,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#eef3f0",
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dce7e0",
  },
  cardHighlighted: {
    backgroundColor: "#f7fcf8",
    borderColor: "#b9d9c0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  name: {
    color: "#173428",
    fontSize: 24,
    fontWeight: "800",
  },
  nameHighlighted: {
    color: "#1f4b34",
  },
  price: {
    color: "#2f5d45",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  priceHighlighted: {
    color: "#25543b",
  },
  recommendedBadge: {
    backgroundColor: "#2f5d45",
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
    color: "#62746a",
    lineHeight: 21,
    marginTop: 14,
    marginBottom: 16,
  },
  descriptionHighlighted: {
    color: "#4d6658",
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#89b298",
    marginTop: 6,
  },
  featureDotHighlighted: {
    backgroundColor: "#2f5d45",
  },
  featureText: {
    color: "#415148",
    flex: 1,
    lineHeight: 20,
  },
  featureTextHighlighted: {
    color: "#30453b",
  },
  button: {
    backgroundColor: "#dce7e0",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonHighlighted: {
    backgroundColor: "#2f5d45",
  },
  buttonCurrent: {
    opacity: 0.88,
  },
  buttonText: {
    color: "#2f5d45",
    fontWeight: "800",
    fontSize: 15,
  },
  buttonTextHighlighted: {
    color: "#fff",
  },
});
