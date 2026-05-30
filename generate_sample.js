const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const user = {
    name: "Pugg's Parent", displayId: '914B85', petName: 'Pugg',
    petCategory: 'DOG', petBreed: 'FRENCH_BULLDOG', points: 105,
    pointsDeposited: 0, trackingDay: null, progress: 0,
    stoolType: 'N/A', condition: 'N/A'
};

const now = new Date();
const dateStr = now.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false 
}).replace(/\//g, '-');

const progressCount = user.progress || 0;
const mmToPt = 2.8346;
const paperW = Math.round(80 * mmToPt);
const paperH = Math.round(223.40 * mmToPt);
const marginTop = Math.round(15 * mmToPt);
const marginLeft = Math.round(7 * mmToPt);
const marginRight = Math.round(7 * mmToPt);
const marginBottom = Math.round(50 * mmToPt);

if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
const filePath = path.join('tmp', 'sample_receipt_noto.pdf');

const doc = new PDFDocument({
    size: [paperW, paperH],
    margins: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight }
});
const stream = fs.createWriteStream(filePath);
doc.pipe(stream);

const fontCandidates = [
    path.join(__dirname, 'fonts', 'NotoSansTC-VF.ttf'),
    'C:\\Windows\\Fonts\\NotoSansTC-VF.ttf'
];
let fontPath = null;
for (const c of fontCandidates) {
    if (fs.existsSync(c)) { fontPath = c; break; }
}
doc.registerFont('NotoSansTC', fontPath);
const fontName = 'NotoSansTC';

const contentW = paperW - marginLeft - marginRight;
const leftX = marginLeft;
const lineGap = 2;

// Preview zones
doc.save().rect(0, 0, paperW, paperH).stroke('#CCCCCC').restore();
doc.save().rect(0, 0, paperW, marginTop).fillOpacity(0.1).fill('#FFD700').restore();
doc.save().fontSize(5).font('Helvetica').fillColor('#999')
   .text('HEADER (pre-printed)', 0, marginTop / 2 - 3, { width: paperW, align: 'center' }).restore();
doc.save().rect(0, paperH - marginBottom, paperW, marginBottom).fillOpacity(0.1).fill('#FFD700').restore();
doc.save().fontSize(5).font('Helvetica').fillColor('#999')
   .text('FOOTER (pre-printed: dog + QR + logo)', 0, paperH - marginBottom + 8, { width: paperW, align: 'center' }).restore();
doc.save().rect(marginLeft, marginTop, contentW, paperH - marginTop - marginBottom).stroke('#EEEEEE').restore();

function textBold(text, x, y, options = {}) {
    if (y !== undefined) {
        doc.text(text, x, y, options);
        const afterY = doc.y;
        doc.text(text, x + 0.3, y, options);
        doc.y = afterY;
    } else {
        const curY = doc.y;
        doc.text(text, x, curY, options);
        const afterY = doc.y;
        doc.text(text, x + 0.3, curY, options);
        doc.y = afterY;
    }
}

function drawDottedDivider() {
    const y = doc.y + 2;
    doc.save().strokeColor('#999999').lineWidth(0.5).dash(2, { space: 2 })
       .moveTo(leftX, y).lineTo(leftX + contentW, y).stroke().restore();
    doc.y = y + 4;
}

function drawProgressBlocks(x, y, count, total) {
    const blockSize = 7, gap = 3;
    for (let i = 0; i < total; i++) {
        const bx = x + i * (blockSize + gap);
        if (i < count) {
            doc.save().rect(bx, y, blockSize, blockSize).fill('#333333').restore();
        } else {
            doc.save().rect(bx, y, blockSize, blockSize).lineWidth(0.5).stroke('#999999').restore();
        }
    }
    doc.y = y + blockSize + 3;
}

function labelValue(label, value, opts = {}) {
    const ly = doc.y;
    doc.font(fontName).fontSize(opts.fontSize || 7);
    const labelW = doc.widthOfString(label);
    doc.text(label, leftX, ly, { width: labelW + 1, lineGap: 1 });
    doc.text(label, leftX + 0.3, ly, { width: labelW + 1, lineGap: 1 });
    doc.text(value, leftX + labelW, ly, { lineGap: 1 });
}

// SECTION 1
doc.fontSize(9).font(fontName);
textBold('DEPOSIT RECEIPT', leftX, marginTop, { width: contentW, align: 'center' });
doc.moveDown(0.2);
drawDottedDivider();

// SECTION 2
labelValue('Username : ', user.name, { fontSize: 7 });
labelValue('User ID  : ', user.displayId, { fontSize: 7 });
labelValue('Pet Name : ', user.petName, { fontSize: 7 });
labelValue('Category : ', user.petCategory, { fontSize: 7 });
labelValue('Breed    : ', user.petBreed, { fontSize: 7 });
labelValue('Date     : ', dateStr, { fontSize: 7 });
doc.moveDown(0.15);
drawDottedDivider();

// SECTION 3
doc.fontSize(8).font(fontName);
textBold('ACCOUNT SUMMARY', leftX);
doc.moveDown(0.2);
const pointsY = doc.y;
doc.fontSize(16).font(fontName);
textBold(`${user.points}`, leftX, pointsY);
const ptw = doc.widthOfString(`${user.points}`, { fontSize: 16 });
doc.fontSize(7).font(fontName);
textBold('P-Coins', leftX + ptw + 3, pointsY + 7);
doc.y = pointsY + 18;
doc.fontSize(6.5).font(fontName).text(`+${user.pointsDeposited} P-Coins deposited today`, leftX);
doc.moveDown(0.15);
drawDottedDivider();
labelValue('Tracking day : ', user.trackingDay ? `Day ${user.trackingDay}` : 'N/A', { fontSize: 7 });
const progressY = doc.y + 2;
doc.fontSize(7).font(fontName);
textBold('Progress : ', leftX, doc.y);
drawProgressBlocks(leftX + 48, progressY, progressCount, 8);
doc.moveDown(0.15);
drawDottedDivider();

// SECTION 4
doc.fontSize(8).font(fontName);
textBold('DEPOSIT DETAILS', leftX);
doc.moveDown(0.15);
labelValue('Stool Type : ', user.stoolType, { fontSize: 7 });
labelValue('Condition  : ', user.condition, { fontSize: 7 });
doc.moveDown(0.15);
drawDottedDivider();

// SECTION 5
doc.fontSize(8).font(fontName);
textBold('已解鎖獎勵 REWARD CREDITED', leftX);
doc.moveDown(0.15);
doc.fontSize(6.5).font(fontName);
doc.text('免費寵物自拍館拍攝體驗（電子版）', leftX, doc.y, { lineGap: 1 });
doc.text('(Free Pet Photobooth Session - Digital Version)', { lineGap: 1 });
doc.moveDown(0.15);
drawDottedDivider();

// SECTION 6
doc.fontSize(8).font(fontName);
textBold('下一步任務 NEXT STEP', leftX);
doc.moveDown(0.15);
doc.fontSize(6.5).font(fontName);
doc.text('持續每日掃描便便，解鎖更多豐富獎賞：', leftX, doc.y, { lineGap: 1 });
doc.text('→ 累積滿 600 P-coins 即可贏取 Dyson 寵物家電！', { lineGap: 1, width: contentW });
doc.text('→ 連續打卡14日解鎖 Purina 專業寵物糧！', { lineGap: 1, width: contentW });

// Debug info
const endY = doc.y;
const contentEndMm = (endY / mmToPt).toFixed(1);
const footerStartMm = ((paperH - marginBottom) / mmToPt).toFixed(1);
console.log(`Content ends at: ${contentEndMm}mm | Footer starts at: ${footerStartMm}mm | Paper: 223.40mm`);
console.log(`Remaining space: ${(footerStartMm - contentEndMm).toFixed(1)}mm`);

doc.end();
stream.on('finish', () => {
    console.log(`Done: ${filePath}`);
    require('child_process').exec(`start "" "${path.resolve(filePath)}"`);
});
