var inputList = Array.from(document.querySelectorAll(".gsc_a_at")); // dom nodes of papers gotten from the page
var outputList = []; // info to return

if (!document.querySelector("#gsc_bpf_more").hasAttribute("disabled")) { // the page is not complete
    chrome.runtime.sendMessage({
        action: "tryMore",
        source: inputList.length
    });
} else { // convert and return info
    for (var i = 0; i < inputList.length; ++i) {
        outputList.push({title: inputList[i].innerHTML, author: inputList[i].nextSibling.innerHTML, venue: inputList[i].nextSibling.nextSibling.innerHTML, checked: inputList[i].parentNode.parentNode.firstChild.firstChild.firstChild.checked});
    }
    chrome.runtime.sendMessage({
        action: "getInfo",
        source: {"author": document.querySelector("#gsc_prf_in").innerHTML, "url": window.location.href, "info": outputList}
    });
}