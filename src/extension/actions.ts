enum Action {
  Reload,
  TurnOn,
  Up,
  Down,
  Left,
  Right,
  Click
}

function getAction(event: KeyboardEvent): Action {
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    return Action.Reload;
  }

  const modifierKeysPressed = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  if (!modifierKeysPressed) {
    switch (event.key) {
      case 'f': return Action.TurnOn;
      case 'ArrowUp': return Action.Up;
      case 'ArrowDown': return Action.Down;
      case 'ArrowLeft': return Action.Left;
      case 'ArrowRight': return Action.Right;
      case 'Enter': return Action.Click;
    }
  }

  return null;
}

export {
  Action,
  getAction
}
