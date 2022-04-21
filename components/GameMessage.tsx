export class GameMessage {
  message: string;
  sender: string;
  remarks: string;

  constructor(sender:string, message: string, remarks: string = "") {
    this.sender = sender
    this.message = message 
    this.remarks = remarks 
  }

  toString() {
    return JSON.stringify({
      sender : this.sender,
      message : this.message,
      remarks : this.remarks
    })
  }

  static parseFromSocket(msg: string) {
    const msgObj = JSON.parse(msg)
    return new GameMessage(msgObj.sender, msgObj.message, msgObj.remarks)
  }
}