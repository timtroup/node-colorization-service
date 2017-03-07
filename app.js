const restify = require('restify');
const execSync = require('child_process').execSync;
const cmd = 'th colorize.lua';
const uuidV4 = require('uuid/v4');
const fs = require("fs");
const request = require('request-promise');

colorizeImage = (img) => {
    let data = img.replace(/^data:image\/\w+;base64,/, "");
    let buf = new Buffer(data, 'base64');
    let filename = uuidV4() + '.jpg';
    let outputFilename = uuidV4() + '-color.jpg';
    fs.writeFileSync(filename, buf);
    execSync(cmd + ' ' + filename + ' ' + outputFilename);
    fs.unlinkSync(filename);
    return outputFilename;
};

colorizeImageFromUrl = async (imgUrl) => {

    let filename = uuidV4() + '.jpg';
    let img = await request(imgUrl, { encoding : null });
    fs.writeFileSync(filename, img);

    let outputFilename = uuidV4() + '-color.jpg';
    execSync(cmd + ' ' + filename + ' ' + outputFilename);
    fs.unlinkSync(filename);
    return outputFilename;
};

readFile = (colorizedFile, res, next) => {
    try {
        let image = fs.readFileSync(colorizedFile, {encoding: 'base64'});
        fs.unlinkSync(colorizedFile);
        res.header('Content-Type', 'image/jpeg');
        res.send(200, image);
    } catch(ex) {
        console.log(ex);
    }
    return next();
};

let server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.CORS());
server.post('/colorizeImage', function create(req, res, next) {
    let colorizedFile = colorizeImage(req.body.data);
    readFile(colorizedFile, res, next);
    return next();
});
server.post('/colorizeImageFromUrl', async function create(req, res, next) {
    let colorizedFile = await colorizeImageFromUrl(req.body.data);
    readFile(colorizedFile, res, next);
    return next();
});
server.get('/colorizedImage/:filename', function create(req, res, next) {
    let data = fs.readFileSync(req.params.filename);
    res.header('Content-Type', 'image/jpeg');
    res.send(200, data);
    return next();
});

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});