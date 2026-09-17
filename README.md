# 听句 · 英语听写练习室

一个可安装的英语听写 PWA。导入本地视频、音频或 SRT/VTT 字幕后，可以逐句播放、重复听写、核对答案、查看双语句子，并在浏览器中使用 Whisper 自动识别英文字幕。

## 功能

- 支持本地视频与音频，以及允许跨域访问的媒体直链
- 支持 SRT、VTT 字幕和浏览器本地 Whisper 识别
- 单句重复、播放速度、字幕显示与嵌入字幕遮挡
- 可调位置、尺寸、背景色和透明度的听写框
- 英文、中文和双语句子列表
- 可安装为桌面或移动端 PWA，应用外壳支持离线打开

所有本地素材都在当前浏览器中处理，不会上传到 GitHub。

## 本地开发

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

## 构建

常规服务端构建：

```bash
npm run build
```

GitHub Pages 静态 PWA 构建：

```bash
GITHUB_REPOSITORY=owner/listen-write npm run build:pages
```

静态文件会输出到 `dist/client/`。GitHub Actions 会在 `main` 分支更新后自动部署。

## GitHub Pages 限制

GitHub Pages 不运行服务端代码，因此公开 PWA 版不能直接完成百度网盘 OAuth 授权。其余本地素材、直链、字幕、听写和浏览器端 Whisper 功能均可使用。
