var last = 0;
var info;
var result;
var server = "http://47.88.79.120:8080/ScholarDemo/";
var count;

function getResult(level) { // for test
    var num = level * window.info.length / 4;
    var result = [];
    for (var i = 0; i < num; ++i) {
        result.push(i);
    }
    return result;
}

function titleToId(input) {
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

function trackBarChange(e) {
    var level = e.target.value;
    console.log(level);
    var selectAll = document.querySelector('#selectAll');
    if (!selectAll.checked) { selectAll.click(); }
    selectAll.click();
    var table = document.querySelector("#table");
    for (var i = table.children.length - 1; i >= 0; --i) {
        table.removeChild(table.children[i]);
    }
    if (level == 0) {
        document.querySelector('#numberLabel').innerHTML = "0/" + window.info.length;
        return;
    }
    console.log(window.result);
    console.log("step_" + (level - 1));
    var result = titleToId(window.result[0]["step_" + (level - 1)]); // getResult(level);
    document.querySelector('#numberLabel').innerHTML = result.length + "/" + window.info.length;
    console.log(result);
    for (var i = 0; i < result.length; ++i) {
        var id = result[i];
        var tr = document.createElement("tr");
        tr.innerHTML = `<td><input name="delete" type="checkbox" value="${id}"></td><td><div class="title">${window.info[id].title}</div><div class="other">${window.info[id].author}</div><div class="other">${window.info[id].venue}</div></td>`;
        tr.firstChild.firstChild.addEventListener('click', checkboxClick);
        table.appendChild(tr);
    }
}

function checkboxClick(e) {
    chrome.tabs.executeScript(null, {code: `document.querySelectorAll('.gsc_a_at')[${e.target.value}].parentNode.parentNode.firstChild.firstChild.firstChild.click();`});
}

function enableAll() {
    document.querySelector('#selectAll').disabled = false;
    document.querySelector('#deleteButton').disabled = false;
    document.querySelector('#trackBar').disabled = false;
}

function timeCount() {
    $.ajax({
        url: server + "ProgressServlet",
        type: "GET",
        success: function(response) {
            var radialObj = $('#indicatorContainer').data('radialIndicator');
            radialObj.value(Number(response));
            if (radialObj.value() < window.count) {
                setTimeout(timeCount, 1000);
            } else {
                $.ajax({
                    url: server + "ScholarServlet",
                    type: "GET",
                    //data: {"author": request.source.author},
                    success: function(response) {
                        console.log(response);
                        window.result = JSON.parse(response);
                        console.log(window.result);
                        enableAll();
                    }
                });
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#selectAll').addEventListener('click', selectAllClick);
    document.querySelector('#deleteButton').addEventListener('click', deleteButtonClick);
    document.querySelector('#trackBar').addEventListener('change', trackBarChange);
});

chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getInfo") {
        console.log(request.source);
        window.info = request.source.info;
        for (var i = 0; i < window.info.length; ++i) {
            if (window.info[i].checked) {
                chrome.tabs.executeScript(null, {code: `document.querySelectorAll('.gsc_a_at')[${i}].parentNode.parentNode.firstChild.firstChild.firstChild.click();`});
            }
        }
        document.querySelector('#numberLabel').innerHTML = "0/" + window.info.length;
        $.ajax({
            url: server + "DataServlet",
            type: "GET",
            data: {"author": request.source.author, "url": request.source.url, "number": String(window.info.length)},
            success: function(response) {
                console.log(response);
                window.count = Number(response);
                $('#indicatorContainer').data('radialIndicator').option("maxValue", window.count);
                timeCount();
            }
        });
    } else if (request.action == "tryMore") {
        if (request.source > window.last) {
            chrome.tabs.executeScript(null, {code: "document.querySelector('#gsc_bpf_more').click();"});
        }
        window.last = request.source;
        window.setTimeout(function() { chrome.tabs.executeScript(null, {file: "getInfo.js"}); }, 500);
    }
});

window.onload = function() {
    $('#indicatorContainer').radialIndicator({
        displayNumber: false,
        radius: 5
    });
    chrome.tabs.executeScript(null, {file: "getInfo.js"});
};