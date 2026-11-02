# 中国勋略离线资源

本补丁已将历史勋略改为仅从本地 `src/achievements/assets/ribbons/<country>/<ID>.svg` 读取，页面不再请求在线图片。

## 获取1955年12种中国勋略

在可联网的电脑上，进入游戏根目录，运行：

`python scripts/download_honor_ribbons.py`

下载程序使用项目旧版已配置的 Wikimedia Commons 文件名，逐个下载原始 SVG 到 `assets/ribbons/china/`。**本次打包环境无法联网，因此 ZIP 内不含这些SVG文件。**

运行完成后检查 `DOWNLOAD-REPORT.json`；若某个文件下载失败，页面将显示“勋略图片未安装”。请人工核对历史真实性及每张图片的授权。脚本不会生成或改绘勋略。

中国现代11条勋略（CN-013 至 CN-023）原项目尚无已核实的原图来源，本补丁未编造纹样。获得合法、核实的图片后，按 `CN-013.svg` 等名称放入同一目录即可。

其他国家的原图同样需放在 `assets/ribbons/soviet|germany|usa|uk|australia/`，按各档案 ID 命名。

本补丁未改变原有荣誉档案、文字和游戏逻辑。
