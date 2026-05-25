import React from "react";
import { StyleSheet, View } from "react-native";

type AppSkeletonProps = {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
};

export function AppSkeleton({
  height = 16,
  width = "100%",
  radius = 12,
}: AppSkeletonProps) {
  return <View style={[styles.base, { height, width, borderRadius: radius }]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#dce7e0",
  },
});
