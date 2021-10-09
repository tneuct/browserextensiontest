import { sendMessagePromise } from "./chrome-promises";
import Tab = chrome.tabs.Tab;
import { ContentScriptRequest } from "./contentscriptrequests";

function getActiveTab(): Promise<Tab | null> {
  return chrome.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => tabs?.[0] ?? null);
}

async function getSessionIdFromTab(
  tab: chrome.tabs.Tab
): Promise<string | null> {
  if (tab.id === undefined) return Promise.resolve(null);

  return await sendMessagePromise(tab.id, {
    command: ContentScriptRequest.GET_SESSION,
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("action-button")!;
  const statusText = document.getElementById("statusText")!;

  // Get or set sessionId of tab
  getActiveTab().then(async (tab) => {
    if (!tab || tab.id === undefined) {
      return;
    }
    let sessionId = await getSessionIdFromTab(tab);

    if (sessionId === null) {
      const apiResponse = await fetch("http://127.0.0.1:8000/session");
      sessionId = await apiResponse.json();
      await sendMessagePromise(tab.id, {
        command: ContentScriptRequest.SET_SESSION,
        sessionId,
      });
    }

    statusText.textContent = `Session ID: ${sessionId}`;
  });

  button.addEventListener("click", async (ev) => {
    const tab = await getActiveTab();
    if (!tab || tab.id === undefined) {
      return;
    }

    const sessionId = await getSessionIdFromTab(tab);
    if (sessionId === null) {
      statusText.textContent = "Can't submit without session id";
      return;
    }
    const meals = await sendMessagePromise(tab.id, {
      command: ContentScriptRequest.GET_MEALS,
    });

    await fetch(`http://127.0.0.1:8000/${sessionId}/meals`, {
      method: "POST",
      body: JSON.stringify(meals),
      headers: { "Content-Type": "application/json" },
    });

    statusText.textContent = "Meals submitted!";
  });
});
