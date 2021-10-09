import { ContentScriptRequest } from "./contentscriptrequests";

console.log("Hello from lieferando.js");

window.addEventListener("beforeunload", function (e) {
  if (sessionId !== null) {
    // Cancel the event
    e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = "";
  }
});

function scrapeMeals() {
  return Array.from(
    document.querySelectorAll(".meal-name > span.notranslate"),
    //@ts-ignore
    (element) => ({ name: element.attributes["data-product-name"].value })
  );
}

let sessionId: string | null = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );

  if (request.command === ContentScriptRequest.GET_MEALS) {
    sendResponse(scrapeMeals());
  } else if (request.command === ContentScriptRequest.GET_SESSION) {
    sendResponse(sessionId);
  } else if (request.command === ContentScriptRequest.SET_SESSION) {
    sessionId = request.sessionId;
  }
});
