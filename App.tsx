import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, Alert, Button,
  Modal, TouchableOpacity, TextInput
} from 'react-native';
import Cell from "./components/Cell";
import { GameMessage } from "./components/GameMessage";
import uuid from 'react-native-uuid';
import Constants from "expo-constants";
import { ColorCode, ColorTable } from './components/GameSettings';

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

const initColor = (Math.random() > 0.5 ? ColorCode.Black: ColorCode.White);

//https://stackoverflow.com/a/6310592/9265852
var url = ""
if (!manifest?.debuggerHost) {
  url = 'ws://localhost:18080';
} else {
  url = `ws://${manifest.debuggerHost.split(':').shift()}:18080`;
}

// Don't put websocket instance inside App, bcz everythin inside will 
// be constantly refreshed, thus many connection will be created
var ws: WebSocket;
export default function App() {
  const [gameBoard, setGameBoard] = useState(emptyMap);
  const [currentTurn, setCurrentTurn] = useState<ColorCode>(initColor);
  const [gameMode, setGameMode] = useState("LOCAL"); // LOCAL, REMOTE, BOT??
  const [isStarted, setIsStarted] = useState(false);
  const [serverMessages, setServerMessages] = useState<string[]>([]);
  const [character, setCharacter] = useState("");
  const [myColor, setMyColor] = useState<ColorCode>(initColor);
  const [gameId, setGameId] = useState('');

  useEffect(() => {
    if (!ws) {
      ws = new WebSocket(url);
    }
    
    ws.onopen = () => {
      const serverMessagesList: string[] = [];
      serverMessagesList.push('Opened connection');
      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
    ws.onclose = (e) => {
      const serverMessagesList: string[] = [];
      serverMessagesList.push('Closed connection')
      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
    ws.onerror = (e) => {
      const serverMessagesList: string[] = [];
      const msg = (e as WebSocketErrorEvent).message;
      serverMessages.push(`[WebSocket Error] ${msg}`)
      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
    ws.onmessage = (e) => {
      const serverMessagesList: string[] = [];
      const msgObj = GameMessage.parseFromSocket(e.data);
      //serverMessagesList.push(e.data)

      if (msgObj.sender === "SERVER") {
        if (msgObj.message === "GAMEID") {
          setGameId(msgObj.remarks);
          setIsStarted(true);
          serverMessagesList.push(`Started new game ID=${msgObj.remarks}, please let your friend know`)
        } else if (msgObj.message === "JOINGAME") {
          setMyColor((msgObj.remarks == ColorCode.Black) ? ColorCode.White : ColorCode.Black);
          setCurrentTurn(msgObj.remarks as ColorCode);
          setIsStarted(true);
        } else if (msgObj.message === "ERROR") {
          serverMessagesList.push(`[Error] ${msgObj.remarks}`)
        } else if (msgObj.message === "GAMEOVER") {
          serverMessagesList.push("WON")
        }
      } else if (msgObj.sender === "RIVAL") {
        if (msgObj.message === "NEXTMOVE") {
          const coords = msgObj.remarks.split(',');
          const rowIdx = parseInt(coords[0], 10);
          const colIdx = parseInt(coords[1], 10);
          console.log(myColor, rowIdx, colIdx);
          onPress(rowIdx, colIdx);
        }
      } else {
        console.log("Message from unknow source received");
      }

      setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])
    };
  })

  const onResetGame = useCallback(() => {
    console.log("reset")
    setGameBoard(emptyMap);
    setServerMessages([])
    ws.send(new GameMessage(characterId, "RESET").toString())
  }, [])

  const updateMap = (gameboard: string[][], rowIdx: number, colIdx: number, currentTurn: ColorCode) => {
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
    if (gameBoard[rowIndex][columnIndex] !== "") {
      Alert.alert("Position already occupied");
      return;
    }

    ///////////////////////////////////////////////////////////////////
    //                          CAUTION! 
    // newMap = [...map] cannot make a deep copy for an array of array
    ///////////////////////////////////////////////////////////////////
    const newMap = gameBoard.map((row) => { return [...row] }) // deep clone
    console.log(character + ": currentTurn = " + currentTurn)
    const updatedCount = updateMap(newMap, rowIndex, columnIndex, currentTurn)
    if (updatedCount === 0) {
      console.log("update count = " + updatedCount)
      console.log(rowIndex + "," + columnIndex)
      Alert.alert("Invalid Move");
      return;
    }

    const serverMessagesList: string[] = [];
    if (myColor === currentTurn) {
      serverMessagesList.push("Me:" + rowIndex + "," + columnIndex)
      ws.send(new GameMessage(characterId, "NEXTMOVE", rowIndex + "," + columnIndex).toString());
    } else {
      serverMessagesList.push("Opponent:" + rowIndex + "," + columnIndex);
    }
    setServerMessages(serverMessages => [...serverMessages, ...serverMessagesList])

    setGameBoard(newMap);
    setCurrentTurn(currentTurn === ColorCode.Black ? ColorCode.White : ColorCode.Black);
  };

  const registerNewGame = useCallback(() => {
    const msg = new GameMessage(characterId, "NEWGAME", myColor.toString()).toString();
    ws.send(msg);
  }, [])

  const joinGame = useCallback(() => {
    const msg = new GameMessage(characterId, "JOINGAME", gameId).toString();
    ws.send(msg);
  }, [gameId])


  const renderModal = () => {
    return (
      <Modal
        animationType={"slide"}
        transparent={true}
        visible={!isStarted}
        style={{ flex: 1, margin: 0 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,.5)' }}>
          <Text style={{ fontSize: 64, fontWeight: '800' }}>
            <Text style={{ color: 'black' }}>R</Text>
            <Text style={{ color: 'white' }}>E</Text>
            <Text style={{ color: 'black' }}>V</Text>
            <Text style={{ color: 'white' }}>E</Text>
            <Text style={{ color: 'black' }}>R</Text>
            <Text style={{ color: 'white' }}>S</Text>
            <Text style={{ color: 'black' }}>I</Text>
          </Text>

          <TouchableOpacity onPress={registerNewGame}>
            <Text style={{ fontSize: 32, color: 'white', fontWeight: '500' }}>
              Host Game
            </Text>
          </TouchableOpacity>


          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', }}>
            <TouchableOpacity onPress={joinGame}>
              <Text style={{ fontSize: 32, color: 'white', fontWeight: '500', }}>
                Join
              </Text>
            </TouchableOpacity>
            <TextInput style={{ marginHorizontal: 10, fontSize: 32, borderWidth: 3, height: 'auto', }}
              value={gameId}
              placeholder="Game ID..."
              onChangeText={newText => setGameId(newText)}
            >
            </TextInput>

          </View>

        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Text style={styles.status}> Current Turn: {ColorTable.get(currentTurn!)}</Text>
          <Text style={styles.status}> Character: {character}</Text>
          <Text style={styles.status}> Color: {myColor}</Text>
          <Text style={styles.status}> Game ID: {gameId}</Text>
        </View>

        <View style={styles.logger}>
          <ScrollView >
            {
              serverMessages.map((item, ind) => {
                return (
                  <Text key={ind}>
                    {item}
                  </Text>
                )
              })
            }
          </ScrollView>
        </View>
      </View>

      <View style={styles.gameboard}>
        {
          gameBoard.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={{ flex: 1, flexDirection: "row", }}>
              {
              row.map((cell, columnIndex) => (
                <Cell key={`row-${rowIndex}-col-${columnIndex}`}
                  cell={cell}
                  onPress={() => onPress(rowIndex, columnIndex)}
                  disabled={myColor != currentTurn}
                />
              ))
              }
            </View>
          ))
        }
      </View>

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flex: 3,
    flexDirection: 'column',
    marginVertical: 5
    //borderColor: "red",
    //borderWidth: 10,
  },
  statusRow: {
    marginHorizontal: 10,
    flexDirection: 'row',
    //justifyContent: 'space-around',
  },
  status: {
    fontSize: 20,
    borderWidth: 1,
    marginRight: 3,
    paddingHorizontal: 5,
  },
  logger: {
    backgroundColor: '#ffeece',
    flexGrow: 1,
    borderWidth: 3,
    marginHorizontal: 10,
    marginTop: 5,
    height: 150,
  },
  gameboard: {
    aspectRatio: 1,
    width: "100%",
    borderColor: "black",
    borderWidth: 5,
    marginTop: 15,
  },
  footer: {
    flex: 1,
    fontSize: 20,
    marginTop: 5,
    alignItems: 'center',
  },
  controlPanel: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  button: {
    marginHorizontal: 3,
  }
});
