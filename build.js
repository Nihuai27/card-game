// 构建脚本，用于生成配置文件
const fs = require('fs');
const path = require('path');

// 创建config.js文件，注入环境变量
const configContent = `// 自动生成的配置文件（生产环境）
window.ENV = {
    API_KEY: '${process.env.API_KEY || ''}'
};`;

// 写入config.js文件
const configPath = path.join(__dirname, 'config.js');
fs.writeFileSync(configPath, configContent);
console.log('配置文件生成完成');
