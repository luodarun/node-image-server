// 需要缓存数据
document.querySelector("#formButton").addEventListener("click", () => {
    const address = document.querySelector("#formAddress").value;
    chrome.storage.sync.set({ address: address }, function () {
        console.log("地址已被设置为" + address);
    });
});

// 获取粘贴板中的图片文件
const getImageFile = async () => {
    const clipboardItems = await window.navigator.clipboard.read();
    if (!clipboardItems || !clipboardItems.length) {
        return;
    }
    let file = null;
    for (const type of clipboardItems[0].types) {
        if (!file) {
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

chrome.storage.sync.get(["address"], function (result) {
    document.querySelector("#formAddress").value = result.address;
});
