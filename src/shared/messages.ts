type MessageType =
  | "reloadRequest"
  | "openTabRequest";

type Message = {
  type: MessageType
  payload?: any
}

type Callback = (response: any) => void

function sendMessage(message: Message, callback?: (response: any) => void) {
  chrome.runtime.sendMessage(message, callback);
}

export {
  Callback,
  Message,
  MessageType,
  sendMessage
}
