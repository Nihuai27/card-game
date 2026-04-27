const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // 只允许POST请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { action, heroName, enemyName, enemyType, chapter, currentHp, maxHp, currentGold, currentEnergy, maxEnergy } = JSON.parse(event.body);

        // 获取API Key（从环境变量）
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API Key not configured' })
            };
        }

        let prompt = '';
        let url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

        if (action === 'battleDialogue') {
            // 生成战斗对话
            prompt = `你是一个DND风格的战斗对话生成器。请为以下战斗生成三句对话：
1. 英雄${heroName}的战斗宣言（狠话，10-20字）
2. 怪物${enemyName}的威胁话语（狠话，10-20字）
3. 战斗场景描述（30-50字）

要求：
- 风格：暗黑奇幻、史诗感、有张力
- 英雄要霸气自信
- 怪物要凶狠恐怖
- 场景描述要有氛围感

请严格按以下格式输出：
英雄：[英雄宣言]
怪物：[怪物威胁]
场景：[场景描述]`;

        } else if (action === 'randomEvent') {
            // 生成随机事件
            prompt = `你是一个DND风格的随机事件生成器。请为${heroName}在第${chapter}章的冒险生成一个随机事件。

当前游戏状态（请根据这些信息生成相关事件）：
- 英雄生命值：${currentHp}/${maxHp}
- 金币：${currentGold}
- 能量：${currentEnergy}/${maxEnergy}
- 刚刚击败的敌人：${enemyName}

要求：
1. 事件名称（8-12字，开头带一个emoji）
2. 事件描述（60-100字，要与当前游戏状态相关，描述场景和处境）
3. 两个选择选项（每个选项12-20字，要具体明确）
4. 每个选项的结果描述（40-60字，必须包含具体数值变化）

事件类型参考（结合当前状态）：
- 如果英雄生命低：治愈之泉、神秘药剂师、休息营地
- 如果金币多：黑市商人、赌博机会、投资陷阱
- 如果能量低：能量水晶、冥想圣地、神秘符文
- 根据章节主题：古代遗迹、神秘洞穴、废弃营地

数值变化规则（必须明确写出）：
- 生命变化："生命+15"、"生命-10"
- 金币变化："金币+30"、"金币-20"
- 能量变化："能量+1"、"能量恢复满"
- 最大生命："最大生命+5"
- 注意：奖励和惩罚要平衡，不要让玩家太容易或太难

请严格按以下格式输出：
名称：[emoji+事件名称]
描述：[事件描述]
选项1：[选项1描述]
选项2：[选项2描述]
结果1：[结果1描述，包含具体数值变化]
结果2：[结果2描述，包含具体数值变化]`;

        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid action' })
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: action === 'battleDialogue' ? 200 : 600,
                temperature: action === 'battleDialogue' ? 0.8 : 0.85
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'API request failed', details: errorData })
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        return {
            statusCode: 200,
            body: JSON.stringify({ content })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
