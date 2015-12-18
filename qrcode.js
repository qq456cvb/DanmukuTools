
// Transported to Bilibili by Neil You, Shanghai Jiao Tong University

//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of 
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------


function QR8bitByte(data) {
	var qr8bitByte = {};
	qr8bitByte.mode = QRMode.MODE_8BIT_BYTE;
	qr8bitByte.data = data;
	// trace(data.length);
	qr8bitByte.getLength = function(buffer) {
		return this.data.length;
	};
	
	qr8bitByte.write = function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			// trace(this.data.charCodeAt(i));
			buffer.put(this.data.charCodeAt(i), 8);
		}
	};
	return qr8bitByte;
}


//---------------------------------------------------------------------
// QRCode
//---------------------------------------------------------------------

function QRCode(typeNumber, errorCorrectLevel) {
	var qrcode = {};
	qrcode.typeNumber = typeNumber;
	qrcode.errorCorrectLevel = errorCorrectLevel;
	qrcode.modules = null;
	qrcode.moduleCount = 0;
	qrcode.dataCache = null;
	qrcode.dataList = [];
	qrcode.addData = function(data) {
		var newData = QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	};
	
	qrcode.isDark = function(row, col) {
		// if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
		// 	throw new Error(row + "," + col);
		// }
		return this.modules[row][col];
	};

	qrcode.getModuleCount = function() {
		return this.moduleCount;
	};
	
	qrcode.make = function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {

				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
				var buffer = QRBitBuffer();
				
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					var j = i;
					totalDataCount += (rsBlocks[j]).dataCount;
				}
				// trace(totalDataCount);	
				for (var i = 0; i < this.dataList.length; i++) {
					var j = i;
					var data = this.dataList[j];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		
		this.makeImpl(false, this.getBestMaskPattern() );
	};
	
	qrcode.makeImpl = function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = [];
		this.modules.length = this.moduleCount;
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = [];
			this.modules[row].length = this.moduleCount;
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
		
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		// trace(maskPattern);
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache == null) {
			this.dataCache = this.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
			// trace("here");
		}
		

		this.mapData(this.dataCache, maskPattern);
	};
 
	qrcode.setupPositionProbePattern = function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
						|| (0 <= c && c <= 6 && (r == 0 || r == 6) )
						|| (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	};
	
	qrcode.getBestMaskPattern = function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i == 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	};
	
	qrcode.createMovieClip = function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	};

	qrcode.setupTimingPattern = function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] != null) {
				continue;
			}
			this.modules[r][6] = (r % 2 == 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] != null) {
				continue;
			}
			this.modules[6][c] = (c % 2 == 0);
		}
	};
	
	qrcode.setupPositionAdjustPattern = function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);

		for (var k = 0; k < pos.length; k++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[k];
				var col = pos[j];
				if (this.modules[row][col] != null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (r == -2 || r == 2 || c == -2 || c == 2 
								|| (r == 0 && c == 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	};
	
	qrcode.setupTypeNumber = function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
	
		for (var i = 0; i < 18; i++) {
			var mod = (!test && ( (bits >> i) & 1) == 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var i = 0; i < 18; i++) {
			var mod = (!test && ( (bits >> i) & 1) == 1);
			this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
		}
	};
	
	qrcode.setupTypeInfo = function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
		// trace(bits);
		// vertical		
		for (var i = 0; i < 15; i++) {
			var j = i;
			var mod = (!test && ( (bits >> i) & 1) == 1);
			
			if (i < 6) {
				this.modules[j][8] = mod;
			} else if (i < 8) {
				this.modules[j + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + j][8] = mod;
			}
		}

		// horizontal
		for (var i = 0; i < 15; i++) {
			var j = i;
			var mod = (!test && ( (bits >> i) & 1) == 1);
			
			if (i < 8) {
				this.modules[8][this.moduleCount - j - 1] = mod;
			} else if (i < 9) {
				this.modules[8][15 - j - 1 + 1] = mod;
			} else {
				this.modules[8][15 - j - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	};
	
	qrcode.mapData = function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		// trace(data.length);
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col == 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] == null) {
						
						var dark = false;
						
						if (byteIndex < data.length) {
							// trace(data[byteIndex]);
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex == -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
	};
	qrcode.createData = function(typeNumber, errorCorrectLevel, dataList) {
		// trace("here");
		var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
			// 
		var buffer = QRBitBuffer();
		
		for (var i = 0; i < dataList.length; i++) {
			var j = i;
			var data = dataList[j];
			buffer.put(data.mode, 4);
			buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
			data.write(buffer);
		}
		// for (var i = 0; i < 8; i++) {
		// 	[i]
		// };
		// calc num max data.
		var totalDataCount = 0;
		for (var i = 0; i < rsBlocks.length; i++) {
			var j = i;
			totalDataCount += rsBlocks[j].dataCount;
		}

		if (buffer.getLengthInBits() > totalDataCount * 8) {
			trace("code length overflow. ("
				+ buffer.getLengthInBits()
				+ ">"
				+  totalDataCount * 8
				+ ")");
		}

		// end code
		if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
			buffer.put(0, 4);
		}

		// padding
		while (buffer.getLengthInBits() % 8 != 0) {
			buffer.putBit(false);
		}

		// padding
		while (true) {
			
			if (buffer.getLengthInBits() >= totalDataCount * 8) {
				break;
			}
			buffer.put(this.PAD0, 8);
			
			if (buffer.getLengthInBits() >= totalDataCount * 8) {
				break;
			}
			buffer.put(this.PAD1, 8);
		}
		for (var i = buffer.buffer.length - 1; i >= 0; i--) {
			// trace(buffer.buffer[i]);
		};
		return qrcode.createBytes(buffer, rsBlocks);
	};

	qrcode.createBytes = function(buffer, rsBlocks) {

		var offset = 0;
		
		var maxDcCount = 0;
		var maxEcCount = 0;
		
		var dcdata = [];
		dcdata.length = rsBlocks.length;
		var ecdata = [];
		ecdata.length = rsBlocks.length;
		
		for (var r = 0; r < rsBlocks.length; r++) {

			var dcCount = rsBlocks[r].dataCount;
			var ecCount = rsBlocks[r].totalCount - dcCount;

			maxDcCount = Math.max(maxDcCount, dcCount);
			maxEcCount = Math.max(maxEcCount, ecCount);
			
			dcdata[r] = [];
			dcdata[r].length = dcCount;
			
			for (var i = 0; i < dcdata[r].length; i++) {
				var j = i;
				dcdata[r][j] = 0xff & buffer.buffer[j + offset];
			}
			offset += dcCount;
			
			var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
			var rawPoly = QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

			var modPoly = rawPoly.mod(rsPoly);
			ecdata[r] = [];
			ecdata[r].length = rsPoly.getLength() - 1;
			for (var i = 0; i < ecdata[r].length; i++) {
				var j = i;
	            var modIndex = j + modPoly.getLength() - ecdata[r].length;
				ecdata[r][j] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
			}

		}
		
		var totalCodeCount = 0;
		for (var i = 0; i < rsBlocks.length; i++) {
			var j = i;
			totalCodeCount += rsBlocks[j].totalCount;
		}
		
		var data = [];
		data.length = totalCodeCount;
		var index = 0;

		for (var i = 0; i < maxDcCount; i++) {
			for (var r = 0; r < rsBlocks.length; r++) {
				if (i < dcdata[r].length) {
					var j = i;
					data[index++] = dcdata[r][j];
				}
			}
		}

		for (var i = 0; i < maxEcCount; i++) {
			for (var r = 0; r < rsBlocks.length; r++) {
				if (i < ecdata[r].length) {
					var j = i;
					data[index++] = ecdata[r][j];
				}
			}
		}

		return data;

	};
	qrcode.PAD0 = 0xEC;
	qrcode.PAD1 = 0x11;
	return qrcode;
}



//---------------------------------------------------------------------
// QRMode
//---------------------------------------------------------------------

var QRMode = {
	MODE_NUMBER :		1 << 0,
	MODE_ALPHA_NUM : 	1 << 1,
	MODE_8BIT_BYTE : 	1 << 2,
	MODE_KANJI :		1 << 3
};

//---------------------------------------------------------------------
// QRErrorCorrectLevel
//---------------------------------------------------------------------
 
var QRErrorCorrectLevel = {
	L : 1,
	M : 0,
	Q : 3,
	H : 2
};

//---------------------------------------------------------------------
// QRMaskPattern
//---------------------------------------------------------------------

var QRMaskPattern = {
	PATTERN000 : 0,
	PATTERN001 : 1,
	PATTERN010 : 2,
	PATTERN011 : 3,
	PATTERN100 : 4,
	PATTERN101 : 5,
	PATTERN110 : 6,
	PATTERN111 : 7
};

//---------------------------------------------------------------------
// QRUtil
//---------------------------------------------------------------------
 
var QRUtil = {

    PATTERN_POSITION_TABLE : [
	    [],
	    [6, 18],
	    [6, 22],
	    [6, 26],
	    [6, 30],
	    [6, 34],
	    [6, 22, 38],
	    [6, 24, 42],
	    [6, 26, 46],
	    [6, 28, 50],
	    [6, 30, 54],		
	    [6, 32, 58],
	    [6, 34, 62],
	    [6, 26, 46, 66],
	    [6, 26, 48, 70],
	    [6, 26, 50, 74],
	    [6, 30, 54, 78],
	    [6, 30, 56, 82],
	    [6, 30, 58, 86],
	    [6, 34, 62, 90],
	    [6, 28, 50, 72, 94],
	    [6, 26, 50, 74, 98],
	    [6, 30, 54, 78, 102],
	    [6, 28, 54, 80, 106],
	    [6, 32, 58, 84, 110],
	    [6, 30, 58, 86, 114],
	    [6, 34, 62, 90, 118],
	    [6, 26, 50, 74, 98, 122],
	    [6, 30, 54, 78, 102, 126],
	    [6, 26, 52, 78, 104, 130],
	    [6, 30, 56, 82, 108, 134],
	    [6, 34, 60, 86, 112, 138],
	    [6, 30, 58, 86, 114, 142],
	    [6, 34, 62, 90, 118, 146],
	    [6, 30, 54, 78, 102, 126, 150],
	    [6, 24, 50, 76, 102, 128, 154],
	    [6, 28, 54, 80, 106, 132, 158],
	    [6, 32, 58, 84, 110, 136, 162],
	    [6, 26, 54, 82, 110, 138, 166],
	    [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)	| (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
	    var d = data << 10;
	    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
		    d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) ); 	
	    }
	    return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
	    var d = data << 12;
	    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
		    d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) ); 	
	    }
	    return (data << 12) | d;
    },

    getBCHDigit : function(data) {

	    var digit = 0;

	    while (data != 0) {
		    digit++;
		    data >>>= 1;
	    }

	    return digit;
    },

    getPatternPosition : function(typeNumber) {
	    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
	    
	    switch (maskPattern) {
		    
	    case QRMaskPattern.PATTERN000 : return (i + j) % 2 == 0;
	    case QRMaskPattern.PATTERN001 : return i % 2 == 0;
	    case QRMaskPattern.PATTERN010 : return j % 3 == 0;
	    case QRMaskPattern.PATTERN011 : return (i + j) % 3 == 0;
	    case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0;
	    case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 == 0;
	    case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 == 0;
	    case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 == 0;
	    }
	    // default :
		   //  throw new Error("bad maskPattern:" + maskPattern);
	    // `}
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

	    var a = QRPolynomial([1], 0);

	    for (var i = 0; i < errorCorrectLength; i++) {
		    a = a.multiply(QRPolynomial([1, QRMath.gexp(i)], 0));
	    }

	    return a;
    },

    getLengthInBits : function(mode, type) {

	    if (1 <= type && type < 10) {

		    // 1 - 9

		    switch(mode) {
		    case QRMode.MODE_NUMBER 	: return 10;
		    case QRMode.MODE_ALPHA_NUM 	: return 9;
		    case QRMode.MODE_8BIT_BYTE	: return 8;
		    case QRMode.MODE_KANJI  	: return 8;
		    // default :
			   //  throw new Error("mode:" + mode);
		    // 
			}

	    } else if (type < 27) {

		    // 10 - 26

		    switch(mode) {
		    case QRMode.MODE_NUMBER 	: return 12;
		    case QRMode.MODE_ALPHA_NUM 	: return 11;
		    case QRMode.MODE_8BIT_BYTE	: return 16;
		    case QRMode.MODE_KANJI  	: return 10;
		    // default :
			   //  throw new Error("mode:" + mode);
		    // 
			}

	    } else if (type < 41) {

		    // 27 - 40

		    switch(mode) {
		    case QRMode.MODE_NUMBER 	: return 14;
		    case QRMode.MODE_ALPHA_NUM	: return 13;
		    case QRMode.MODE_8BIT_BYTE	: return 16;
		    case QRMode.MODE_KANJI  	: return 12;
		    // default :
			   //  throw new Error("mode:" + mode);
		    // 
			}

	    } else {
		    // throw new Error("type:" + type);
	    }
    },

    getLostPoint : function(qrCode) {
	    
	    var moduleCount = qrCode.getModuleCount();
	    
	    var lostPoint = 0;
	    
	    // LEVEL1
	    
	    for (var row = 0; row < moduleCount; row++) {

		    for (var col = 0; col < moduleCount; col++) {

			    var sameCount = 0;
			    var dark = qrCode.isDark(row, col);

				for (var r = -1; r <= 1; r++) {

				    if (row + r < 0 || moduleCount <= row + r) {
					    continue;
				    }

				    for (var c = -1; c <= 1; c++) {

					    if (col + c < 0 || moduleCount <= col + c) {
						    continue;
					    }

					    if (r == 0 && c == 0) {
						    continue;
					    }

					    if (dark == qrCode.isDark(row + r, col + c) ) {
						    sameCount++;
					    }
				    }
			    }

			    if (sameCount > 5) {
				    lostPoint += (3 + sameCount - 5);
			    }
		    }
	    }

	    // LEVEL2

	    for (var row = 0; row < moduleCount - 1; row++) {
		    for (var col = 0; col < moduleCount - 1; col++) {
			    var count = 0;
			    if (qrCode.isDark(row,     col    ) ) count++;
			    if (qrCode.isDark(row + 1, col    ) ) count++;
			    if (qrCode.isDark(row,     col + 1) ) count++;
			    if (qrCode.isDark(row + 1, col + 1) ) count++;
			    if (count == 0 || count == 4) {
				    lostPoint += 3;
			    }
		    }
	    }

	    // LEVEL3

	    for (var row = 0; row < moduleCount; row++) {
		    for (var col = 0; col < moduleCount - 6; col++) {
			    if (qrCode.isDark(row, col)
					    && !qrCode.isDark(row, col + 1)
					    &&  qrCode.isDark(row, col + 2)
					    &&  qrCode.isDark(row, col + 3)
					    &&  qrCode.isDark(row, col + 4)
					    && !qrCode.isDark(row, col + 5)
					    &&  qrCode.isDark(row, col + 6) ) {
				    lostPoint += 40;
			    }
		    }
	    }

	    for (var col = 0; col < moduleCount; col++) {
		    for (var row = 0; row < moduleCount - 6; row++) {
			    if (qrCode.isDark(row, col)
					    && !qrCode.isDark(row + 1, col)
					    &&  qrCode.isDark(row + 2, col)
					    &&  qrCode.isDark(row + 3, col)
					    &&  qrCode.isDark(row + 4, col)
					    && !qrCode.isDark(row + 5, col)
					    &&  qrCode.isDark(row + 6, col) ) {
				    lostPoint += 40;
			    }
		    }
	    }

	    // LEVEL4
	    
	    var darkCount = 0;

	    for (var col = 0; col < moduleCount; col++) {
		    for (var row = 0; row < moduleCount; row++) {
			    if (qrCode.isDark(row, col) ) {
				    darkCount++;
			    }
		    }
	    }
	    
	    var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
	    lostPoint += ratio * 10;

	    return lostPoint;		
    }

};


//---------------------------------------------------------------------
// QRMath
//---------------------------------------------------------------------

var QRMath = {};
QRMath.glog = function(n) {
	// if (n < 1) {
	// 	throw new Error("glog(" + n + ")");
	// }
	
	return QRMath.LOG_TABLE[n];
};
	
QRMath.gexp = function(n) {
	
	while (n < 0) {
		n += 255;
	}

	while (n >= 256) {
		n -= 255;
	}

	return QRMath.EXP_TABLE[n];
};
	
QRMath.EXP_TABLE = [];
QRMath.EXP_TABLE.length = 256;
	
QRMath.LOG_TABLE = [];
QRMath.LOG_TABLE.length = 256;
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}

//---------------------------------------------------------------------
// QRPolynomial
//---------------------------------------------------------------------

function QRPolynomial(num, shift) {
	var qrPolynomial = {};
	// if (num.length == undefined) {
	// 	throw new Error(num.length + "/" + shift);
	// }

	var offset = 0;

	while (offset < num.length && num[offset] == 0) {
		offset++;
	}

	qrPolynomial.num = [];
	qrPolynomial.num.length = num.length - offset + shift;
	for (var i = 0; i < num.length - offset; i++) {
		qrPolynomial.num[i] = num[i + offset];
	}
	qrPolynomial.get = function(index) {
		return this.num[index];
	};
	
	qrPolynomial.getLength = function() {
		return this.num.length;
	};
	
	qrPolynomial.multiply = function(e) {
	
		var num = [];
		num.length = this.getLength() + e.getLength() - 1;
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return QRPolynomial(num, 0);
	};
	
	qrPolynomial.mod = function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = [];
		num.length = this.getLength();
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var i = 0; i < e.getLength(); i++) {
			num[i] ^= QRMath.gexp(QRMath.glog(e.get(i) ) + ratio);
		}
	
		// recursive call
		return (QRPolynomial(num, 0)).mod(e);
	};

	return qrPolynomial;
}


//---------------------------------------------------------------------
// QRRSBlock
//---------------------------------------------------------------------

function QRRSBlock(totalCount, dataCount) {
	var qrRSBlock = {};
	qrRSBlock.totalCount = totalCount;
	qrRSBlock.dataCount  = dataCount;
	return qrRSBlock;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	// if (rsBlock == undefined) {
	// 	throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	// }

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(QRRSBlock(totalCount, dataCount) );
		}
	}
	return list;
};




QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};

//---------------------------------------------------------------------
// QRBitBuffer
//---------------------------------------------------------------------

function QRBitBuffer() {
	var qrBitBuffer = {};
	qrBitBuffer.buffer = [];
	qrBitBuffer.length = 0;
	qrBitBuffer.get = function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	};
	
	qrBitBuffer.put = function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	};
	
	qrBitBuffer.getLengthInBits = function() {
		return this.length;
	};
	
	qrBitBuffer.putBit = function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	};
	return qrBitBuffer;
}

/*------------------------------------------action script----------------------------------------*/

var BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var width = Player.width;
var height = Player.height;
var INT_MAX = 1 << 31 - 1;
var TOP_LEFT = 0, TOP_RIGHT = 1, BOTTOM_LEFT = 2, BOTTOM_RIGHT = 3;
var qr_size = height / 6;
var img_size = qr_size / 4;
var margin = height / 30;
var posIndex = [
	{x:margin, y:margin},
	{x:width-margin-qr_size, y:margin},
	{x:margin, y:height-margin-qr_size},
	{x:width-margin-qr_size, y:height-margin-qr_size}
];


/*********************************hei hei hei**************************************/
var qr_options = {
	position: BOTTOM_LEFT,
	url: "http://www.baidu.com",
	lifeTime: 5,
	color: 0x000000,
	text: "我们要发财了",
	text_color: 0x00FF00,
	text_size: 18,
	image_data: "Qk04MAAAAAAAADYAAAAoAAAAQAAAAMD///8BABgAAAAAAAIwAAASCwAAEgsAAAAAAAAAAAAA/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/////////////////////////////////////////////////v7+////////09PT9/f3/////v7+/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////kpKSAQEBQkJC8fHx/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////5+fnJSUlMjIyBgYGmZmZ/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////vLy9HR0dUVBPHx8edHR0/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////t7i3HR4bS01KHB0aeHh3/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+///////////+MC85HBs1BwQUoaCi/////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/f39////////////qKinKSczFBAtFRAsQkFEfX592dnZ/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////v7+/Ojo7DAwMMTQvQ0JDREZGKSspCgoKFxcXbm5u/////////f39/////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////h4eHCgoKHh4eTU5PS0xPTEZHRklGSEtKUVBROzs7BAQEQUFB9PT0/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////ZWVlAQEBQUFBT09OREVFRUVFR0ZDRUZDREVFRUVFSEhIUlJSDQ0NPz8//f39/////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////lpaWAAAAODg4S0tLRERERUVFRUVFREVFRUVFRUVFRUVFRUVFSUlJPz8/AAAAjY2N/////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////u7u7cnJyZ2dnIyMjTU1NRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFVlZWFhYWZWVlc3Nzzc3N/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+////////e3t7paWlkZGRCwsLSkpKT09PSEhIRkZGRUVFRUVFR0dHTk5OSEhIHh4eFxcXwsLCh4eHkZGR/////////v7+/v7+/v7+/v7+//////////7+/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+////5+fncHBwvb291NTUbGxsAAAAEhISLS0tQUFBSUlJRkZGNjY2FBQUFBQULCwsgICA5OTkkpKSe3t7/////////v7+/v7+/v7+/v7+/v39/////////v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+////xcXFcXFxysrK2NjYm5ubaWlpd3d3MTExGhoaEBAQEhISKioqVVVVv7+/0dHRhoaG1dXVq6urdHR0+fn5/////v7+///+/f7/////////uOnv5fr5//////7+/f7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+////t7e3dnZ2zMzM09PTaGhoxcXF////9/f3zMzMx8fHxcXF6+vr////////6urqYWFhv7+/vLy8d3d36enp/////f39////////z83MdYyJoeTn6vv7//////7+/f7+/v7+////////////////1Pz/gvb/V/T/U/T/SfP/z/z//////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+////uLi4dnZ20NDQu7u7X19f5+fn////////////8PDw////////zMzM////////dXV1cnJy4ODgZGRk7e3t/////////v7+fH59XmBeTkxNusnN/////f/+/v7+/f7+/v7+////////////0Pz/GvD/D+7/JPX/KPT/AO3/bPX//////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/f39////wsLCd3d3+vr6b29vbm5u////////////z8/PT09P09PT5OTkcHBwa2tr8vLx4+PiMjIynJycREREiYmJ////ubm5SEZHPUI/8vb12tTXmpaY////+f/++/7+/v7+/v7+////////7v7/P/L/HvD/P/L/PPL/Pfj/LPH/RPL/9f7//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/f39////vr6+WFhYi4uLLS0t2tra////5+fnq6urZ2dnZ2dn7u7uubm5vr6+srKxsrC2////vLy8CwsKg4KDoKCgnp6eS0tLi4qLwcLB5efm6evsiY2M/v7+/f///P7+/v7+/v7+////////vfv/Fu//PfP/P/3/MaOkMqepOf7/LPH/1/z//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+////////wMDAUlJSLS0tIiIiv7+/////////jY2NBAQEDAwMYGBg+vr6zMzMeHh4bGxsk5KW8vDz////oKCeq6us0tLSlZWVlpaWsrKyqampwMDA////kZCQ0dHR/////////v7+/v7+////////uPv/IPD/O/L/QP//M66xLYJ+OP//MPP/2Pz//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+////6enpZWVlyMjIg4OD6Ojo/////////v7+paWlbGxsd3d3lpaW6urq8PDwpqamUlJTk5SS////////29vatra2xMTEw8PDqqqqfX19urq6srKy////pKSkpaWl/////////v7+/v7+////////xf//JPT/OvL/PPX/PO35OdzmNfT/MfL/2fz//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+////sLCwnp6e////enl6///////////+///+////////+Pj4vb296enp/f399vb2+Pj4//////79////4uHjq6uqsLCwwcHBzs7ObGxsxsbGqqqq/f39zMzMjo6O/////////v7+/v7+////////tPX/IPH/Pv7/PfT/PPf/Pv//NPH/MfH/2fz//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+////qampqKio+fn5dXZ0////+vn88/H2/Pz9////////0tHS2dnZ////9PT0/v7+////////+ff/8Oz6/Pv9nZ6bXl5d1dTV9vb2bm5uvLy8pKSk4uLi+vr6jY2N9/f3/////v7+/v7+////////V779CKn9MMr+PfX/Pvj/PPH/NPL/MfH/2fz//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+////ycnJhISE5OLjen15+v3/4N351tHz6+f4////8/Pzvr6/jIyLzc3N4+Pj19fX8PDv////4+X6zc319/f/g4mOQUI9////////fX19l5eXqampycnJ////jY2Nvb29/////v7+/v7+////////b8n+B5z9Hpf9Mc7+P/z/PPP/M/L/MfH/8v7//////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+////////X19fiYeHnqKf6vH/ysv5wb734Nv77e7vysnI////qquqU1NTp6en6urq3d3b+fv72uL3xcr32db/uLrLhIWB////////lpaWdXV1urq6t7e3////n5+fj4+P/////v7+/v7+////////hNH+BqL9IqX9IZ39N+L/P/z/OPL/LfH/p/n/4f3/8/7/9f7/9f7/8/7/8/7//////////////////////////////v7+/v7+/v7+/v7+/v7+////////ycnJMjIxaWxo9/n/xMf5t7n32tr/5ObqrKioqqqqvLy8wcHB6Ojo////1dXT6+3t3uf7yM/11NL/2drshoeD+Pf2////ubm5bGxsx8fHqKio9fX14eHhhISE////////////////////YMT9Apn9Jaf9LcL9O+//Pff/PfL/OvL/KfH/N/L/RfP/RvP/RvP/RPP/N/L/e/b//////////////////////////v7+/v7+/v7+/v7+/v7+/v7++/v7////4ODga2pm4d/m1tn9v8X23OL//f7/j4qKVVVVoqKi0tLS2dnZqampt7e19PH07vD/2N324+b/4ObugoN99/X2////6Ojoc3NztLS0o6Ojzc3N////pKSkzc3N////////////////1Pr/J9/+MuX/P/v/PfX/O/H/PPL/PfL/OfL/MvH/LfH/LfH/LfH/LvH/K/H/Au7/ivf//////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////jI2LsbS4+fn/3dv28ez9////0dDOdHR0kZGRjY2Nnp6eenp6xMTD7evs/v3+8vL1+/3+0NfWfIF+//7+////////f39/jIyMvr6+2dnZ3t7eYGBgrKys////////////////4f//Nvz/Nvv/PPP/PPH/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PfL/LvH/LvH/7P7//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////nJyciYyM////+vz///3/////////gICAQUFBWlpaNjY2x8fH9PX15ufn//////78////kJSThYuL////////////lJSUhISEzMzMYWFhTk5OlpaW8vLy/v7+////////////2fz/MfH/NPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/G/D/ufr//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////6ejoYmFh8fXx///////9////////6enp8fHx9fX10dHR////6+vr/Pz8/v7+////7e7uR0lJ3uDg//////7+////1tbWPj4+CwsLU1NT9vb2/////////v7+////////////4f3/N/L/M/H/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/GfD/nvn//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////k4+OXF5c/////////v7/////6OjovLy8ycnJ9PT0/////v7+////////8PDwTExKpKSk////////////////////KSkpKCgooqOj8PDw/////////v7+////////////5f3/OvL/MfH/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/GfD/ivj//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v//////////bm1vcXFy////////////////////////////////////////u7q6GhoYbG1o////////+fz++vz9////////dXR2uLm4vr68rKys//////////7+/f7+/v//////6P3/O/L/MvH/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/GvD/jfj//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////2dnYEREQWFhYqKmo2dnZ/Pz8////////+Pj4ycnJmpqaW11bPjo7KSY3GBc2f4CB////////////////29jYc3N2hImJ397bs7Ky/v7+/////v7+/f7+/v//////9v7/QvL/LvH/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/GfD/iPj//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////kZGRY2Nja2trNzc3PT09Pz8/RUVFSUlJOjo6Li4uODg4VFZUmJaUSUZTCg9WAAMyaWFp6+nj0dHJfn+EYGJj09bSQENEeXZ8ysnJ/Pz8/////v7+////////////////ZvX/HPD/PfL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PvL/E/D/kfj//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////6OjmPDw4XVxZnZ2foKChiYiHamtpW1tbXV1da2trj4+OpaalrKuzko+MbHBaOlBmVVmrTyx4Rj5VDg5BCgtNTEtr8/buTk9PAAAFpqan/////////v7+////////////////q/r/Du//P/L/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/N/L/IvD/1v3//////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////n56fDAwHgoR9mJeQjYyNl5iYqaelrK6mq66nrKmppKOem5mThol+b2psRj1dO0duTk+Wf1i1Q0KHGyaUOz+6HhxaMzUuZGZhAAAAa2pr/////////v7+////////////////+///S/P/H/D/P/L/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/PPL/QPL/E+//bvb//////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////dXSFAAAzFhtFaWJhr6ynZ29zPThVS0NRTUpQTE9DQENOMSpHMDY4Jiw/ExNtMzCoKSCSLTB9FiOXIy65NTSqAAEljI2E8vPxPD4+rrGx/////////v7+////////////////////zfz/Du//J/H/P/L/PPL/PPL/PPL/PPL/PPL/PPL/PvL/O/L/FfD/I/H/5/7//////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////TUhuCQeICQ2EPTdXtrinS1RUJBphWzmgWESFJTdCBBBcGSCHQ0yhVWeIWWCnHhS1JBq2JiitKSa3FBF6DhA8iI2K////////////////+fv7/////v7+////////////////////////q/n/J/H/E+//LvH/PfL/O/L/O/L/OvL/M/H/HvD/GfD/SfP/y/z//////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////8vLsNzFfLCesDxiKQkhSsLOeTU9HPjJqd1jjRzqzVFWwTEXOLDi1JjyXMTmOPS+1LCS1O0GbGheHBQBKNTJHu724////////9/j4////+f/++/39//7+/v7+////////////////////////////5v3/hff/NfL/FvD/HvD/HfD/IvD/MfH/VvT/sPr//////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////197UMy5VVDO4KiOCSEtQtaylVFhQLzVjT0WmLySdNy+tNiqoHCKSLDGPMxm9JBq/ISF8JScyTUpemZmX///6/////P///f///f//+///+v///P7+/v7+/v7+////////////////////////////////////6P7/rvr/sfr/sfr/wvv/4f3//////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////z9DKJCFLRS+rKR17R0pRs62pUFZQLDGJX1e2VUSbOjatLjGoJiqdMCSvLB+1OEjCIiFzw722////////////+Pz8+v77/v7//f7+/P7+/P/+/f7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////x8i7Gic0KSiiIhiJTVVYq7GdXlpjSjifQ0SfLC95P0eqJynBQUDEPz66ICCaSlyzJC9a3d7H/////v/9/v/7//////7//v7+/v7+/v7+//7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+///+////ub+sOExSQznRGgaSVFVdrLWYaltzVDaQOT+hKS25KjCqExWmOjfCTkfCTT+0ZGetIC1AwcO1/////v/5/v/8/v/+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2NTSHhtfFgmvAgBpQTxDpaeWUExUGhdFDxx7FAmwMhyhGh5/KjKQOi2gNRujLCOGAAE4xMDG/////f34/////////v7+/////////////v7+/////////////////////////////////////////////////////////////////////////////////////////////////////////////////f392dnZubm5zs7O/Pz83t7e39/f/f399/f3zMvDkY2xhYjGc3SZn5qi1tLReoB6Ynl4Zn2cdXaxloC8gYGzgI+siou4dmq7cXWyZ22Tzs3J////////9/j0////////////////////////////////8PDw/f39////////////////////////////////////////////////////////////////////////////////////////////////8/PzQEBAAwMDlZWVvLy8GhoaR0dHysrKdHR0R0dH1tbO4OLSf4B2jo6O5ubnqKmodnp2r7Os////////////////5OfezdHE////+fr4cXJwd3d36urrrKysZmZmxsbGtLS0WFhYgICA39/fhoaGenp6tra2+/v7////////////////////////////////////////////////////////////////////////////////////////////////8fHxT09PKSkpo6Ojq6urCgoKLy8vwcHBeXl5OTk6jY2Nl5eVJCQjR0dG3Nzc4ODgjY2Nra2s/P36////////////e3p4Pz88oqGfs7KwY2NjgYGBra2tUlJSXl5emJiYo6OjCAgIREREra2tQUFBMjIyj4+P+/v7////////////////////////////////////////////////////////////////////////////////////////////////7e3tVVVVERERo6Ojvr6+CgoKMjIy2traoaGhSkpKrKysr6+vW1tbhoaG8PHxxsXFqqioyMfH6+rq+vr6/f39////hoaGODg49vb2ubm5cHBwmJiYtbW1d3d3aWlpvLy84+PjCQkJTU1N29vbMTExMDAwb29v/Pz8////////////////////////////////////////////////////////////////////////////////////////////////9vb2gYGBAgICk5OT2traHR0dOTk54+PjkZGRS0tLe3t7h4eHiYmJnp6ei4uLnJycsrCwo6GhnJubq6ur////7OzsnJycdHR0wcHBm5ubbGxssLCw7e3tiIiIXFxcra2tn5+fAAAANzc3s7OzIyMjNzc3qqqq////////////////////////////////////////////////////////////////////////////////////////////////////////6enpz8/P4+Pj+vr62tra29vb/Pz81tbW09PT09PT4ODg5OTkysrKurm56urq397e5OTk4uHh0tLS////4eHh3NzczMzMoaGh7u7u4eHh3t7e/f39zs7OwsLC////0tLShoaGg4ODuLi4oKCgmpqaurq6/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////z8/PmJiYt7e37OzsuLi4gYGBy8vL////////////z8/PhISEhISEz8/P2trag4OD3d3d6urq1dXVvb298fHx1NTUdHR0nZ2d9PT0q6urtLS0/f39////////////////+Pj4+/v7/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/f39/v7+////39/fYGBgT09PgoKCnJycOTk5YWFhra2t1dXVyMjIz8/P5ubme3t7fX195OTkZGRkSkpKfHx8pqamQkJCQ0NDmJiYt7e3TU1NYGBgxsbGRERENTU1vLy8/////v7+/v7+/v7++/v7/Pz8/////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+////////////6OjoeXl5V1dXf39/lpaWYGBgiYmJt7e3l5eXbW1tcnJy/v7+4eHhaGho1dXVhYWFYGBgmJiYwMDATk5OZWVlpaWlnJyca2trVFRU2dnZc3NzWVlZ7e3t/////v7+/////v7+/////////////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+////////6urqZmZmOjo6dXV1mJiYTExMZmZmtra2////////////////sLCwjo6O5eXlrq6uRkZGhoaGioqKY2NjnJyctbW1hYWFNzc3jIyMxsbGaGhoWVlZysrK/////v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////////v7+/v7+/v7+/////Pz87e3tuLi4k5OTm5ubwMDAk5OTuLi4x8fH+fn5////////////wsLC3t7e////xMTEiIiI2NjYx8fHioqKr6+vtbW1tbW1cXFxmZmZu7u7hYWFcHBwwcHB/////v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Pz8////////////////////////////////+/v7/v7+////////////////////////+vr6+/v7////////6urq8fHx/////Pz88fHx8vLy+vr69/f3+Pj4/f39/v7+/v7+/v7+/v7+/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAA="
};
/*********************************hei hei hei**************************************/

/***********************************************************************/
function resetObject(object, param) {
    ScriptManager.popEl(object);
    if (param && param.parent) param.parent.addChild(object);
    else $.root.addChild(object);
    object.transform.matrix3D = null;
    return object;
}
/***********************************************************************/
function setParameters(object, param) {
    foreach(param, 
    function(key, val) {
        if (object.hasOwnProperty(key)) object['' + key] = val;
    });
}
/***********************************************************************/
function eraseParameters(param, filter) {
    var newParam = {};
    foreach(param, 
    function(key, val) {
        if (!filter.hasOwnProperty(key)) newParam['' + key] = val;
    });
    return newParam;
}

function createCanvas(param) {
    var object = resetObject($.createCanvas({
        lifeTime: 0
    }), param);
    setParameters(object, eraseParameters(param, {
        parent: 0
    }));
    return object;
};

function createText(str, param) {
    var object = resetObject($.createComment(str, {
        lifeTime: 0
    }), param);
    object.defaultTextFormat = $.createTextFormat('微软雅黑', (param && param.size) || 14, (param && param.color != null) ? param.color: 0xFFFFFF, false, false, false);
    object.filters = [];
    object.text = str;
    setParameters(object, eraseParameters(param, {
        parent: 0,
        size: 0,
        color: 0
    }));
    return object;
}

function fillRect(g, x, y, width, height, color) {
    g.graphics.beginFill(color);
    g.graphics.drawRect(x, y, width, height);
    g.graphics.endFill();
};

function rgba2argb(data) {
	for (var i = 0; i < data.length; i += 4) {
		var temp = data[i+2];
		data[i+2] = data[i];
		data[i] = temp;
	}
	return data;
}

function extract(data) {
    var bmd = Bitmap.createBitmapData(1, 1);
    var output = bmd.getPixels(bmd.rect);
    output.clear();
    var dataBuffer = [];
    dataBuffer.length = 4;
    var outputBuffer = [];
    outputBuffer.length = 3;
    var cnt = 0;
    for (var i = 0; i < data.length; i += 4) {
        for (var j = 0; j < 4 && i + j < data.length; j++) {
            dataBuffer[j] = BASE64_CHARS.indexOf(data.charAt(i + j));
        }

        // attention, bgr to rgb convertion!
        outputBuffer[2] = (dataBuffer[0] << 2) + ((dataBuffer[1] & 0x30) >> 4);
        outputBuffer[1] = ((dataBuffer[1] & 0x0f) << 4) + ((dataBuffer[2] & 0x3c) >> 2);
        outputBuffer[0] = ((dataBuffer[2] & 0x03) << 6) + dataBuffer[3];
        for (var k = 0; k < outputBuffer.length; k++) {
        	cnt++;
            if (dataBuffer[k + 1] == 64) break;
            if (cnt > 54) { // skip bmp header
            	if (cnt % 3 == 1) { 
            		output.writeByte(255); // add alpha channel
            	};
            	output.writeByte(outputBuffer[k]);
            };
            
        }
    }
    output.position = 0;
    //output = rgba2argb(output);
    return output;
}

function loadBitmapData(width, height, raw) {
    var bmd = Bitmap.createBitmapData(width, height);
    trace((extract(raw)).length);
    bmd.setPixels(bmd.rect, extract(raw));
    return bmd;
}

function createBitmap(bitmapData, x, y, lifeTime, scale, parent) {
    var bmp = Bitmap.createBitmap({
        bitmapData: bitmapData,
        lifeTime: lifeTime,
        parent: parent,
        scale: scale
    });
    bmp.x = x;
    bmp.y = y;
    return bmp;
}

var mainCanvas = $.createCanvas({
    x: 0,
    y: 0,
    lifeTime: INT_MAX
});

var qrcode	= QRCode(-1, 2);
qrcode.addData(qr_options.url);
qrcode.make();

var idx = qr_options.position;
var qrCanvas = $.createCanvas({
	x: (posIndex[idx]).x,	
	y: (posIndex[idx]).y,
	lifeTime: qr_options.lifeTime,
	parent: mainCanvas
});

// qr_code
var block_size = height / 6 / qrcode.getModuleCount();
for( var row = 0; row < qrcode.getModuleCount(); row++ ){
	for( var col = 0; col < qrcode.getModuleCount(); col++ ){
		if (qrcode.isDark(row, col)) {
			fillRect(qrCanvas, col*block_size, row*block_size, block_size, block_size, qr_options.color);
		} else {
			fillRect(qrCanvas, col*block_size, row*block_size, block_size, block_size, 0xFFFFFF);
		}
	}	
}


// text
if (qr_options.text != null) {
	var text_x = (posIndex[idx]).x + qr_size / 2 - qr_options.text.length/2.0*qr_options.text_size;
	var text_y;
	if (idx <= 1) { // top
		text_y = (posIndex[idx]).y + qr_size + 10;
	} else { // bottom
		text_y = (posIndex[idx]).y - qr_options.text_size - 10;
	}
	$.createComment(qr_options.text, {
		x:text_x,
		y:text_y,
		fontsize: qr_options.text_size,
		color: qr_options.text_color,
		lifeTime:qr_options.lifeTime,
		font: "微软雅黑"
	});
};

// image
if (qr_options.image_data != null) {
	var scale = img_size / 64.0;
	var bmd = loadBitmapData(64, 64, qr_options.image_data);
	var bmp = createBitmap(bmd, qr_size/2 - img_size/2, qr_size/2 - img_size/2, 0, scale, qrCanvas);
};
