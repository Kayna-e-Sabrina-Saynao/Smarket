import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PremiumButton } from "@/src/components/premium/PremiumButton";
import { premiumColors, premiumRadius, premiumShadows } from "@/src/theme/premium-ui";

type AppEmptyStateProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  onPress?: () => void;
};

export function AppEmptyState({
  title,
  description,
  buttonLabel,
  onPress,
}: AppEmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={["#DCFCE7", "#F0FDF4"]} style={styles.illustration}>
        <View style={styles.cartBase}>
          <View style={styles.cartBasket} />
          <View style={styles.cartHandle} />
          <View style={styles.cartWheelLeft} />
          <View style={styles.cartWheelRight} />
          <View style={styles.listSheet}>
            <View style={styles.listLine} />
            <View style={styles.listLineShort} />
            <View style={styles.listLine} />
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {buttonLabel && onPress ? (
        <PremiumButton label={buttonLabel} onPress={onPress} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: "100%",
    minHeight: 300,
    height: "auto",
    position: "relative",
    overflow: "visible",
    alignItems: "center",
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 32,
    paddingLeft: 16,
    backgroundColor: premiumColors.surface,
    borderRadius: premiumRadius.xl,
    borderWidth: 1,
    borderColor: premiumColors.border,
    boxShadow: premiumShadows.card,
  },
  illustration: {
    width: "72%",
    maxWidth: 220,
    aspectRatio: 1,
    borderRadius: 999,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  cartBase: {
    width: 132,
    height: 106,
    position: "relative",
  },
  cartBasket: {
    position: "absolute",
    left: 18,
    top: 30,
    width: 78,
    height: 42,
    borderWidth: 6,
    borderColor: "#2f5d45",
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  cartHandle: {
    position: "absolute",
    left: 10,
    top: 18,
    width: 34,
    height: 6,
    backgroundColor: "#2f5d45",
    transform: [{ rotate: "-24deg" }],
    borderRadius: 4,
  },
  cartWheelLeft: {
    position: "absolute",
    left: 30,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2f5d45",
  },
  cartWheelRight: {
    position: "absolute",
    left: 82,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2f5d45",
  },
  listSheet: {
    position: "absolute",
    right: 4,
    top: 8,
    width: 48,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 4,
    borderColor: "#9bd8a0",
    paddingHorizontal: 10,
    paddingTop: 12,
    gap: 6,
  },
  listLine: {
    height: 5,
    borderRadius: 2,
    backgroundColor: "#b6d9ba",
  },
  listLineShort: {
    width: "70%",
    height: 5,
    borderRadius: 2,
    backgroundColor: "#b6d9ba",
  },
  title: {
    color: premiumColors.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    color: premiumColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
    maxWidth: 260,
  },
  button: {
    alignSelf: "stretch",
  },
});
