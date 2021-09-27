type ClickSimulatingMethod = "click" | "focus";

function getSimulatingMethod(element: HTMLElement): ClickSimulatingMethod {
  const tagsNeedingFocus = ["input", "select", "textarea"];
  const tagsNeedingFocusSelector = tagsNeedingFocus.join(",");

  const inputTypesNeedingClick = ["button", "checkbox", "file", "image", "radio", "reset", "submit"];
  const inputNeedingClickSelector = inputTypesNeedingClick.map(type => `input[type="${type}"]`).join(",");

  const shouldBeFocused = element.matches(tagsNeedingFocusSelector) && !element.matches(inputNeedingClickSelector);
  return shouldBeFocused ? "focus" : "click";
}

export { getSimulatingMethod }
