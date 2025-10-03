import { convert,validate } from '../src/index.js';
import path from 'path';
import fs from 'fs';

const fileName = "subtitle_eng.ass";
const vttFileName = fileName.replace(".ass", ".vtt");
async function convertSub() {
    const content = await fs.promises.readFile(path.join(__dirname, fileName), 'utf8');
    const result = await convert(
        content,
        "ass",
        "vtt"
    );
    return result;
}
/* convertSub().then((data) => {
    console.log("done",data);
    fs.promises.writeFile(path.join(__dirname, vttFileName), data);
}); */
async function validateVttStructure() {
    const contentVerify = await fs.promises.readFile(path.join(__dirname, vttFileName), 'utf8');
    const result = validate(contentVerify, "vtt");
    return result;
}
validateVttStructure().then((data) => {
    console.log("done",data);
});
