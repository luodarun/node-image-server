const Koa = require("koa");
const Router = require("koa-router"); // 支持路由
const serve = require("koa-static"); // 支持静态文件服务
const path = require("path");
const logger = require('koa-logger')
const cors = require("koa2-cors"); // 支持跨域
const json = require("koa-json"); // 美化json返回对象
const koaBody = require("koa-body");
const download = require("download");
const app = new Koa();
const router = new Router();
const savePath = "upload";
const visitAddress = {
    protocol: "http:",
    ip: "localhost",
    port: 3000,
};
app.use(logger());
app.use(serve(path.join(__dirname, "./" + savePath)));
app.use(cors());
app.use(
    koaBody({
        multipart: true, // 支持文件上传
        formidable: {
            uploadDir: path.join(__dirname, savePath), // 设置文件上传目录
            keepExtensions: true, // 保持文件的后缀
            maxFieldsSize: 2 * 1024 * 1024, // 文件上传大小
            onFileBegin: (name, file) => {
                // 修改上传文件名
                const fileName = Date.now() + ".png";
                file.newFilename = fileName;
                file.filepath = path.join(__dirname, "./upload/") + fileName;
            },
        },
    })
);
app.use(json());
app.use(router.routes()).use(router.allowedMethods());
router.get("/", async (ctx) => {
    ctx.type = "html";
    ctx.body = "<h1>文件呢</h1>";
});
// 多文件上传
router.post("/upload", async (ctx) => {
    try {
        if (ctx.request.body && ctx.request.body.url) {
            const { url: imgUrl } = ctx.request.body;
            const fileName = Date.now() + ".png";
            const data = await download(imgUrl, `${__dirname}/${savePath}`, {
                filename: fileName,
            });
            ctx.body = {
                code: 200,
                data: [
                    {
                        fileName: fileName,
                        filePath: `${visitAddress.protocol}//${visitAddress.ip}:${visitAddress.port}/${fileName}`,
                        fileSize: data.length,
                    },
                ],
            };
        } else {
            ctx.body = {
                code: 200,
                data:
                    Object.prototype.toString.call(ctx.request.files.file) ===
                    "[object Array]"
                        ? ctx.request.files.file.map((item) => {
                              return {
                                  fileName: item.newFilename,
                                  filePath: `${visitAddress.protocol}//${visitAddress.ip}:${visitAddress.port}/${item.newFilename}`,
                                  fileSize: item.size,
                              };
                          })
                        : [
                              {
                                  fileName: ctx.request.files.file.newFilename,
                                  filePath: `${visitAddress.protocol}//${visitAddress.ip}:${visitAddress.port}/${ctx.request.files.file.newFilename}`,
                                  fileSize: ctx.request.files.file.size,
                              },
                          ],
            };
        }
    } catch (error) {
        console.log("error :>> ", error);
        ctx.body = {
            code: 500,
            msg: error.message,
        };
    }
});
app.listen(visitAddress.port, () => {
    console.log(
        `应用已经启动，${visitAddress.protocol}//${visitAddress.ip}:${visitAddress.port}`
    );
});
