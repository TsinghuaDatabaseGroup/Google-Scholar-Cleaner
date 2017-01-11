var paperList = Array.from(document.querySelectorAll(".gsc_a_at"));
var resultList = [];
var index = 0;
main();

function main() {
    if (!document.querySelector("#gsc_bpf_more").hasAttribute("disabled")) {
        chrome.runtime.sendMessage({
            action: "tryMore",
            source: paperList.length
        });
        return;
    }
    getNext();
}

function getNext() {
    console.log(index);
    if (index < paperList.length) {
        /*$.ajax({
            url: paperList[index].href,
            type: "GET",
            error: function() {
                console.log('error');
            },
            success: function(response, status, xhr) {
                resultList.push({title: paperList[index].innerHTML, author: $(response).find(".gsc_value").html(), venue: paperList[index].nextSibling.nextSibling.innerHTML});
                ++index;
                getNext();
            }
        });*/
        resultList.push({title: paperList[index].innerHTML, author: paperList[index].nextSibling.innerHTML, venue: paperList[index].nextSibling.nextSibling.innerHTML, checked: paperList[index].parentNode.parentNode.firstChild.firstChild.firstChild.checked});
        ++index;
        getNext();
    } else {
        chrome.runtime.sendMessage({
            action: "getInfo",
            source: {"author": document.querySelector("#gsc_prf_in").innerHTML, "url": window.location.href, "info": resultList}
        });
    }
}