var last = 0; // number of papers gotten from the page before next "tryMore"
var info; // info collected from the page
var result; // result returned by the server
var server = "http://47.88.79.120:8080/ScholarDemo/";
var count; // number of papers of the author, returned by the server

function titleToId(input) { // convert title to id in the page
    var output = [];
    for (var i = 0; i < input.length; ++i) {
        for (var j = 0; j < window.info.length; ++j) {
            if (window.info[j].title == input[i]) {
                output.push(j);
                break;
            }
        }
    }
    return output;
}

function selectAllClick(e) {
    var checkboxs = document.querySelectorAll("td input");
    for (var i = 0; i < checkboxs.length; ++i) {
        if (checkboxs[i].checked != e.target.checked) {
            checkboxs[i].click();
        }
    }
}

function deleteButtonClick(e) {
    chrome.tabs.executeScript(null, {code: "document.querySelector('#gsc_btn_del').click();"});
    window.close();
}

function slideChange(level) {
    var selectAll = document.querySelector('#selectAll'); // uncheck all checkboxes
    if (!selectAll.checked) { selectAll.click(); }
    selectAll.click();
    var table = document.querySelector("#tbody"); // remove the original table
    for (var i = table.children.length - 1; i >= 0; --i) {
        table.removeChild(table.children[i]);
    }
    if (level == 0) { // corner case
        document.querySelector('#numberTip').innerHTML = "0/" + window.info.length;
        return;
    }
    var result = titleToId(window.result[0]["step_" + (level - 1)]); // main process
    document.querySelector('#numberTip').innerHTML = result.length + "/" + window.info.length;
    console.log(result);
    for (var i = 0; i < result.length; ++i) {
        var id = result[i];
        var tr = document.createElement("tr");
        tr.innerHTML = `<td><input name="delete" type="checkbox" value="${id}"></td><td><div class="title">${window.info[id].title}</div><div class="other">${window.info[id].author}</div><div class="other">${window.info[id].venue}</div></td>`;
        tr.firstChild.firstChild.addEventListener('click', checkboxClick);
        tr.firstChild.nextSibling.addEventListener('click', contentClick, true);
        table.appendChild(tr);
    }
}

function contentClick(e) {
    e.target.parentNode.parentNode.firstChild.firstChild.click();
}

function checkboxClick(e) {
    chrome.tabs.executeScript(null, {code: `document.querySelectorAll('.gsc_a_at')[${e.target.value}].parentNode.parentNode.firstChild.firstChild.firstChild.click();`});
}

function showMain() { // init to show main window
    $("#levelSlider").slider({
        formatter: function(value) {
            return "";
        }
    });
    $("#levelSlider").on("change", function(slideEvt) {
        slideChange(slideEvt.value.newValue);
    });
    document.querySelector('#selectAll').addEventListener('click', selectAllClick);
    document.querySelector('#deleteButton').addEventListener('click', deleteButtonClick);
    document.querySelector('#progressLine').hidden = true;
    document.querySelector('#sliderLine').hidden = false;
    document.querySelector('#table').hidden = false;
}

function timeCount() { // update data preparing process
    $.ajax({
        url: server + "ProgressServlet",
        type: "GET",
        success: function(response) {
            var progressBar = document.querySelector('#progressBar');
            var progress = Math.round(Number(response) * 100 / window.count);
            progressBar.setAttribute("aria-valuenow", String(progress));
            progressBar.setAttribute("style", "width: " + progress + "%");
            progressBar.innerHTML = progress + "%";
            if (Number(response) < window.count) {
                setTimeout(timeCount, 1000);
            } else {
                $.ajax({
                    url: server + "ScholarServlet",
                    type: "GET",
                    success: function(response) {
                        window.result = JSON.parse(response);
                        console.log(window.result);
                        showMain();
                    }
                });
            }
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender) { // interact with the page
    if (request.action == "tryMore") {
        if (request.source > window.last) { // need to click "More"
            chrome.tabs.executeScript(null, {code: "document.querySelector('#gsc_bpf_more').click();"});
        }
        window.last = request.source;
        window.setTimeout(function() { chrome.tabs.executeScript(null, {file: "getInfo.js"}); }, 500); // try again
    } else if (request.action == "getInfo") { // finish collecting info
        console.log(request.source);
        window.info = request.source.info;
        for (var i = 0; i < window.info.length; ++i) { // click the boxes which are already checked
            if (window.info[i].checked) {
                chrome.tabs.executeScript(null, {code: `document.querySelectorAll('.gsc_a_at')[${i}].parentNode.parentNode.firstChild.firstChild.firstChild.click();`});
            }
        }
        document.querySelector('#numberTip').innerHTML = "0/" + window.info.length;
        $.ajax({ // ask server to prepare data
            url: server + "DataServlet",
            type: "GET",
            data: {"author": request.source.author, "url": request.source.url, "number": String(window.info.length)},
            success: function(response) {
                console.log(response);
                window.count = Number(response);
                timeCount();
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() { // entrance
    chrome.tabs.executeScript(null, {file: "getInfo.js"});
});