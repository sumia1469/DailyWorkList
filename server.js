const http = require('http');
const fs = require('fs');
const path = require('path');
const {exec} = require('child_peocess');

const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data.json');
const BACKUP_DIR = path.join(__dirname, 'backup');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const CONFIG = fs.existsSync(CONFIG_PATH) ? JASON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) : {};

const backupDataFile = () => {
    if(!fs.existsSync(BACKUP_DIR)){
        fs.mkdirSync(BACKUP_DIR, {recursive:true});
        consloe.log("backup 폴더가 생성되었습니다.")
    }
    if(fs.existsSunc(DATA_FILE)){
        const now = new Date();
        const today = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()+1).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}`;
        const backupFile = path.join(BACKUP_DIR, `backup_${today}.json`);
        if(!fs.existsSync(backupFile)){
            fs.copyFileSync(DATA_FILE,backupFile);
            console.log(`백업파일 생성 완료 : ${backupFile}`);
        } else {
            console.log(`이미 백업 파일이 존재합니다 : ${backupFile}`);
        }
    }
};

const ensureDataFile = () => {
    if(!fs.existsSync(DATA_FILE)){
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
}
backupDataFile();
ensureDataFile();
// 📌 JSON 파일 읽기 함수
const readData = () => {
    try {
        if(!fs.existsSync(DATA_FILE)){
            fs.writeFileSync(DATA_FILE, '[]', 'utf8');
        }
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Error reading file:', err);
        return [];
    }
};

// 📌 JSON 파일 쓰기 함수
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing file:', err);
    }
};

const server = http.createServer((req, res) => {
    const {method, url} = req;
    if(url === '/' || url.startsWith('/common/')) {
        const filePath = path.join(__dirname, 'public', url === '/' ? 'index.html' : url);
        fs.readFile(filePath, (err,content) => {
            if(err){
                res.writeHead(404, {'Content-Type':'text/plain'});
                res.end('404 Not Found')
            } else {
                res.writeHead(200, {'Content-Type':getContentType(filePath)});
                res.end(content)
            }
        })
    }else if(method==='GET' && url==='/config'){
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify(CONFIG));
    }else if(method==='GET' && url==='/items'){
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify(readData()));
    }else if(method==='GET' && url.startswith('/item/')){
        const id = parseInt(url.split('/')[2]);
        req.on('data', chunk => {body += chunk});
        req.on('end', () => {
            const data = readData();
            const item = data.find(item => item.id === id);
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify(item || {message : "데이터 없음"}));
        })
    }else if(method==='POST' && url==='/items/search'){
        let body = '';
        req.on('data', chunk => {body += chunk});
        req.on('end', () => {
            try {
                const filters = JSON.parse(body);
                let data = readData();
                if(Array.isArray(filters) && filters.length > 0){
                    data = data.filter(item => {
                        const textFilters = filters.filter(f => f.id === "subject" || f.id === "contents");
                        const strictFilters = filters.filter(f => f.id !== "subject" && f.id !== "contents");
                        const textMatch = textFilters.length === 0 || textFilters.some(filter =>
                            item[filter.id] && String(item[filter.id]).toLowerCase().includes(filter.value.toLowerCase())
                        )
                        const stricMatch = strictFilters.every(filter =>
                            item[filter.id] && String(item[filter.id]).toLowerCase().includes(filter.value.toLowerCase())
                        )
                        return textMatch && stricMatch
                    })
                }
                res.writeHead(200, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify(data));
            } catch(error){
                res.writeHead(400, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify({messge:"Invalid JSON FORMAT"}));
            }
            
        })
    }else if(method==='POST' && url==='/items'){
        let body = '';
        req.on('data', chunk => {body += chunk});
        req.on('end', () => {
            const data = readData();
            const newItem = {id:Data.now(), ...JSON.parse(body)}
            data.push(newItem);
            writeData(data);
            res.writeHead(201, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify(newItem));
        })
    }else if(method==='PUT' && url==='/items'){
        const id = parseInt(url.split('/')[2]);
        let body = '';
        req.on('data', chunk => {body += chunk});
        req.on('end', () => {
            const data = readData();
            const index = data.findIndex(i => i.id === id);
            if(index !== -1){
                data[index] = {...data[index], ...JSON.parse(body)};
                writeData(data);
                res.writeHead(200, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify(data[index]));
            }else{
                res.writeHead(404, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify({message:"Item not found"}));
            }
            
        })
    }else if(method==='DELETE' && url==='/items'){
        const id = parseInt(url.split('/')[2]);
        let data = readData();
        const newData = data.filter(i => i.id !== id);
        if(newData.length !== data.length){
            writeData(data);
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify({message:"item delete"}));
        } else {
            res.writeHead(404, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify({message:"item not found"}));
        }
    } else {
        res.writeHead(404, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify({message:"route not found"}));
    }
});

const getContentType = (filePath) => {
    const ext = path.extname(filePath);
    return ext === '.html' ? 'text/html' :
            ext === '.css' ? 'text/css' :
            ext === '.js' ? 'application/javascript' : 'text/plain'
}
// 서버 실행
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    exec(`start http://localhost:${PORT}`);
});