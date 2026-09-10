export function dropdownPanelPosition(buttonRect, toolbarRect) {
  const buttonCenter = buttonRect.left + buttonRect.width / 2;
  const toolbarCenter = toolbarRect.left + toolbarRect.width / 2;

  return buttonCenter > toolbarCenter ? "sw" : "se";
}
