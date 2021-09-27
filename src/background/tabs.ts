import { Callback } from "@/shared/messages";

type CreateProperties = chrome.tabs.CreateProperties;

async function openInRightNextTab(url: string, callback: Callback, options?: CreateProperties) {
  const { index } = await getCurrentTab();
  chrome.tabs.create(
    {
      ...options,
      index: index + 1,
      url
    },
    callback
  );
}

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export {
  openInRightNextTab
}
