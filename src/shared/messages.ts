type MessageType =
  | "reloadRequest";

type Callback = (response: any) => void

function sendMessage(message: MessageType, callback: (response: any) => void) {
  chrome.runtime.sendMessage(message, callback);
}

export {
  Callback,
  MessageType,
  sendMessage
}
