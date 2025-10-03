import { convert,validate,detectFormatSimple } from '../src/index.js';
import path from 'path';
import fs from 'fs';

const fileName = "subtitle_eng.ass";
const vttFileName = fileName.replace(".ass", ".vtt");
async function convertSub() {
    const content = await fs.promises.readFile(path.join(__dirname, fileName), 'utf8');
    const result = await convert(
        content,
        "ass",
        "json"
    );
    return result;
}
convertSub().then((data) => {
    console.log("done",data);
    const format = detectFormatSimple(data);
    console.log("format",format);
    if (!format) return;
    fs.promises.writeFile(path.join(__dirname, vttFileName.replace(".vtt","."+format)), data);
});
/* async function validateVttStructure() {
    const contentVerify = await fs.promises.readFile(path.join(__dirname, fileName), 'utf8');
    const result = validate(contentVerify, "ass");
    const format = detectFormatSimple(contentVerify);
    console.log("format",format);
    return {result,format};
}
validateVttStructure().then((data) => {
    console.log("done",data);
});
 */