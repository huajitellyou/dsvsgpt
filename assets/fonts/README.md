# 字体目录说明

## 目录结构

```
assets/fonts/
├── font.ttf      # 全局字体文件（必须）
├── fonts.css     # 字体样式配置
└── README.md     # 本说明文件
```

## 使用方法

### 1. 添加字体文件

将您的字体文件命名为 `font.ttf` 并放入此目录。

支持的字体格式：
- `.ttf` - TrueType 字体（推荐）
- `.woff` / `.woff2` - Web 字体（如需支持，需修改 fonts.css）

### 2. 字体已自动应用到以下界面

- **主菜单** - 标题、按钮文字
- **游戏内UI** - 血条、经验条、等级显示
- **技能选择界面** - 技能名称、描述
- **游戏结束界面** - 分数、统计信息
- **横屏提示** - 提示文字

### 3. 在代码中使用

CSS 变量已定义，可直接使用：

```css
/* 使用主字体 */
.my-element {
  font-family: var(--font-primary);
}

/* 使用标题字体（更粗） */
.my-title {
  font-family: var(--font-title);
}

/* 使用正文字体 */
.my-text {
  font-family: var(--font-body);
}
```

### 4. 备用字体栈

如果 `font.ttf` 加载失败，系统会自动回退到：
1. Microsoft YaHei（微软雅黑）
2. PingFang SC（苹方）
3. Hiragino Sans GB（冬青黑体）
4. Noto Sans CJK SC（思源黑体）
5. 系统默认 sans-serif

## 注意事项

1. **字体文件大小** - 建议将字体文件压缩到 5MB 以下，避免加载过慢
2. **字体授权** - 确保使用的字体有合法授权，可用于商业项目
3. **中文字体** - 由于中文字符集较大，建议使用子集化工具减小字体文件大小
4. **font-display: swap** - 已配置，字体加载期间会显示备用字体

## 推荐字体

- 标题/游戏风格：站酷快乐体、优设标题黑、庞门正道标题体
- 正文/UI：思源黑体、Noto Sans CJK、阿里巴巴普惠体

## 字体子集化工具

如需减小字体文件大小，可使用以下工具：
- [字蛛 (FontSpider)](http://font-spider.org/) - 自动分析使用的字符
- [subset-font](https://github.com/papandreou/subset-font) - Node.js 工具
- [fonttools](https://github.com/fonttools/fonttools) - Python 工具
