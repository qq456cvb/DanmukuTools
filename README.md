弹幕版二维码（基于JQuery移植）
====
## 使用方法
* 第一步<br>
下载`qrcode.js`<br>
* 第二步<br>
打开下载的文件，搜索`qr_options`，或者跳转到1283行<br>
* 第三步<br>
对其中的属性进行个性化设置，如下示例<br>
```JavaScript
var qr_options = {
	position: BOTTOM_LEFT,
	url: "http://www.baidu.com",
	lifeTime: 5,
	color: 0x000000,
	text: "我们要发财了",
	text_color: 0x00FF00,
	text_size: 18,
	image_data: ""
}
```
position:有四个可选值: `TOP_LEFT`, `TOP_RIGHT`, `BOTTOM_LEFT`, `BOTTOM_RIGHT`, 分别对应左上、右上、左下、右下，即控制弹幕在屏幕中的位置

url:要显示的二维码字符串: 二维码本质就是一串字符串，这里一般填网址，能被扫码软件识别

lifeTime:二维码的存活时间，以秒为单位

color:二维码的颜色，二维码一般由黑白组成，当然你也可以选择其他颜色和白进行组合

text(可选):显示在二维码附近的文字，用来做二维码的说明

