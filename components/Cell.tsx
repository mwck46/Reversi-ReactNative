import React, { ClassicElement } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ColorCode } from './GameSettings';

const Cell = (props: any) => {
  const { cell, onPress } = props;

  return (
    <Pressable onPress={() => onPress()} style={styles.cell}>
      {cell === ColorCode.Black && <View style={[styles.circle, styles.blackcircle]} />}
      {cell === ColorCode.White && <View style={[styles.circle, styles.whitecircle]} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    backgroundColor: "green",
    borderWidth: 3,
  },
  blackcircle:{
    backgroundColor: 'black',
  },
  whitecircle:{
    backgroundColor: 'white',
  },
  circle: {
    flex: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "black",
  },
});

export default Cell;