import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Button,
} from 'react-native';
import Cell from "./components/Cell";

const emptyMap = [
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "b", "w", "", "", ""],
  ["", "", "", "w", "b", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
];

export default function App() {
  const [map, setMap] = useState(emptyMap);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [gameMode, setGameMode] = useState("LOCAL"); // LOCAL, REMOTE, BOT??

  useEffect(() => {
    // TODO: determin winer
  }, [map]); // re-run the effect only if currentTurn change

  const onResetGame = () => {
    setMap((existingMap) => {
      //console.log(existingMap)
      const newMap = existingMap.map(row => row.map(cell => ""))
      newMap[3][3] = "b"
      newMap[3][4] = "w"
      newMap[4][4] = "b"
      newMap[4][3] = "w"
      //console.log(newMap)
      return newMap;
    });
  }

  const updateMap = (oldMap: string[][], rowIdx: number, colIdx: number, currentTurn: string) => {
    // Add current
    oldMap[rowIdx][colIdx] = currentTurn;

    const numRow = oldMap.length
    const numCol = oldMap[0].length
    // flip horizonal
    for(let j=colIdx-1; j>=0; j--){
      if(oldMap[rowIdx][j] === "") break
      if(oldMap[rowIdx][j] !== currentTurn) {
        oldMap[rowIdx][j] = currentTurn
      }
    }
    for(let j=colIdx+1; j<numCol; j++){
      if(oldMap[rowIdx][j] === "") break
      if(oldMap[rowIdx][j] !== currentTurn) {
        oldMap[rowIdx][j] = currentTurn
      }
    }

    // flip vertical
    for(let i=rowIdx-1; i>=0; i--){
      if(oldMap[i][colIdx] === "") break
      if(oldMap[i][colIdx] !== currentTurn) {
        oldMap[i][colIdx] = currentTurn
      }
    }
    for(let i=rowIdx+1; i<numRow; i++){
      if(oldMap[i][colIdx] === "") break
      if(oldMap[i][colIdx] !== currentTurn) {
        oldMap[i][colIdx] = currentTurn
      }
    }

    // flip diagonal
    return oldMap
  }

  const onPress = (rowIndex: number, columnIndex: number) => {
    if (map[rowIndex][columnIndex] !== "") {
      Alert.alert("Position already occupied");
      return;
    }

    setMap((existingMap) => {
      //const updatedMap = [...existingMap];
      //updatedMap[rowIndex][columnIndex] = currentTurn;
      const updatedMap: string[][] = updateMap(existingMap, rowIndex, columnIndex, currentTurn)
      
      // updatedMap and existingMap is actually the same
      //console.log(updatedMap === existingMap)
      return updatedMap;
    });

    setCurrentTurn(currentTurn === "w" ? "b" : "w");
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text> Black: you</Text>
        <Text> White: opponent</Text>
      </View>

      <View style={styles.gameboard}>
        {map.map((row, rowIndex) => (

          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, columnIndex) => (
              <Cell
                key={`row-${rowIndex}-col-${columnIndex}`}
                cell={cell}
                onPress={() => onPress(rowIndex, columnIndex)}
              />
            ))}
          </View>

        ))}
      </View>
      <View style={styles.footer}>
        <Button title='Reset' onPress={() => onResetGame()}>
        </Button>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flex: 3,
    borderColor: "red",
    borderWidth: 10
  },
  gameboard: {
    aspectRatio: 1,
    width: "100%",
    borderColor: "black",
    borderWidth: 10
  },
  footer: {
    flex: 1,
    fontSize: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
});
