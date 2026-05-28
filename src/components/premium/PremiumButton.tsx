import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { premiumColors, premiumRadius, premiumShadows } from "@/src/theme/premium-ui";

type PremiumButtonProps = {
  label: string;
  onPress: () => void;
  iconRight?: React.ReactNode;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PremiumButton({
  label,
  onPress,
  iconRight,
  secondary = false,
  disabled = false,
  style,
}: PremiumButtonProps) {
  if (secondary) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        disabled={disabled}
        onPress={onPress}>
        <Text style={styles.secondaryText}>{label}</Text>
        {iconRight}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}
      disabled={disabled}
      onPress={onPress}>
      <LinearGradient
        colors={[premiumColors.primary, premiumColors.primarySecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryButton}>
        <Text style={styles.primaryText}>{label}</Text>
        {iconRight}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: premiumRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    boxShadow: premiumShadows.button,
  },
  primaryText: {
    color: premiumColors.surface,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: premiumRadius.md,
    backgroundColor: premiumColors.surface,
    borderWidth: 1,
    borderColor: premiumColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    boxShadow: premiumShadows.soft,
  },
  secondaryText: {
    color: premiumColors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
