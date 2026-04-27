// 构建脚本，用于处理环境变量注入
const fs = require('fs');
const path = require('path');

// 读取index.html文件
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 注入环境变量
const apiKey = process.env.API_KEY || '';
indexContent = indexContent.replace('%API_KEY%', apiKey);

// 写回文件
fs.writeFileSync(indexPath, indexContent);
console.log('环境变量注入完成');
