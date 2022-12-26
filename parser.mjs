//Very simple MP4 'mvhd' atom parser.
//Quick and dirty, no error handling, no validation, no tests, no documentation, no nothing, but is's free and open source. ;)

import fs from "fs";

const params = process.argv.slice(2);
const filename = params[0];

const size = fs.statSync(filename).size;
console.debug("File size is: ", size);

const file = fs.openSync(filename, "r");

const desiredSize = 16384;
const bufferSize = size > desiredSize ? desiredSize : size;
console.debug("Determined buffer size is: ",bufferSize);

let buff = Buffer.alloc(bufferSize);

const readToBuff = (offset) => {
  console.debug("Reading to buffer from offset: ", offset);
  fs.readSync(file, buff, 0, buff.length, offset);
  console.debug("Buffer size is: ", buff.length);
  console.debug("Buffer is: ", buff);
}

const mvhdHeader = Buffer.from("mvhd");

//Depends on the file steamable or not, the 'mvhd' atom can be at the begining or at the end of the file.
//We read 16kb from the begining of the file and if the 'mvhd' atom is not found, we read 16kb from the end of the file.
//We hope that the 'mvhd' atom will be found in one of the 16kb chunks. ;)

readToBuff(0); //from the begining of the file
let mvhdIndex = buff.indexOf(mvhdHeader);
let bufferLocation = "beginning";
if (mvhdIndex < 0) { 
  console.debug("Could not find the 'mvhd' atom at the begining of the file!"); 
  readToBuff(size - buff.length); //from the end of the file
  mvhdIndex = buff.indexOf(mvhdHeader);
  bufferLocation = "end";
}
fs.closeSync(file);

if (mvhdIndex < 0) throw Error("Could not find the 'mvhd' atom in the file!");

console.debug("Index of the header is: ", mvhdIndex);

// parse the mvhd atom
const atomBegins = mvhdIndex - 4;

let start = atomBegins;
// fields are stored in big endian
const atomSize = buff.readUInt32BE(start);
start += 4;

const atomType = buff.subarray(start, start + 4);
start += 4;

const version = buff.readUInt8(start);
start += 1;

const flags = buff.subarray(start, start + 3);
start += 3;

//in seconds beginning 1904 to 2040, 66 years difference to 1970 (unix epoch)
const creationTime = buff.readUInt32BE(start);
start += 4;

//in seconds beginning 1904 to 2040, 66 years difference to 1970 (unix epoch)
const modificationTime = buff.readUInt32BE(start);
start += 4;

const timeScale = buff.readUInt32BE(start);
start += 4;

const duration = buff.readUInt32BE(start);
start += 4;

const preferedRate = buff.readDoubleBE(start);
start += 4;

const preferedVolume = buff.readFloatBE(start);
start += 2;

const reserved = `${buff.subarray(start, start + 10)}`;
start += 10;

const matrix = `${buff.subarray(start, start + 36)}`;
start += 36;

const previewTime = buff.readUInt32BE(start);
start += 4;

const previewDuration = buff.readUInt32BE(start);
start += 4;

const posterTime = buff.readUInt32BE(start);
start += 4;

const selectionTime = buff.readUInt32BE(start);
start += 4;

const selectionDuration = buff.readUInt32BE(start);
start += 4;

const currentTime = buff.readUInt32BE(start);
start += 4;

const nextTrackId = buff.readUInt32BE(start);

const durationInSeconds = parseFloat(duration / timeScale).toFixed(2);

//The stored time is in seconds since midnight, January 1, 1904
//There is no time zone information stored in the atom, so use UTC!
const secondsBetween1904And1970 = 2_082_844_800;
const creationDate = new Date((creationTime - secondsBetween1904And1970) * 1000);
const modificationDate = new Date((modificationTime - secondsBetween1904And1970) * 1000);

console.debug(
  '\n',
  `MP4 file has successfully been parsed! \n`,
  '\n',
  `⏱   video duration in seconds: ${durationInSeconds}\n`,
  `📅   creation time UTC: ${creationDate.toUTCString()}\n`,
  `📅   modification time UTC: ${modificationDate.toUTCString()}\n`,
  '\n',
  `The 'mvhd' atom has parsed from the buffer located at the ${bufferLocation} of the file.\n`,
  `The 'mvhd' atom begining at position ${atomBegins}\n`,
  `The last parsed field starts at position ${start}\n`,
  '\n',
  "----------- [ MVHD ATOM BEGINS] -----------\n",
  `atomSize: ${atomSize}\n`,
  `atomType: ${atomType}\n`,
  `version: ${version}\n`,
  `flags: ${flags}\n`,
  `creation time: ${creationTime}\n`,
  `modification time: ${modificationTime}\n`,
  `time scale: ${timeScale}\n`,
  `duration: ${duration}\n`,
  `prefered rate: ${preferedRate}\n`,
  `prefered volume: ${preferedVolume}\n`,
  `reserved: ${reserved}\n`,
  `matrix: ${matrix}\n`,
  `preview time: ${previewTime}\n`,
  `preview duration: ${previewDuration}\n`,
  `poster time: ${posterTime}\n`,
  `selection time: ${selectionTime}\n`,
  `selection duration: ${selectionDuration}\n`,
  `current time: ${currentTime}\n`,
  `next track id: ${nextTrackId}\n`,
  "------------ [ MVHD ATOM ENDS] ------------\n",
  '\n',);
