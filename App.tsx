import { setStatusBarNetworkActivityIndicatorVisible, StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Alert, Button, } from 'react-native';
import Cell from "./components/Cell";
import uuid from 'react-native-uuid';
import Constants from "expo-constants";

const { manifest } = Constants;
const characterId = uuid.v4().toString();
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

class GameMessage {
  constructor(uuid: string, msg: string) {
    this.#_data.data = uuid.toString() + ":" + msg
  }

  // private
  #_data = { action: "sendmessage", data: "" }

  toJson() {
    return JSON.stringify(this.#_data)
  }

  toString() {
    return this.#_data.data
  }
};

//const url = 'wss://gcym2i3l2d.execute-api.us-east-2.amazonaws.com/Prod';
var url = ""
if (!manifest?.debuggerHost) {
  url = 'ws://localhost:18080';
} else {
  url = `ws://${manifest.debuggerHost.split(':').shift()}:18080`;
}
//if(Device.isDevice){
//  console.log("isdevice")
//  url = 'ws://192.168,:18080'; //https://stackoverflow.com/a/6310592/9265852
//}
// Don't put websocket instance inside App, bcz everythin inside will 
// be constantly refreshed, thus many connection will be created
var wsock: WebSocket;

export default function App() {
  const [map, setMap] = useState(emptyMap);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [gameMode, setGameMode] = useState("LOCAL"); // LOCAL, REMOTE, BOT??
  const [serverMessages, setServerMessages] = useState<string[]>([]);
  const [ws, setWebSocket] = useState<WebSocket>(wsock);
  const [character, setCharacter] = useState("");
  const [yourColor, setColor] = useState("");

  useEffect(() => {
    if (!character) return

    const serverMessagesList: string[] = [];

    //serverMessagesList.push("set character " + character)

    if (character === 'H') {
      serverMessagesList.push("You are " + "HOST")
    } else if (character === 'P') {
      serverMessagesList.push("You are " + "PLAAYER2")

      setColor(currentTurn)

      ws.send(new GameMessage(characterId, "COLR=" + currentTurn).toJson())
    } else if (character === 'V') {
      serverMessagesList.push("You are " + "VIEWER")
    } else {
      console.log("unknown character")
    }

    setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
  }, [character]); // when character changed

  useEffect(() => {
    if (!yourColor) return

    const serverMessagesList: string[] = [];

    //serverMessagesList.push("set color " + yourColor)

    if (yourColor === 'b') {
      serverMessagesList.push("You are " + "black")
    } else if (yourColor === 'w') {
      serverMessagesList.push("You are " + "white")
    } else {
      console.log("unknown color")
    }

    setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
  }, [yourColor]);

  useEffect(() => {
    //Alert.alert("ws changed")
    if (!ws) return


    ws.onopen = () => {
      const serverMessagesList: string[] = [];
      serverMessagesList.push('Connected')
      ws.send(new GameMessage(characterId, "HOST?").toJson())
      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
    ws.onclose = (e) => {
      const serverMessagesList: string[] = [];
      serverMessagesList.push('Disconnected')
      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
    ws.onerror = (e) => {
      const serverMessagesList: string[] = [];
      const msg = e.message
      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
    ws.onmessage = (e) => {

      const serverMessagesList: string[] = [];
      //serverMessagesList.push(e.data)

      const arr = e.data.split(':')
      const source = arr[0]
      const msg = arr[1]
      if (source === characterId) {
        setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
        return
      }

      //serverMessagesList.push("character = " + character + "isNull = " + (character === ""))

      if (character === "" && msg.startsWith("CHAR=")) {
        setCharacter(msg.substring(msg.length - 1))
      } else if (msg.startsWith("COLR=")) {
        if (character !== 'H') {
          serverMessagesList.push("Player2 joined")
        }
        const t = msg.substring(msg.length - 1)
        setCurrentTurn(t)
        setColor((t === "b") ? "w" : "b")
      } else if (msg.startsWith("NEXT=")) {
        const coords = msg.substring(5).split(',')
        const rowIdx = parseInt(coords[0], 10)
        const colIdx = parseInt(coords[1], 10)

        console.log(yourColor, rowIdx, colIdx)
        onPress(rowIdx, colIdx)
      }

      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
  })

  const submitMessage = (msg: string) => {
    ws.send(msg);
  }

  const onConnectGameServer = () => {
    setWebSocket(new WebSocket(url))
  }

  const onDisconnectGameServer = () => {
    ws.close()
  }

  const onResetGame = () => {
    console.log("reset")
    setMap((existingMap) => {
      const newMap = existingMap.map(row => row.map(cell => ""))
      newMap[3][3] = "b"
      newMap[3][4] = "w"
      newMap[4][4] = "b"
      newMap[4][3] = "w"
      //console.log(newMap)
      return newMap;
    });

    setServerMessages([])
    ws.send(new GameMessage(characterId, "RESET").toJson())
  }

  const updateMap = (gameboard: string[][], rowIdx: number, colIdx: number, currentTurn: string) => {
    // Add current
    gameboard[rowIdx][colIdx] = currentTurn;

    let updatedcount = 0

    const numRow = gameboard.length
    const numCol = gameboard[0].length

    // flip horizonal
    let holLow = colIdx
    for (let j = colIdx - 1; j >= 0; j--) {
      if (gameboard[rowIdx][j] === "") {
        holLow = colIdx
        break
      }
      if (gameboard[rowIdx][j] === currentTurn) {
        holLow = j
        break
      }
    }
    for (let j = holLow + 1; j < colIdx; j++) {
      gameboard[rowIdx][j] = currentTurn
      updatedcount++
    }
    let holHigh = colIdx
    for (let j = colIdx + 1; j < numCol; j++) {
      if (gameboard[rowIdx][j] === "") {
        holHigh = colIdx
        break
      }
      if (gameboard[rowIdx][j] === currentTurn) {
        holHigh = j
        break
      }
    }
    for (let j = colIdx + 1; j < holHigh; j++) {
      gameboard[rowIdx][j] = currentTurn
      updatedcount++
    }

    // flip vertical
    let verLow = rowIdx
    for (let i = rowIdx - 1; i >= 0; i--) {
      if (gameboard[i][colIdx] === "") {
        verLow = rowIdx
        break
      }
      if (gameboard[i][colIdx] === currentTurn) {
        verLow = i
        break
      }
    }
    for (let i = verLow + 1; i < rowIdx; i++) {
      gameboard[i][colIdx] = currentTurn
      updatedcount++
    }
    let verHigh = rowIdx
    for (let i = rowIdx + 1; i < numRow; i++) {
      if (gameboard[i][colIdx] === "") {
        verHigh = rowIdx
        break
      }
      if (gameboard[i][colIdx] === currentTurn) {
        verHigh = i
        break
      }
    }
    for (let i = rowIdx + 1; i < verHigh; i++) {
      gameboard[i][colIdx] = currentTurn
      updatedcount++
    }

    // flip -ve, -ve diagonal
    verLow = rowIdx
    holLow = colIdx
    for (let i = rowIdx - 1, j = colIdx - 1; i >= 0 && j >= 0; i--, j--) {
      if (gameboard[i][j] === "") {
        verLow = rowIdx
        holLow = colIdx
        break
      }
      if (gameboard[i][j] === currentTurn) {
        verLow = i
        holLow = j
        break
      }
    }
    for (let i = verLow + 1, j = holLow + 1; i < rowIdx && j < colIdx; i++, j++) {
      gameboard[i][j] = currentTurn
      updatedcount++
    }
    // flip +ve, +ve diagonal
    verHigh = rowIdx
    holHigh = colIdx
    for (let i = rowIdx + 1, j = colIdx + 1; i < numRow && j < numCol; i++, j++) {
      if (gameboard[i][j] === "") {
        verHigh = rowIdx
        holHigh = colIdx
        break
      }
      if (gameboard[i][j] === currentTurn) {
        verHigh = i
        holHigh = j
        break
      }
    }
    for (let i = rowIdx + 1, j = colIdx + 1; i < verHigh && j < holHigh; i++, j++) {
      gameboard[i][j] = currentTurn
      updatedcount++
    }

    // flip +ve, -ve diagonal
    verHigh = rowIdx
    holLow = colIdx
    for (let i = rowIdx + 1, j = colIdx - 1; i < numRow && j >= 0; i++, j--) {
      if (gameboard[i][j] === "") {
        verHigh = rowIdx
        holLow = colIdx
        break
      }
      if (gameboard[i][j] === currentTurn) {
        verHigh = i
        holLow = j
        break
      }
    }
    for (let i = rowIdx + 1, j = colIdx - 1; i < verHigh && j > holLow; i++, j--) {
      gameboard[i][j] = currentTurn
      updatedcount++
    }
    // flip -ve, +ve diagonal
    verLow = rowIdx
    holHigh = colIdx
    for (let i = rowIdx - 1, j = colIdx + 1; i >= 0 && j < numCol; i--, j++) {
      if (gameboard[i][j] === "") {
        verLow = rowIdx
        holHigh = colIdx
        break
      }
      if (gameboard[i][j] === currentTurn) {
        verLow = i
        holHigh = j
        break
      }
    }
    for (let i = rowIdx - 1, j = colIdx + 1; i > verLow && j < holHigh; i--, j++) {
      gameboard[i][j] = currentTurn
      updatedcount++
    }
    return updatedcount
  }

  const onPress = (rowIndex: number, columnIndex: number) => {
    if (map[rowIndex][columnIndex] !== "") {
      Alert.alert("Position already occupied");
      return;
    }

    ///////////////////////////////////////////////////////////////////
    //                          CAUTION! 
    // newMap = [...map] cannot make a deep copy for an array of array
    ///////////////////////////////////////////////////////////////////
    const newMap = map.map((row) => { return [...row] }) // deep clone
    console.log(character + ": currentTurn = " + currentTurn)
    const updatedCount = updateMap(newMap, rowIndex, columnIndex, currentTurn)
    if (updatedCount === 0) {
      console.log("update count = " + updatedCount)
      console.log(rowIndex + "," + columnIndex)
      Alert.alert("Invalid Move");
      return;
    }

    if (yourColor === currentTurn) {
      ws.send(new GameMessage(characterId, "NEXT=" + rowIndex + "," + columnIndex).toJson())
    }
    setMap(newMap);
    setCurrentTurn(currentTurn === "w" ? "b" : "w");
  };


  return (
    <View style={styles.container}>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Button title='Connect' onPress={() => onConnectGameServer()}> </Button>
        <Button title='Disconnect' onPress={() => onDisconnectGameServer()}></Button>
      </View>

      <View style={styles.header}>
        <Text> Current Turn: {currentTurn === "w" ? "White" : "Black"}</Text>
        <Text> character: {character}</Text>
        <Text> color: {yourColor}</Text>


        <View style={{ backgroundColor: '#ffeece', padding: 5, flexGrow: 1 }}>
          <ScrollView>
            {
              serverMessages.map((item, ind) => {
                return (
                  <Text key={ind}>{item}</Text>
                )
              })
            }
          </ScrollView>
        </View>
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
    paddingTop: 20,
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
