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

	color:二维码的颜色，16进制的颜色值，二维码一般由黑白组成，当然你也可以选择其他颜色和白进行组合

	text(可选):显示在二维码附近的文字，用来做二维码的说明

	text_color:所要显示文字的颜色

	text_size:所要显示文字的大小

	image_data(可选):显示在二维码中间的小图的BASE64编码，在后一节会提到

* 第四步<br>
修改完后，复制整个文件内容<br>
在想要发送弹幕的时间处，选择`高级弹幕`(需取得作者同意)，在选择`代码弹`幕，在`脚本`框处，粘贴，发送。

* DUANG!

## 高级玩法
### 微信公众号
如果想扫微信公众号怎么办?

首先有一张公众号的二维码图片作为参考<br>
如果没有，请打开`http://open.weixin.qq.com/qr/code/?username=微信公众号`获取<br>

然后打开[二维码解码工具](http://tool.chinaz.com/qrcode)，对二维码图片解码，得到的字符串就是上面要填的url啦，enjoy!

### 二维码中央显示小图
如果想在二维码上显示图片怎么办?

这个比较麻烦，首先需要将要显示的图片保存为64*64分辨率，24位bmp格式，同时翻转行序。<br>
然后打开[图片转BASE64工具](http://tool.css-js.com/base64.html)，将图片编码，注意不要勾选`包含头`。<br>
将得到的字符串填充到上文中的image_data中，注意要用双引号引起来。

好了，就是这些，也没啥技术含量，话说B站的弹幕引擎真够烂的，啥时候放弃flash，如果能用上webGL就好了。
----------
