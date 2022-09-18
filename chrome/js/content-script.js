/**
 * 注意：此js文件会在每个匹配matches成功的页面加载，如果想获取页面中的变量只能在这里获取
 */
const popupList = []; // 弹窗消息数组
const messageDivGap = 20; // 每个弹窗之间的间隔
const messageDivHeight = 60; // 弹窗的高度
const duration = 3000; // 消息持续时间

// 校验请求地址是否合法
const testUrl = (url) => {
    // \w 查找数字、字母及下划线。- 特殊字符，例如[0-9]
    return /^(((ht|f)tps?):\/\/)?[\w\-]+(\.[\w\-]+){0,}([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/.test(
        url
    );
};

// 获取缓存中的图片上传地址
const getPostUrl = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["address"], function (result) {
            resolve(result.address);
        });
    });
};

const ajax = (ajaxConfig) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest(); //创建对象
        let params2Str = "";
        if (ajaxConfig.params) {
            Object.keys(ajaxConfig.params).forEach((item) => {
                params2Str += `&${item}=${ajaxConfig.params[item]}`;
            });
        }
        xhr.open(
            ajaxConfig.method?.toUpperCase() || "GET",
            params2Str
                ? ajaxConfig.url + "?" + params2Str.substring(1)
                : ajaxConfig.url,
            true
        );
        if (ajaxConfig.headers) {
            Object.keys(ajaxConfig.headers).forEach((item) => {
                xhr.setRequestHeader(item, ajaxConfig.headers[item]);
            });
        }
        xhr.responseType = ajaxConfig.responseType || "json";
        xhr.timeout = ajaxConfig.timeout || 3000;
        xhr.send(ajaxConfig.data);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }
            if (xhr.status >= 200 && xhr.status < 300) {
                return resolve(xhr.response);
            } else {
                return reject("接口错误");
            }
        };
        // 请求超时后请求自动终止，会调用 ontimeout 事件处理程序
        xhr.ontimeout = function () {
            return reject("请求超时了");
        };
        xhr.onerror = function () {
            return reject("数据接收出错");
        };
    });
};

function createBoardContainerInBody() {
    const div = window.document.createElement("div");
    window.document.body.appendChild(div);
    return div;
}

const pushPopupList = (message) => {
    const boardContainer = createBoardContainerInBody();
    boardContainer.innerHTML = message;
    bindMessageStyle(boardContainer, popupList.length);
    popupList.push(boardContainer);
    // 定时器清除div
    setTimeout(() => {
        popupList.shift();
        boardContainer.parentNode.removeChild(boardContainer);
        updateMessageTop();
    }, duration);
};

const updateMessageTop = () => {
    popupList.forEach((element, index) => {
        element.style.top = index * (messageDivGap + messageDivHeight) + "px";
    });
};

const bindMessageStyle = (el, index) => {
    const messageStyle = {
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        padding: "0 19px",
        height: messageDivHeight + "px",
        lineHeight: messageDivHeight + "px",
        backgroundColor: "#f4f4f5",
        transition: "opacity 0.3s,transform .4s,top .4s",
        width: "fit-content",
        boxSizing: "border-box",
        borderRadius: "4px",
        top: 10 + (index * (messageDivGap + messageDivHeight)) + "px",
        zIndex: 99999
    };
    Object.keys(messageStyle).forEach((attr) => {
        el["style"][attr] = messageStyle[attr];
    });
};

const getImageFile = async () => {
    const clipboardItems = await window.navigator.clipboard.read();
    if (!clipboardItems || !clipboardItems.length) {
        return;
    }
    let file = null;
    for (const type of clipboardItems[0].types) {
        if (file) {
            break;
        }
        if (type.indexOf('image') < 0) {
            continue;
        }
        const blob = await clipboardItems[0].getType(type);
        file = new File([blob], new Date().getTime() + '.png', {
            type: blob.type,
        });
    }
    return file;
}

// 发送json数据需要先JSON.stringify
const uploadImgForUrl = async (url) => {
    const baseUrl = await getPostUrl();
    const result = await ajax({
        method: "POST",
        url: baseUrl,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            url: url,
        }),
    });
    (result?.data || []).forEach((element) => {
        pushPopupList(`文件地址：${element.filePath}`);
        navigator.clipboard.writeText(element.filePath);
    });
};

// 从粘贴板中读取图片数据上传
const uploadImgForClipboard = async () => {
    const file = await getImageFile();
    if (!file) {
        return;
    }
    const baseUrl = await getPostUrl();
    const formData = new FormData();
    formData.append("file", file);
    const result = await ajax({
        method: "POST",
        url: baseUrl,
        data: formData,
    });
    (result?.data || []).forEach((element) => {
        pushPopupList(`文件地址：${element.filePath}`);
        navigator.clipboard.writeText(element.filePath);
    });
};

// 用作接收请求回复
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 语音播放
    // speechSynthesis.speak(new SpeechSynthesisUtterance(request.message));
    if (!request.code) {
        window.console.error(request.message);
        return;
    }
    if (request.code === 1) {
        uploadImgForUrl(request.imgUrl);
        return;
    } else if (request.code === 2) {
        uploadImgForClipboard();
        return;
    }
});
