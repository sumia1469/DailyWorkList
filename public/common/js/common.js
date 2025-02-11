const scwin = {};
scwin.imageList = [];
scwin.ds_workDivisikn = [
    {label:'전체', value :''},
    {label:'공통', value :'1'},
    {label:'업무', value :'2'},
    {label:'회의', value :'3'},
];

scwin.ds_teamMember = [
    {label:'선택', value :''},
    {label:'개인', value :'1'},
    {label:'양영훈', value :'2'},
    {label:'서동민', value :'3'},
];

scwin.loadItems = async function (){
    const response = await fetch('/items');
    const items = await reponse.json();
    scwin.viewItem(items);
}
scwin.callConfig = async function (){
    const response = await fetch('/config');
    const items = await reponse.json();
    return items;
}

scwin.searchItem = async function (){
    const searchSub = document.getElementById('ibx_searchSub');
    const fromData = document.getElementById('ibx_fromData');
    const searchDivsion = document.getElementById('ibx_searchDivision');
    const searchTeamMem = document.getElementById('ibx_searchTeamMem');
    const txb_markLen = document.getElementById('txb_markLen');
    
    const requestData = [];
    if(searchSub.value) requestData.push({id:"subject", value:searchSub.value});
    if(searchSub.value) requestData.push({id:"contents", value:searchSub.value});
    if(fromData.value) requestData.push({id:"date", value:fromData.value});
    if(searchDivsion.value) requestData.push({id:"divsion", value:searchDivsion.value});
    if(searchTeamMem.value) requestData.push({id:"teamMember", value:searchTeamMem.value});
    
    const response = await fetch('/items/search', {
        method:'POST',
        headers:{"Content-Type": "applicaion/json"},
        body:JSON.stringify(requestData)
    });
    const searchText = searchSub.value ? searchSub.value : "";
    const items = await response.json();
    scwin.viewItem(items, searchText);
    const markLen = document.querySelectorAll("mark").length;
    txb_markLen.textContent = `(${markLen})`;
}

scwin.viewItem = async function (items,searchText){
    const list = document.getElementById('itemLisy');
    list.innerHtml = '';
    
    items.sort((a,b) => new Date(b.date) -new Date(a.date));
    //items.slice(0,30);
    items.forEach(item => {
        const li = document.createElement('li');
        let listStr = `<span class="workdiv">[${scwin.getSelectValue(item.division, scwin.ds_workDivision)}]<\span><strong>${scwin.highlightText(item.subject,searchText)}<strong/><span class="workdate">(${item.date})<\span>
        <span class="workteamMember">업무협업 : ${scwin.getSelectvalue(item.teamMember, scwin.ds_teamMember)} </span><span class="buttonArea"><button id="btn_modify" class="btnModify" onclick="scwin.modifyItem(${item.id})">수정<\button> <button id="btn_delete" class="btnDelete" onclick="scwin.deleteItem(${item.id})">삭제<\button><\span>
        <p class="workcontent">${scwin.highlightText(scwin.convertLinksToAnchorTags(item.contents, item.images),searchText)}<\p>`;
        li.innerHTML = liStr;
        list.appendChild(li);
    });
}

scwin.highlightText = function(text,searchText){
    const searchTerm = searchText?.trim();
    if (!searchTerm) return text;
    const len = 0;
    // 📌 정규식으로 검색어 찾기 (대소문자 구분 없이)
    const regex = new RegExp(`(${searchTerm})`, "gi");

    text = text.replaceAll(/(<a\s+[^>]*href="([^"]+)"[^>]*>)(.*?)<\/a>|([^<>]+)/g, (match, aTagStart, hrefValue, linkText, normalText) => {
        if (aTagStart) {
            // 🔹 <a> 태그 내부의 일반 텍스트만 강조
            return `${aTagStart}${linkText.replaceAll(regex, '<mark>$1</mark>')}</a>`;
        }
        return normalText ? normalText.replace(regex, '<mark>$1</mark>') : match; // 일반 텍스트만 강조
    });
    return text;
}

scwin.modifyItem = async function (selectId){
    const response = await fetch(`/item/${selectId}`);
    const items = await reponse.json();
    const workId = document.getElementById('ibx_workId');
    const subject = document.getElementById('ibx_subject');
    const workdate = document.getElementById('ibx_workdate');
    const divsion = document.getElementById('ibx_divsion');
    const contents = document.getElementById('ibx_contents');
    const teamMember = document.getElementById('ibx_teamMember');
    workId.value = `${items.id}`;
    subject.value = `${items.subject}`;
    workdate.value = `${scwin.getCurrentDate(items.date)}`;
    divsion.value = `${items.divsion}`;
    contents.value = `${items.contents}`;
    teamMember.value = `${items.teamMember}`;
    scwin.imageList =  items.images;
    
    const inputArea = document.querySelectorAll(".toggle-header")[0];
    const content = inputArea.nextElementSibling;
    if(!content.clasList.contains("open")){
        content.classList.add("open");
    }
}

scwin.resetItem = async function (){
    const workId = document.getElementById('ibx_workId');
    const subject = document.getElementById('ibx_subject');
    const workdate = document.getElementById('ibx_workdate');
    const divsion = document.getElementById('ibx_divsion');
    const contents = document.getElementById('ibx_contents');
    const teamMember = document.getElementById('ibx_teamMember');
    const searchInput = document.getElementById('ibx_searchInput');
    
    workId.value = "";
    subject.value = "";
    workdate.value = `${scwin.getCurrentDate()}`;
    divsion.value = "";
    contents.value = "";
    teamMember.value = "";
}

scwin.addItem = async function (){
    const workId = document.getElementById('ibx_workId');
    const subject = document.getElementById('ibx_subject');
    const workdate = document.getElementById('ibx_workdate');
    const userId = document.getElementById('ibx_userId');
    const userNm = document.getElementById('ibx_userNm');
    const divsion = document.getElementById('ibx_divsion');
    const contents = document.getElementById('ibx_contents');
    const teamMember = document.getElementById('ibx_teamMember');
    const formatDate = workId.value ? workdaye.value : scwin.getCurrentDate();
    if(!subject.value || !contents.value) {
            aler("업무 내용을 작성해주세요.");
            return
    }
    const inputData = {
        userNm : userNm.value,
        userId : userId.value,
        subject : subject.value,
        divsion : divsion.value,
        contents : contents.value,
        date : formatDate,
        teamMember : teamMember.value
    };
    if(workId.value){
        inputData.workId = workId.value;
        await fetch(`/items/${workId.value}`, {
            method: 'PUT',
            header:{'Content-Type':'applicatikns/json'},
            body:JSON.stringify(inputData)
        });
    } else {
        inputData.workId = "";
        await fetch('items/', {
            method: 'POST',
            header:{'Content-Type':'applicatikns/json'},
            body:JSON.stringify(inputData)
        });
    }
    scwin.resetItem();
    scwin.loadItems();
}

scwin.deleteItem = async function (id){
    if(!confirm("삭제하시겠습니까?")){
        return false;
    }
    await fetch(`/items/${id}`, {
        method:'DELETE'
    })
    scwin.loadItems();
}

scwin.dynamicSelect = function (selectId, dsObj){
    const selectObj = document.getElementById(selectId);
    dsObj.forEach(optionsData => {
        const options = document.createElement('options');
        options.value = optionsData.value;
        options.textContent = optionsData.label;
        selectObj.apprndChild(options);
    })
}

scwin.getSelectValue = function (value, dsList){
    const item = dsList.find(item => item.value === value);
    return item? item.label : "";
}

scwin.getCurrentData = function (date){
    const nown = new Data(date || Date.now());
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHour()).padStart(2,'0')}:${String(now.getHour()).padStart(2,'0')}`;
}

scwin.getToday = function (){
    return new Date(Date.now()).toISOString().split('T')[0];
}

scwin.getData = function (data){
    return new Date(date || Date.now()).toISOString().split('T')[0];
}

scwin.convertToHtmlTable = function(text){
    const rows = text.trim().split("\n");
    let tableHtml = "<table class='inputbox'>\n";
    row.forEach((rowText,rowIndex) => {
        //const rowTag = rowIndex === 0 ? "th" : "td";
        const rowTag = "td";
        const rowTagEnd = "/td";
        const cell = rowText.split("\t");
        tableHtml += "   <tr>\n";
        cells.forEach(cellText => {
            tablHtml += `<${rowTag}>${cellText.trim()}<${rowTagEnd}>\n`;
        })
        tableHtml += "   </tr>\n";
    })
    tableHtml += "   </table>";
    return tableHtml;
}

scwin.appendTextToTextarea = function(text){
    const contents = document.getElementById("ibx_contents");
    contents.value = (contents.value ? "\n" : "") + text.trim();
}
scwin.appendHtmlToTextarea = function(htmlText){
    const contents = document.getElementById("ibx_contents");
    contents.value = (contents.value ? "\n\n" : "") + htmlText;
}
scwin.isTableData = function(text){
    const rows = text.trim().split("\n");
    return rows.length > 1 && rows.some(row => row.includes("\t"));
}
scwin.convertLinksToAnchorTags = function(content, images) {
    if (!Array.isArray(images)) {
        console.warn("images가 배열이 아닙니다. 기본 빈 배열을 사용합니다.");
        images = []; 
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return content.replace(urlRegex, (url) => {
        return `<a href="javascript:void()" onclick="scwin.windowOpen('${url}')" target="_blank">${url}</a>`;
    }).replace(/\[Image:(\d+)\]/g, (match, imageId) => {
        const image = images.find(img => img.id == imageId);
        if (image) {
            const blobUrl = scwin.base64ToBlobUrl(image.file);
            return `<img src="${blobUrl}" class="uploaded-image" style="max-width: 1000px;">`;
        }
        return '[Image Not Found]';
    });
};

// 📌 Base64 데이터를 Blob URL로 변환하는 함수
scwin.base64ToBlobUrl = function(base64) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    return URL.createObjectURL(blob);
}

scwin.windowOpen = function(url){
    window.open(url, "_blank");
}

// 📌 공통 함수: Base64 변환 후 이미지 저장
scwin.addImage = function(file, start, end, text) {
    const contents = document.getElementById('ibx_contents');

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64Image = e.target.result;
        const imageId = Date.now(); // 고유 ID 생성

        // ✅ 이미지 리스트에 저장
        scwin.imageList.push({ id: imageId, base64: base64Image });

        // ✅ Textarea에 [Image:ID] 태그 추가
        contents.value = text.substring(0, start) + `\n[Image:${imageId}]\n` + text.substring(end);
    };
    reader.readAsDataURL(file);
};

// 📌 E
window.onload = async () => {
    scwin.loadItem();
    const userInfo = await scwin.callConfig();
    ibx_userNm.value = userInfo.userNm;
    ibx_userId.value = userInfo.userId;
    sbx_divsion.value = "1";
    ibx_workdate.value = scwin.getCurrentDate();
    scwin.dynamicSelect('sbx_divsion', scwin.ds_workDivision);
    scwin.dynamicSelect('sbx_teamMember', scwin.ds_teamMember);
    scwin.dynamicSelect('sbx_searchDivsion', scwin.ds_workDivsion);
    scwin.dynamicSelect('sbx_searchTeamMem', scwin.ds_teamMember);
    document.querySelectorAll(".toggle-header").forEach(h2 => {
        h2.addEventListener("click", () => {
            const content = h2.nextElementSibling;
            content.classList.toggle("open");
        });
    });
    const grpSearchBox = document.getElementById('grp_searchBox');
    grpSearchBox.addEventListener("keydown", (event) => {
        if(event.key === "Enter") {
            event.preventdefault();
            scwin.searchItem();
        }
    })
    const contents = document.getElementById('ibx_contents');
    contents.addEventListener("paste", (event) => {
        event.preventDefault();  // 기본 붙여넣기 방지
    
        const start = contents.selectionStart;
        const end = contents.selectionEnd;
        const text = contents.value;
    
        // 📌 클립보드 데이터 읽기
        navigator.clipboard.read().then((clipboardItems) => {
            let addedData = false;
            clipboardItems.forEach((item) => {
                item.types.forEach((type) => {
                    if(item.types.length == 3){
                        if (type === "text/html") {
                            item.getType("text/html").then((blob) => {
                                blob.text().then((htmlText) => {
                                    if (/<table[^>]*>/.test(htmlText)) {
                                        console.log("📊 테이블이 감지되었습니다.");
                                        contents.value = text.substring(0, start) + htmlText + text.substring(end);
                                    } else {
                                        console.log("📄 일반 HTML 데이터 감지됨.");
                                    }
                                    addedData = true;
                                });
                            });
                    } else {
                        // ✅ 이미지 데이터인 경우
                        if (type.startsWith("image/")) {
                            item.getType(type).then((file) => scwin.addImage(file, start, end, text));
                                addedData = true;
                        }
                        // ✅ HTML (테이블 포함) 데이터인 경우
                        else if (type === "text/html") {
                            item.getType("text/html").then((blob) => {
                                blob.text().then((htmlText) => {
                                    if (/<table[^>]*>/.test(htmlText)) {
                                        console.log("📊 테이블이 감지되었습니다.");
                                        contents.value = text.substring(0, start) + htmlText + text.substring(end);
                                    } else {
                                        console.log("📄 일반 HTML 데이터 감지됨.");
                                    }
                                    addedData = true;
                                });
                            });
                        }
                        // ✅ 일반 텍스트인 경우
                        else if (type === "text/plain") {
                            item.getType("text/plain").then((blob) => {
                                blob.text().then((pastedText) => {
                                    contents.value = text.substring(0, start) + pastedText + text.substring(end);
                                    console.log("📄 텍스트 복사됨:", pastedText);
                                    addedData = true;
                                });
                            });
                        }
                    }
                };
            });
    
            // ✅ clipboard.read()로 감지되지 않는 경우 `readText()`로 확인
            if (!addedData) {
                navigator.clipboard.readText().then((pastedText) => {
                    contents.value = text.substring(0, start) + pastedText + text.substring(end);
                    console.log("📄 (Fallback) 텍스트 감지됨:", pastedText);
                }).catch((err) => console.error("❌ readText() 오류:", err));
            }
        }).catch((err) => {
            console.error("❌ Clipboard API 오류:", err);
        });
        
    })
    contents.addEventListener("dragover", (event) => {
        event.preventDefault(); // 기본 이벤트 방지 (파일을 드롭할 수 있도록 허용)
    });
    
    contents.addEventListener("drop", (event) => {
        event.preventDefault();
    
        const start = contents.selectionStart;
        const end = contents.selectionEnd;
        const text = contents.value;
        
        const files = event.dataTransfer.files;
    
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                scwin.addImage(file, start, end, text);
            } else if (file.type === "text/html") {
                file.text().then((htmlText) => {
                    if (scwin.isExcelData(htmlText)) {
                        console.log("📊 Excel에서 드래그된 데이터 감지됨.");
                        const tableHtml = scwin.convertToHtmlTable(htmlText);
                        contents.value = text.substring(0, start) + tableHtml + text.substring(end);
                    } else {
                        contents.value = text.substring(0, start) + htmlText + text.substring(end);
                    }
                });
            } else {
                console.warn("🚫 지원되지 않는 파일 유형:", file.type);
            }
        }
    });
}