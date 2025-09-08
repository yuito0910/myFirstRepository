const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const formidable = require('formidable');

// Folder for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        // Serve files from /public
        let filePath = path.join(
            __dirname,
            'public',
            req.url === '/' ? 'index.html' : req.url
        );

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - File Not Found</h1>', 'utf8');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end(`<h1>Server Error: ${err.code}</h1>`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': mime.lookup(filePath) || 'text/plain' });
                res.end(content, 'utf8');
            }
        });
    } else if (req.method === 'POST' && req.url === '/upload') {
        // Handle file upload
        const form = formidable({
            uploadDir: uploadDir,
            keepExtensions: true,
            maxFileSize: 1 * 1024 * 1024, // 1 MB limit
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`<h1>Upload Error: ${err.message}</h1>`);
                return;
            }

            const file = files.file?.[0]; // get uploaded file
            if (!file) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<h1>No file uploaded.</h1>');
                return;
            }

            // ✅ Only allow HTML files
            const allowedType = 'text/html';
            if (file.mimetype !== allowedType) {
                fs.unlinkSync(file.filepath); // delete invalid file
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<h1>Invalid file type. Only HTML files are allowed.</h1>');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h1>File uploaded successfully: ${file.originalFilename}</h1>`);
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/html' });
        res.end('<h1>405 - Method Not Allowed</h1>');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
