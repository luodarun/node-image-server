// 用作发送请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('request :>> ', request, sender);
});

chrome.contextMenus.create({
    title: "上传",
    id: "10086",
    contexts: ['all']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.mediaType === 'image') {
        chrome.tabs.sendMessage(tab.id, { code: 1, imgUrl: info.srcUrl });
    } else {
        chrome.tabs.sendMessage(tab.id, { code: 2 });
    }
});
