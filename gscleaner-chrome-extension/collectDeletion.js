var inputList = Array.from(document.querySelectorAll(".gsc_a_at")); // dom nodes of papers gotten from the page
var outputList = []; // info to return

for (var i = 0; i < inputList.length; ++i) {
    if (inputList[i].parentNode.parentNode.firstChild.firstChild.firstChild.checked) {
        outputList.push(inputList[i].innerHTML);
    }
}
chrome.runtime.sendMessage({
    action: "collectDeletion",
    source: {"title": outputList}
});