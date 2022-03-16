import { setStatusBarNetworkActivityIndicatorVisible, StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Alert, Button, } from 'react-native';
import Cell from "./components/Cell";
import uuid from 'react-native-uuid';

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

const url = 'wss://gcym2i3l2d.execute-api.us-east-2.amazonaws.com/Prod';
// Don't put websocket instance inside App, bcz everythin inside will 
// be constantly refreshed, thus many connection will be created
var ws: WebSocket;

export default function App() {
  const [map, setMap] = useState(emptyMap);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [yourColor, setYourColor] = useState("");
  const [isConnect, setIsConnect] = useState(false);
  const [gameMode, setGameMode] = useState("LOCAL"); // LOCAL, REMOTE, BOT??
  const [character, setCharacter] = useState(""); // HOST, PLAYER2, VIEWER
  const [serverMessages, setServerMessages] = useState<string[]>([]);

  useEffect(() => {
    // TODO: determin winer
  }, [map]); // re-run the effect only if currentTurn change
  
  useEffect(() => {
    const serverMessagesList: string[] = serverMessages.map(x => x);
    serverMessagesList.push("You are " + character)
    setServerMessages([...serverMessagesList])
    console.log("set character")
  }, [character]); 
  
  useEffect(() => {
    const serverMessagesList: string[] = serverMessages.map(x => x);
    serverMessagesList.push("Your color is " + yourColor)
    setServerMessages([...serverMessagesList])
    console.log("set yourColor")
  }, [yourColor]); 

  useEffect(() => {
    if (!isConnect) return

    const serverMessagesList: string[] = [];
    ws.onopen = () => {
      serverMessagesList.push('Connected')
      setServerMessages([...serverMessagesList])

      ws.send(new GameMessage(characterId, "HOST?").toJson())
    };
    ws.onclose = (e) => {
      serverMessagesList.push('Disconnected')
      setServerMessages([...serverMessagesList])
    };
    ws.onerror = (e) => {
      const msg = e.message
      console.log(msg);
    };
    ws.onmessage = (e) => {
      const arr = e.data.split(':')
      const source = arr[0]
      const msg = arr[1]
      if(source === characterId){
        return
      }
      console.log(e.data);

      if(character === "" && msg.startsWith("HOST=")){
        const c = msg.substring(msg.length - 1)
        console.log(c)
        setCharacter(c)

        if(c === 'H'){
         //serverMessagesList.push("You are " + character)
        }else if(c === 'P'){
          //serverMessagesList.push("You are " + character)
          ws.send(new GameMessage(characterId, "CURR="+currentTurn).toJson())
          setYourColor(currentTurn)
          //serverMessagesList.push("Your color is " + yourColor)
        }else if(c === 'V'){
          //serverMessagesList.push("You are " + character)
        }else{
          console.log("unknown")
        }
      } else if(msg.startsWith("CURR=")){
        if(character !== 'H'){
          serverMessagesList.push("Player2 joined")
        }
        setCurrentTurn(msg.substring(msg.length - 1))
        setYourColor(currentTurn === "b"? "w" : "b")
        //serverMessagesList.push("Your color is " + yourColor)
      } else if(msg.startsWith("NEXT=")){
        const coords = msg.substring(5)
        const rowIdx = parseInt(coords[0], 10) 
        const colIdx = parseInt(coords[1], 10)

        onPress(rowIdx, colIdx)
      }

      setServerMessages([...serverMessagesList])
    };
  }, [isConnect])

  const submitMessage = (msg: string) => {
    ws.send(msg);
  }

  const onConnectGameServer = () => {
    ws = new WebSocket(url)
    setIsConnect(true)
  }

  const onDisconnectGameServer = () => {
    ws.close()
    setIsConnect(false)
  }

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

    setServerMessages([])
    setCharacter("")
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
    const updatedCount = updateMap(newMap, rowIndex, columnIndex, currentTurn)
    if (updatedCount === 0) {
      Alert.alert("Invalid Move");
      return;
    }

    console.log("your color = " + yourColor)
    console.log("curr turn = " + currentTurn)
    if(yourColor === currentTurn)  {
      ws.send(new GameMessage(characterId, "CURR=" + rowIndex + ","+ columnIndex).toJson())
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
