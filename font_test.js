const PDFDocument = require('pdfkit');
const fs = require('fs');
if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');

const doc = new PDFDocument();
const stream = fs.createWriteStream('tmp/font_test.pdf');
doc.pipe(stream);

// Test NotoSansTC variable font
try {
    doc.registerFont('NotoSansTC', 'C:\\Windows\\Fonts\\NotoSansTC-VF.ttf');
    doc.font('NotoSansTC').fontSize(12).text('NotoSansTC-VF: 中文測試 已解鎖獎勵 REWARD', 50, 50);
    console.log('NotoSansTC-VF.ttf: OK');
} catch (e) {
    console.log('NotoSansTC-VF.ttf FAILED:', e.message);
}

// Test kaiu
try {
    doc.registerFont('KaiU', 'C:\\Windows\\Fonts\\kaiu.ttf');
    doc.font('KaiU').fontSize(12).text('KaiU: 中文測試 已解鎖獎勵 REWARD', 50, 80);
    console.log('kaiu.ttf: OK');
} catch (e) {
    console.log('kaiu.ttf FAILED:', e.message);
}

doc.end();
stream.on('finish', () => console.log('Done: tmp/font_test.pdf'));
