// 游戏状态
const gameState = {
    hero: null,
    enemy: null,
    chapter: 1,
    monsterCount: 0,
    eliteCount: 0,
    isPlayerTurn: true,
    cardUsed: false,
    gameActive: false,
    selectedCard: null,
    selectedCardIndex: null,
    selectedSkill: null,
    playerName: '',
    totalKills: 0,
    energy: 2,           // 当前能量
    maxEnergy: 3,        // 最大能量
    skillCost: 3,        // 技能消耗能量
    gold: 0,             // 金币
    equipment: [],       // 装备
    apiKey: ''           // API Key 将在初始化时获取
};

// 获取 API Key 的函数
function getApiKey() {
    // 从 config.js 获取（支持base64编码）
    if (typeof window !== 'undefined' && window.ENV && window.ENV.API_KEY) {
        const key = window.ENV.API_KEY;
        if (window.ENV.isBase64 && key) {
            // 解码base64
            try {
                return atob(key);
            } catch (e) {
                return key;
            }
        }
        return key;
    }
    // 从 URL 参数获取（测试用）
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('apiKey')) {
            return params.get('apiKey');
        }
    }
    // 从 Netlify 环境变量获取（通过构建时注入）
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    return '';
}

// 初始化 API Key
gameState.apiKey = getApiKey();
console.log('API Key 已加载:', gameState.apiKey ? '已设置' : '未设置');

// 英雄图片映射 - 根据实际图片内容重新分配
const HERO_IMAGE_MAP = {
    'ranger': 'photo/1.png',      // 1.png = 红发弓箭手 → 游侠
    'warrior': 'photo/4.png',     // 4.png = 骑士 → 战士
    'mage': 'photo/3.png',        // 3.png = 法师
    'cleric': 'photo/6.png',      // 6.png = 牧师形象 → 牧师
    'bard': 'photo/5.png',        // 5.png = 吟游诗人
    'monk': 'photo/7.png',        // 7.png = 武僧形象 → 武僧
    'paladin': 'photo/2.png',     // 2.png = 持盾重甲骑士 → 圣骑士
    'cavalier': 'photo/8.png',    // 8.png = 骑马持权杖圣职者 → 圣殿骑士
    'druid': 'photo/9.png'        // 9.png = 熊 → 德鲁伊
};

// 9个DND职业 - 每个英雄3个技能
const HEROES = [
    {
        id: 'warrior',
        name: '战士',
        desc: '高生命值、高防御，精通各种武器',
        hp: 120,
        maxHp: 120,
        block: 0,
        avatar: 'photo/warrior.svg',
        battleImage: 'photo/4.png',
        skills: [
            { name: '狂暴打击', icon: '🔥', desc: '造成25点伤害，获得10点格挡', type: 'attack', value: 25, block: 10 },
            { name: '钢铁意志', icon: '🛡️', desc: '获得30点格挡，恢复15点生命', type: 'defense', value: 15, block: 30 },
            { name: '旋风斩', icon: '⚔️', desc: '造成15点伤害×2次', type: 'multi', value: 15, times: 2 }
        ]
    },
    {
        id: 'mage',
        name: '法师',
        desc: '驾驭元素与奥术能量的施法者',
        hp: 70,
        maxHp: 70,
        block: 0,
        avatar: 'photo/mage.svg',
        battleImage: 'photo/3.png',
        skills: [
            { name: '火球术', icon: '🔥', desc: '造成35点伤害，无视格挡', type: 'attack', value: 35, ignoreBlock: true },
            { name: '冰霜护盾', icon: '❄️', desc: '获得20点格挡，敌人下回合攻击-5', type: 'defense', value: 0, block: 20, debuff: 5 },
            { name: '奥术飞弹', icon: '✨', desc: '造成12点伤害×3次', type: 'multi', value: 12, times: 3 }
        ]
    },
    {
        id: 'paladin',
        name: '圣骑士',
        desc: '神圣信仰与战斗技巧结合',
        hp: 110,
        maxHp: 110,
        block: 0,
        avatar: 'photo/paladin.svg',
        battleImage: 'photo/2.png',
        skills: [
            { name: '圣光审判', icon: '✨', desc: '造成20点伤害，恢复20点生命', type: 'hybrid', value: 20, heal: 20 },
            { name: '神圣护盾', icon: '🛡️', desc: '获得35点格挡', type: 'defense', value: 0, block: 35 },
            { name: '惩戒之锤', icon: '🔨', desc: '造成18点伤害，眩晕敌人1回合', type: 'stun', value: 18, stun: 1 }
        ]
    },
    {
        id: 'ranger',
        name: '游侠',
        desc: '自然的守护者，远程物理输出',
        hp: 90,
        maxHp: 90,
        block: 0,
        avatar: 'photo/ranger.svg',
        battleImage: 'photo/1.png',
        skills: [
            { name: '精准射击', icon: '🏹', desc: '造成28点伤害，无法被格挡', type: 'attack', value: 28, ignoreBlock: true },
            { name: '自然治愈', icon: '🌿', desc: '恢复25点生命，获得10点格挡', type: 'defense', value: 25, block: 10 },
            { name: '多重箭', icon: '📐', desc: '造成10点伤害×3次', type: 'multi', value: 10, times: 3 }
        ]
    },
    {
        id: 'cleric',
        name: '牧师',
        desc: '队伍的生命线，擅长治疗',
        hp: 95,
        maxHp: 95,
        block: 0,
        avatar: 'photo/cleric.svg',
        battleImage: 'photo/6.png',
        skills: [
            { name: '神圣治愈', icon: '💚', desc: '恢复40点生命，获得5点格挡', type: 'heal', value: 40, block: 5 },
            { name: '守护之光', icon: '✨', desc: '获得25点格挡，恢复15点生命', type: 'defense', value: 15, block: 25 },
            { name: '神圣冲击', icon: '⚡', desc: '造成20点伤害，恢复等同伤害的生命', type: 'drain', value: 20 }
        ]
    },
    {
        id: 'bard',
        name: '吟游诗人',
        desc: '用音乐创造奇迹的辅助者',
        hp: 80,
        maxHp: 80,
        block: 0,
        avatar: 'photo/bard.svg',
        battleImage: 'photo/5.png',
        skills: [
            { name: '激励之歌', icon: '🎵', desc: '造成15点伤害，恢复25点生命', type: 'hybrid', value: 15, heal: 25 },
            { name: '守护旋律', icon: '🛡️', desc: '获得20点格挡，下回合攻击+5', type: 'buff', value: 0, block: 20, buff: 5 },
            { name: '音波冲击', icon: '🎶', desc: '造成12点伤害×2次，无视格挡', type: 'multi', value: 12, times: 2, ignoreBlock: true }
        ]
    },
    {
        id: 'druid',
        name: '德鲁伊',
        desc: '熊形态的守护者，以力量碾压敌人',
        hp: 120,
        maxHp: 120,
        block: 0,
        avatar: 'photo/druid.svg',
        battleImage: 'photo/9.png',
        skills: [
            { name: '熊形态', icon: '🐻', desc: '变身为熊，获得35点格挡，造成15点伤害', type: 'hybrid', value: 15, block: 35 },
            { name: '狂暴撕咬', icon: '🦷', desc: '熊的利齿造成28点伤害，无视格挡', type: 'attack', value: 28, ignoreBlock: true },
            { name: '巨熊之怒', icon: '💢', desc: '连续爪击造成12点伤害×3次', type: 'multi', value: 12, times: 3 }
        ]
    },
    {
        id: 'monk',
        name: '武僧',
        desc: '依靠拳脚和气进行战斗',
        hp: 88,
        maxHp: 88,
        block: 0,
        avatar: 'photo/monk.svg',
        battleImage: 'photo/7.png',
        skills: [
            { name: '连击', icon: '👊', desc: '造成10点伤害×3次', type: 'multi', value: 10, times: 3 },
            { name: '气疗术', icon: '💨', desc: '恢复20点生命，获得20点格挡', type: 'defense', value: 20, block: 20 },
            { name: '猛虎掌', icon: '🐯', desc: '造成35点伤害，无视格挡', type: 'attack', value: 35, ignoreBlock: true }
        ]
    },
    {
        id: 'cavalier',
        name: '圣殿骑士',
        desc: '骑马的高贵骑士，神圣与荣耀的化身',
        hp: 115,
        maxHp: 115,
        block: 0,
        avatar: 'photo/cavalier.svg',
        battleImage: 'photo/8.png',
        skills: [
            { name: '神圣冲锋', icon: '🐴', desc: '造成30点伤害，获得15点格挡', type: 'attack', value: 30, block: 15 },
            { name: '圣光庇护', icon: '⛪', desc: '获得40点格挡，恢复10点生命', type: 'defense', value: 10, block: 40 },
            { name: '裁决之锤', icon: '⚡', desc: '造成22点伤害，眩晕敌人1回合', type: 'stun', value: 22, stun: 1 }
        ]
    }
];

// 普通怪物池
const NORMAL_ENEMIES = [
    { name: '哥布林', hp: 35, maxHp: 35, attack: 6, avatar: 'photo/monster_goblin.svg', desc: '弱小但狡猾的怪物' },
    { name: '史莱姆', hp: 40, maxHp: 40, attack: 5, avatar: 'photo/monster_slime.svg', desc: '黏糊糊的怪物' },
    { name: '骷髅兵', hp: 30, maxHp: 30, attack: 7, avatar: 'photo/monster_skeleton.svg', desc: '不死生物' },
    { name: '蝙蝠', hp: 25, maxHp: 25, attack: 8, avatar: 'photo/monster_bat.svg', desc: '迅捷的飞行生物' },
    { name: '巨鼠', hp: 28, maxHp: 28, attack: 6, avatar: 'photo/monster_rat.svg', desc: '巨大的变异老鼠' },
    { name: '毒蜘蛛', hp: 32, maxHp: 32, attack: 7, avatar: 'photo/monster_spider.svg', desc: '有毒的蜘蛛' }
];

// 精英怪物池
const ELITE_ENEMIES = [
    { name: '兽人战士', hp: 70, maxHp: 70, attack: 12, avatar: 'photo/monster_orc.svg', desc: '强壮的绿皮怪物' },
    { name: '黑暗法师', hp: 55, maxHp: 55, attack: 15, avatar: 'photo/monster_darkmage.svg', desc: '掌握黑暗魔法的术士' },
    { name: '狼人', hp: 65, maxHp: 65, attack: 14, avatar: 'photo/monster_werewolf.svg', desc: '月圆之夜的噩梦' },
    { name: '石像鬼', hp: 80, maxHp: 80, attack: 11, avatar: 'photo/monster_gargoyle.svg', desc: '守护古老遗迹的雕像' },
    { name: '亡灵骑士', hp: 75, maxHp: 75, attack: 13, avatar: 'photo/monster_deathknight.svg', desc: '堕落的骑士' }
];

// Boss配置 - 每章一个
const BOSSES = [
    // 第一章Boss
    [
        { name: '巨型史莱姆王', hp: 120, maxHp: 120, attack: 15, avatar: 'photo/boss_slimeking.svg', desc: '史莱姆的王者！', chapter: 1 },
        { name: '哥布林酋长', hp: 130, maxHp: 130, attack: 16, avatar: 'photo/boss_goblinchief.svg', desc: '哥布林部落的首领！', chapter: 1 }
    ],
    // 第二章Boss
    [
        { name: '暗影巨龙', hp: 180, maxHp: 180, attack: 20, avatar: 'photo/boss_dragon.svg', desc: '来自深渊的巨龙！', chapter: 2 },
        { name: '死灵法师', hp: 160, maxHp: 160, attack: 22, avatar: 'photo/boss_necromancer.svg', desc: '操控死亡的法师！', chapter: 2 }
    ],
    // 第三章Boss
    [
        { name: '恶魔领主', hp: 250, maxHp: 250, attack: 28, avatar: 'photo/boss_demonlord.svg', desc: '地狱的统治者！', chapter: 3 },
        { name: '混沌之神', hp: 300, maxHp: 300, attack: 30, avatar: 'photo/boss_chaosgod.svg', desc: '终极Boss！', chapter: 3 }
    ]
];

// 卡牌选项
const CARD_OPTIONS = [
    { name: '攻击', icon: '⚔️', desc: '造成10点伤害', type: 'attack', value: 10 },
    { name: '防御', icon: '🛡️', desc: '获得15点格挡', type: 'defense', value: 15 },
    { name: '治疗', icon: '💚', desc: '恢复12点生命', type: 'heal', value: 12 }
];

// 保存原始英雄数据用于重置（必须在HEROES和CARD_OPTIONS定义之后）
const ORIGINAL_HEROES = JSON.parse(JSON.stringify(HEROES));
const ORIGINAL_CARD_OPTIONS = JSON.parse(JSON.stringify(CARD_OPTIONS));

// 商店装备
const SHOP_ITEMS = [
    { id: 'sword', name: '精钢剑', icon: '⚔️', desc: '攻击+3', price: 50, effect: { type: 'attackBonus', value: 3 } },
    { id: 'shield', name: '铁盾', icon: '🛡️', desc: '格挡+5', price: 50, effect: { type: 'blockBonus', value: 5 } },
    { id: 'armor', name: '皮甲', icon: '👕', desc: '最大生命+20', price: 60, effect: { type: 'maxHpBonus', value: 20 } },
    { id: 'ring', name: '生命戒指', icon: '💍', desc: '每回合恢复3生命', price: 80, effect: { type: 'regen', value: 3 } },
    { id: 'amulet', name: '能量护符', icon: '🔮', desc: '初始能量+1', price: 100, effect: { type: 'energyBonus', value: 1 } },
    { id: 'boots', name: '迅捷靴', icon: '👢', desc: '闪避+10%', price: 70, effect: { type: 'dodge', value: 10 } }
];

// 初始化
window.onload = function() {
    document.getElementById('loginScreen').classList.remove('hidden');
};

// 登录功能
// 是否为管理员模式
let isAdminMode = false;

function login() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('请输入冒险者名称！');
        return;
    }
    
    // 检查是否为admin账号
    if (username.toLowerCase() === 'admin') {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('keyScreen').classList.remove('hidden');
        // 清空之前的密钥输入
        document.getElementById('secretKey').value = '';
        return;
    }
    
    gameState.playerName = username;
    document.getElementById('playerNameDisplay').textContent = username;
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    
    renderHeroSelection();
}

// 验证密钥
function verifyKey() {
    const key = document.getElementById('secretKey').value.trim();
    if (key === '666666') {
        isAdminMode = true;
        gameState.playerName = 'admin';
        gameState.gold = 999;
        gameState.energy = 3;
        gameState.maxEnergy = 3;
        document.getElementById('playerNameDisplay').textContent = 'admin [管理员]';
        
        document.getElementById('keyScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        
        // 应用管理员模式到所有英雄
        applyAdminModeToHeroes();
        
        renderHeroSelection();
        alert('✅ 管理员验证成功！所有数值已强化至999！能量锁定为3！');
    } else {
        alert('❌ 密钥错误！请重新输入');
        document.getElementById('secretKey').value = '';
    }
}

// 返回登录界面
function backToLogin() {
    document.getElementById('keyScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('username').value = '';
}

// 应用管理员模式到所有英雄
// 重置英雄数据为原始数值
function resetHeroesToOriginal() {
    // 深拷贝原始数据回HEROES
    const resetHeroes = JSON.parse(JSON.stringify(ORIGINAL_HEROES));
    resetHeroes.forEach((hero, index) => {
        HEROES[index].hp = hero.hp;
        HEROES[index].maxHp = hero.maxHp;
        HEROES[index].block = hero.block;
        // 删除管理员模式添加的attack属性
        if (HEROES[index].attack === 999) {
            delete HEROES[index].attack;
        }
        if (hero.skills) {
            hero.skills.forEach((skill, skillIndex) => {
                if (HEROES[index].skills[skillIndex]) {
                    HEROES[index].skills[skillIndex].value = skill.value;
                    HEROES[index].skills[skillIndex].block = skill.block;
                    HEROES[index].skills[skillIndex].heal = skill.heal;
                    HEROES[index].skills[skillIndex].buff = skill.buff;
                    HEROES[index].skills[skillIndex].debuff = skill.debuff;
                    HEROES[index].skills[skillIndex].poison = skill.poison;
                    HEROES[index].skills[skillIndex].stun = skill.stun;
                    HEROES[index].skills[skillIndex].duration = skill.duration;
                    HEROES[index].skills[skillIndex].times = skill.times;
                }
            });
        }
    });
    
    // 重置基础卡牌
    const resetCards = JSON.parse(JSON.stringify(ORIGINAL_CARD_OPTIONS));
    resetCards.forEach((card, index) => {
        CARD_OPTIONS[index].value = card.value;
    });
}

function applyAdminModeToHeroes() {
    // 只有admin账号才能应用作弊模式
    if (!isAdminMode) return;
    
    HEROES.forEach(hero => {
        hero.hp = 999;
        hero.maxHp = 999;
        hero.attack = 999;
        hero.block = 999;
        
        // 修改技能数值
        if (hero.skills) {
            hero.skills.forEach(skill => {
                if (skill.value) skill.value = 999;
                if (skill.block) skill.block = 999;
                if (skill.heal) skill.heal = 999;
                if (skill.buff) skill.buff = 999;
                if (skill.debuff) skill.debuff = 999;
                if (skill.poison) skill.poison = 999;
                if (skill.stun) skill.stun = 999;
                if (skill.duration) skill.duration = 99;
                if (skill.times) skill.times = 99;
            });
        }
    });
    
    // 修改基础卡牌数值
    CARD_OPTIONS.forEach(card => {
        card.value = 999;
    });
}

// 回车键登录和密钥验证
document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    const secretKeyInput = document.getElementById('secretKey');
    if (secretKeyInput) {
        secretKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyKey();
            }
        });
    }
    
    // 初始化下一关按钮事件
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) {
        nextLevelBtn.onclick = goToNextLevel;
    }
});

// 渲染英雄选择界面
function renderHeroSelection() {
    const grid = document.getElementById('heroesGrid');
    grid.innerHTML = '';
    
    HEROES.forEach(hero => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.onclick = () => selectHero(hero);
        card.innerHTML = `
            <div class="hero-avatar">
                <img src="${hero.avatar}" alt="${hero.name}">
            </div>
            <div class="hero-name">${hero.name}</div>
            <div class="hero-desc">${hero.desc}</div>
        `;
        grid.appendChild(card);
    });
}

// 选择英雄
async function selectHero(hero) {
    gameState.hero = { 
        ...hero, 
        nextBlock: 0,
        buff: 0,
        enemyDebuff: 0
    };
    gameState.chapter = 1;
    gameState.monsterCount = 0;
    gameState.eliteCount = 0;
    gameState.totalKills = 0;
    gameState.gameActive = true;
    gameState.energy = isAdminMode ? 3 : 2;        // 初始能量2格（管理员3格）
    gameState.gold = isAdminMode ? 999 : 0;        // 初始金币0（管理员999）
    gameState.equipment = [];    // 初始无装备
    
    document.getElementById('startScreen').classList.add('hidden');
    
    // 使用战斗图片（1.png-8.png）
    const battleImage = hero.battleImage || hero.avatar;
    document.getElementById('heroAvatar').innerHTML = `<img src="${battleImage}" alt="${hero.name}">`;
    document.getElementById('heroName').textContent = hero.name;
    
    // 显示管理员关卡跳转（如果是admin）
    const adminLevelJump = document.getElementById('adminLevelJump');
    if (isAdminMode && adminLevelJump) {
        adminLevelJump.classList.remove('hidden');
    }
    
    await startBattle();
    
    addLog(`✨ ${hero.name} 加入了冒险！`);
}

// 生成下一个敌人
function generateEnemy() {
    gameState.monsterCount++;
    gameState.totalKills++;
    
    // 每10个怪物出Boss
    if (gameState.monsterCount % 10 === 0) {
        const bosses = BOSSES[gameState.chapter - 1];
        const boss = bosses[Math.floor(Math.random() * bosses.length)];
        return { ...boss, isBoss: true };
    }
    
    // 每3个普通怪物出精英
    if (gameState.monsterCount % 3 === 0) {
        gameState.eliteCount++;
        const elite = ELITE_ENEMIES[Math.floor(Math.random() * ELITE_ENEMIES.length)];
        return { ...elite, isElite: true };
    }
    
    // 普通怪物
    const normal = NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
    return { ...normal, isNormal: true };
}

// 开始战斗
async function startBattle() {
    const enemyData = generateEnemy();
    gameState.enemy = { 
        ...enemyData, 
        poison: 0,
        poisonDuration: 0,
        stunned: 0
    };
    gameState.isPlayerTurn = true;
    gameState.cardUsed = false;
    gameState.selectedSkill = null;
    
    gameState.hero.block = 0;
    
    // 管理员模式：每回合开始能量重置为3
    if (isAdminMode) {
        gameState.energy = 3;
    }
    
    await showBattleStartAnimation();
}

// 多样化的战斗对话库
const BATTLE_DIALOGUES = {
    // 英雄狠话 - 按职业分类
    hero: {
        warrior: [
            "我的剑会粉碎你！",
            "感受战士的愤怒吧！",
            "你选错了对手！",
            "我会把你劈成两半！",
            "为了荣耀，受死吧！"
        ],
        mage: [
            "魔法将吞噬你！",
            "见识真正的力量！",
            "你只是个实验品！",
            "元素听从我的召唤！",
            "知识就是力量！"
        ],
        rogue: [
            "你的死期到了！",
            "从阴影中降临！",
            "你甚至看不到我！",
            "匕首已经饥渴了！",
            "偷走你的性命！"
        ],
        paladin: [
            "圣光审判你！",
            "邪恶必被净化！",
            "神赐予我力量！",
            "正义不可阻挡！",
            "以圣光之名！"
        ],
        ranger: [
            "我的箭无虚发！",
            "大自然会惩罚你！",
            "你逃不掉的！",
            "野兽们，上吧！",
            "百步穿杨！"
        ],
        cleric: [
            "神会惩罚你！",
            "接受神圣的制裁！",
            "你的邪恶到此为止！",
            "信仰即力量！",
            "治愈世界，消灭你！"
        ],
        druid: [
            "自然之力觉醒！",
            "熊形态，撕裂！",
            "森林在愤怒！",
            "大地母亲忽悠你！",
            "野性呼唤！"
        ],
        monk: [
            "气在我体内流动！",
            "感受拳头的力量！",
            "速度与激情！",
            "你的身体是弱点！",
            "一击必杀！"
        ],
        templar: [
            "圣殿骑士降临！",
            "神圣护盾保护我！",
            "邪恶颤抖吧！",
            "为了圣殿！",
            "光明驱散黑暗！"
        ]
    },
    // 怪物威胁 - 按类型分类
    enemy: {
        normal: [
            "我要撕碎你！",
            "你的血肉很美味！",
            "又一个送死的！",
            "我会踩扁你！",
            "成为我的晚餐吧！",
            "弱小的人类！",
            "你逃不掉的！",
            "我会捏碎你！",
            "新鲜的猎物！",
            "受死吧，入侵者！"
        ],
        elite: [
            "我是你的噩梦！",
            "精英的力量你不懂！",
            "你会跪地求饶！",
            "我比你想的更强！",
            "准备受死吧！",
            "你的末日到了！",
            "我会让你生不如死！",
            "颤抖吧，凡人！"
        ],
        boss: [
            "渺小如蝼蚁！",
            "我是不可战胜的！",
            "你的旅程到此结束！",
            "感受绝望吧！",
            "世界将属于我！",
            "你不可能赢的！",
            "跪下接受审判！",
            "我是死亡的化身！",
            "你的灵魂归我了！",
            "毁灭即将降临！"
        ]
    },
    // 战斗场景描述 - 按章节分类
    story: {
        1: [
            "阴暗的森林中，危险潜伏在每一处阴影里...",
            "古老的遗迹散发着诡异的气息，怪物从石棺中爬出...",
            "迷雾笼罩的沼泽，每一步都可能是最后一步...",
            "废弃的村庄里，只有风声和怪物的低吼...",
            "夜幕降临，黑暗中的眼睛正在注视着你..."
        ],
        2: [
            "火山口边缘，熔岩映照出敌人的狰狞面孔...",
            "冰封的洞穴深处，寒冷比怪物更致命...",
            "风暴之眼，闪电照亮了即将到来的血战...",
            "深渊的边缘，每一步都可能是万劫不复...",
            "诅咒之地，连空气都充满了死亡的味道..."
        ],
        3: [
            "魔王城堡的大门前，最后的决战即将开始...",
            "虚空裂隙中，不可名状的恐怖正在苏醒...",
            "世界之树的根部，黑暗腐蚀着一切生命...",
            "时间尽头，命运在此刻交织...",
            "神陨之地，连神明都倒下的战场..."
        ]
    }
};

// 获取英雄的战斗宣言
function getHeroDialogue(heroName) {
    // 根据英雄名字找到对应的职业类型
    const heroTypeMap = {
        '战士': 'warrior',
        '法师': 'mage',
        '盗贼': 'rogue',
        '圣骑士': 'paladin',
        '游侠': 'ranger',
        '牧师': 'cleric',
        '德鲁伊': 'druid',
        '武僧': 'monk',
        '圣殿骑士': 'templar'
    };
    
    const heroType = heroTypeMap[heroName] || 'warrior';
    const dialogues = BATTLE_DIALOGUES.hero[heroType];
    return dialogues[Math.floor(Math.random() * dialogues.length)];
}

// 获取怪物的威胁话语
function getEnemyDialogue(enemyType) {
    let type = 'normal';
    if (enemyType === 'boss') type = 'boss';
    else if (enemyType === 'elite') type = 'elite';
    
    const dialogues = BATTLE_DIALOGUES.enemy[type];
    return dialogues[Math.floor(Math.random() * dialogues.length)];
}

// 获取战斗场景描述
function getBattleStory(chapter) {
    const stories = BATTLE_DIALOGUES.story[chapter] || BATTLE_DIALOGUES.story[1];
    return stories[Math.floor(Math.random() * stories.length)];
}

// 调用 Netlify Function 生成战斗对话
async function generateAIBattleDialogues(heroName, enemyName, enemyType, chapter) {
    try {
        const response = await fetch('/.netlify/functions/ai-handler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'battleDialogue',
                heroName,
                enemyName,
                enemyType,
                chapter
            })
        });

        if (!response.ok) {
            console.error('Netlify Function 错误:', response.status);
            return null;
        }

        const data = await response.json();
        const content = data.content || '';

        // 解析 AI 返回的内容
        const heroMatch = content.match(/英雄[：:]\s*(.+)/);
        const enemyMatch = content.match(/怪物[：:]\s*(.+)/);
        const sceneMatch = content.match(/场景[：:]\s*(.+)/);

        return {
            hero: heroMatch ? heroMatch[1].trim() : null,
            enemy: enemyMatch ? enemyMatch[1].trim() : null,
            scene: sceneMatch ? sceneMatch[1].trim() : null
        };
    } catch (error) {
        console.error('AI 生成失败:', error);
        return null;
    }
}

// 调用 Netlify Function 生成随机事件
async function generateAIEvent(heroName, chapter) {
    // 获取当前游戏状态信息
    const currentHp = gameState.hero ? gameState.hero.hp : 100;
    const maxHp = gameState.hero ? gameState.hero.maxHp : 100;
    const currentGold = gameState.gold || 0;
    const currentEnergy = gameState.energy || 2;
    const maxEnergy = gameState.maxEnergy || 3;
    const enemyName = gameState.enemy ? gameState.enemy.name : '怪物';

    try {
        const response = await fetch('/.netlify/functions/ai-handler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'randomEvent',
                heroName,
                chapter,
                currentHp,
                maxHp,
                currentGold,
                currentEnergy,
                maxEnergy,
                enemyName
            })
        });

        if (!response.ok) {
            console.error('Netlify Function 错误:', response.status);
            return generateDefaultEvent();
        }

        const data = await response.json();
        const content = data.content || '';

        console.log('AI 生成的事件内容:', content);

        // 解析 AI 返回的内容
        const nameMatch = content.match(/名称[：:]\s*(.+)/);
        const descMatch = content.match(/描述[：:]\s*(.+)/);
        const option1Match = content.match(/选项1[：:]\s*(.+)/);
        const option2Match = content.match(/选项2[：:]\s*(.+)/);
        const result1Match = content.match(/结果1[：:]\s*(.+)/);
        const result2Match = content.match(/结果2[：:]\s*(.+)/);

        const event = {
            name: nameMatch ? nameMatch[1].trim() : '✨ 随机遭遇',
            desc: descMatch ? descMatch[1].trim() : '你遇到了一些特别的事情...',
            option1: option1Match ? option1Match[1].trim() : '选择前进',
            option2: option2Match ? option2Match[1].trim() : '选择回避',
            result1: result1Match ? result1Match[1].trim() : '你做出了选择...',
            result2: result2Match ? result2Match[1].trim() : '你选择了另一条路...'
        };

        // 验证解析结果，如果关键字段缺失则返回null
        if (!nameMatch || !descMatch || !option1Match || !option2Match) {
            console.warn('AI 事件解析不完整，使用默认事件');
            return generateDefaultEvent();
        }

        return event;
    } catch (error) {
        console.error('AI 事件生成失败:', error);
        return generateDefaultEvent();
    }
}

// 生成默认随机事件（AI失败时使用）- 根据游戏状态动态生成
function generateDefaultEvent() {
    const hero = gameState.hero;
    const hpPercent = hero ? (hero.hp / hero.maxHp) : 1;
    const gold = gameState.gold || 0;
    const energy = gameState.energy || 2;
    
    // 根据状态选择合适的默认事件
    let defaultEvents = [];
    
    // 低生命值事件
    if (hpPercent < 0.5) {
        defaultEvents.push({
            name: '� 治愈之泉',
            desc: `你受了重伤，生命只剩${hero ? hero.hp : 50}点。幸运的是，你发现了一眼清澈的治愈之泉。`,
            option1: '饮用泉水恢复',
            option2: '担心有毒，离开',
            result1: '泉水神奇地治愈了你的伤口。生命+30',
            result2: '你谨慎地离开了，但伤势依然严重。'
        });
        defaultEvents.push({
            name: '🏥 流浪医师',
            desc: '一位神秘的流浪医师出现在你面前，他看出了你的伤势，表示可以用草药为你治疗。',
            option1: '接受治疗（20金币）',
            option2: '拒绝治疗',
            result1: '草药起效了！金币-20，生命+25',
            result2: '你婉拒了医师，继续带伤前行。'
        });
    }
    
    // 低能量事件
    if (energy < 2) {
        defaultEvents.push({
            name: '� 能量水晶',
            desc: '你发现了一块散发着蓝色光芒的神秘水晶，似乎蕴含着强大的能量。',
            option1: '吸收水晶能量',
            option2: '小心为上，离开',
            result1: '水晶的能量流遍全身！能量恢复满',
            result2: '你决定不冒险，继续赶路。'
        });
    }
    
    // 金币多的事件
    if (gold >= 50) {
        defaultEvents.push({
            name: '� 地下赌场',
            desc: '一个神秘的陌生人邀请你参加地下赌局，声称有机会赢得大量金币。',
            option1: '下注试试运气（30金币）',
            option2: '拒绝赌博',
            result1: Math.random() < 0.5 ? '你赢了！金币+50' : '你输了！金币-30',
            result2: '你明智地避开了赌博陷阱。'
        });
    }
    
    // 通用事件
    defaultEvents.push({
        name: '💰 怪物掉落',
        desc: `你搜刮了刚刚击败的${gameState.enemy ? gameState.enemy.name : '怪物'}的尸体，发现了一些战利品。`,
        option1: '仔细搜刮',
        option2: '快速离开',
        result1: '你找到了一些金币和补给！金币+15，生命+10',
        result2: '你担心有其他怪物，迅速离开了。'
    });
    
    defaultEvents.push({
        name: '📜 古老石碑',
        desc: '路边立着一块刻有神秘符文的石碑，似乎记载着某种古老的知识。',
        option1: '研究石碑',
        option2: '不予理会',
        result1: '你领悟了战斗技巧！最大生命+5',
        result2: '你继续赶路，错过了学习机会。'
    });
    
    defaultEvents.push({
        name: '🧳 遇难商队',
        desc: '你发现了一个被袭击的商队残骸，货物散落一地，周围一片狼藉。',
        option1: '搜寻有用物资',
        option2: '小心埋伏，离开',
        result1: '你找到了一些物资，但也触发了陷阱！金币+20，生命-10',
        result2: '你安全地离开了，虽然没有收获。'
    });
    
    // 如果没有特定状态事件，使用通用事件
    if (defaultEvents.length === 0) {
        defaultEvents = [
            {
                name: '💰 发现宝箱',
                desc: '你在路边发现了一个被遗弃的古老宝箱。',
                option1: '打开宝箱',
                option2: '小心为上，离开',
                result1: '宝箱里有一些金币！金币+25',
                result2: '你安全地离开了。'
            },
            {
                name: '💧 休息营地',
                desc: '你发现了一个安全的营地，可以在这里休息恢复。',
                option1: '休息恢复',
                option2: '继续赶路',
                result1: '休息让你恢复了活力！生命+15，能量+1',
                result2: '你决定不浪费时间，继续前进。'
            }
        ];
    }
    
    return defaultEvents[Math.floor(Math.random() * defaultEvents.length)];
}

async function showBattleStartAnimation() {
    const battleStartScreen = document.getElementById('battleStartScreen');
    const heroDiv = document.getElementById('startHero');
    const enemyDiv = document.getElementById('startEnemy');
    const battleText = document.getElementById('startBattleText');
    const heroDialogue = document.getElementById('heroDialogue');
    const enemyDialogue = document.getElementById('enemyDialogue');
    const storyIntro = document.getElementById('battleStoryIntro');
    
    heroDiv.innerHTML = `<img src="${gameState.hero.battleImage}" alt="${gameState.hero.name}">`;
    enemyDiv.innerHTML = `<img src="${gameState.enemy.avatar}" alt="${gameState.enemy.name}">`;
    
    let enemyTypeText = '';
    let enemyType = 'normal';
    if (gameState.enemy.isBoss) {
        enemyTypeText = '【BOSS战】';
        enemyType = 'boss';
    } else if (gameState.enemy.isElite) {
        enemyTypeText = '【精英】';
        enemyType = 'elite';
    } else {
        enemyTypeText = '【普通】';
    }
    
    battleText.innerHTML = `第 ${gameState.chapter} 章 ${enemyTypeText}<br>第 ${gameState.monsterCount} 场战斗`;
    
    // 先显示默认对话
    heroDialogue.textContent = getHeroDialogue(gameState.hero.name);
    enemyDialogue.textContent = getEnemyDialogue(enemyType);
    storyIntro.textContent = getBattleStory(gameState.chapter);
    
    battleStartScreen.classList.remove('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    
    // 如果存在 API Key，尝试获取 AI 生成的对话
    if (gameState.apiKey) {
        try {
            const aiDialogues = await generateAIBattleDialogues(
                gameState.hero.name,
                gameState.enemy.name,
                enemyType,
                gameState.chapter
            );
            
            if (aiDialogues) {
                if (aiDialogues.hero) heroDialogue.textContent = aiDialogues.hero;
                if (aiDialogues.enemy) enemyDialogue.textContent = aiDialogues.enemy;
                if (aiDialogues.scene) storyIntro.textContent = aiDialogues.scene;
                console.log('已使用 AI 生成的对话');
            }
        } catch (error) {
            console.error('AI 对话生成失败:', error);
        }
    }
    
    // 等待3秒后进入战斗
    setTimeout(() => {
        battleStartScreen.classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        initGameUI();
    }, 3000);
}

// 初始化游戏界面
function initGameUI() {
    updateUI();
    renderCardOptions();
    renderSkillOptions();
    updateProgressBar();
    
    document.getElementById('turnInfo').textContent = '你的回合';
    // 使用SVG图片作为怪物头像
    document.getElementById('enemyAvatar').innerHTML = `<img src="${gameState.enemy.avatar}" alt="${gameState.enemy.name}">`;
    document.getElementById('enemyName').textContent = gameState.enemy.name;
    
    let intentText = '准备攻击！';
    if (gameState.enemy.isBoss) intentText = '【BOSS】毁灭打击！';
    else if (gameState.enemy.isElite) intentText = '【精英】强力攻击！';
    document.getElementById('enemyIntent').textContent = intentText;
    
    addLog(`🎯 遭遇 ${gameState.enemy.name}！`);
}

// 更新进度条
function updateProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const chapterInfo = document.getElementById('chapterInfo');
    
    if (progressFill && progressText && chapterInfo) {
        const progress = ((gameState.monsterCount % 10) / 10) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${gameState.monsterCount % 10}/10`;
        chapterInfo.textContent = `第 ${gameState.chapter} 章`;
    }
}

// 渲染卡牌选项
function renderCardOptions() {
    const container = document.getElementById('cardsRow');
    container.innerHTML = '';
    
    gameState.selectedCard = null;
    gameState.selectedCardIndex = null;
    gameState.selectedSkill = null;
    updateConfirmButton();
    
    CARD_OPTIONS.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'option-card';
        cardDiv.id = `card-${index}`;
        cardDiv.onclick = () => selectCard(card, index);
        cardDiv.innerHTML = `
            <div class="card-icon-large">${card.icon}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-desc">${card.desc}</div>
        `;
        container.appendChild(cardDiv);
    });
}

// 渲染技能选项
function renderSkillOptions() {
    const container = document.getElementById('skillsRow');
    if (!container) return;
    
    container.innerHTML = '';
    
    gameState.hero.skills.forEach((skill, index) => {
        const skillDiv = document.createElement('div');
        const hasEnoughEnergy = gameState.energy >= gameState.skillCost;
        skillDiv.className = 'skill-card' + (hasEnoughEnergy ? '' : ' disabled');
        skillDiv.id = `skill-${index}`;
        if (hasEnoughEnergy) {
            skillDiv.onclick = () => selectSkill(skill, index);
        }
        skillDiv.innerHTML = `
            <div class="skill-icon">${skill.icon}</div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-desc">${skill.desc}</div>
            <div class="skill-cost">⚡${gameState.skillCost}</div>
        `;
        container.appendChild(skillDiv);
    });
}

// 选择卡牌
function selectCard(card, index) {
    if (!gameState.isPlayerTurn || gameState.cardUsed || !gameState.gameActive) return;
    
    const cardEl = document.getElementById(`card-${index}`);
    
    if (gameState.selectedCardIndex === index) {
        gameState.selectedCard = null;
        gameState.selectedCardIndex = null;
        gameState.selectedSkill = null;
        cardEl.classList.remove('selected');
        updateConfirmButton();
        showActionPreview('');
        return;
    }
    
    clearAllSelections();
    
    gameState.selectedCard = card;
    gameState.selectedCardIndex = index;
    cardEl.classList.add('selected');
    
    let previewText = '';
    switch (card.type) {
        case 'attack':
            previewText = `⚔️ 将对敌人造成 ${card.value} 点伤害`;
            break;
        case 'defense':
            previewText = `🛡️ 将获得 ${card.value} 点格挡`;
            break;
        case 'heal':
            previewText = `💚 将恢复 ${card.value} 点生命`;
            break;
    }
    showActionPreview(previewText);
    
    updateConfirmButton();
}

// 选择技能
function selectSkill(skill, index) {
    if (!gameState.isPlayerTurn || gameState.cardUsed || !gameState.gameActive) return;
    
    // 检查能量是否足够
    if (gameState.energy < gameState.skillCost) {
        addLog(`⚡ 能量不足！需要 ${gameState.skillCost} 格能量才能使用技能`);
        return;
    }
    
    const skillEl = document.getElementById(`skill-${index}`);
    
    if (gameState.selectedSkill === skill) {
        gameState.selectedSkill = null;
        gameState.selectedCard = null;
        gameState.selectedCardIndex = null;
        skillEl.classList.remove('selected');
        updateConfirmButton();
        showActionPreview('');
        return;
    }
    
    clearAllSelections();
    
    gameState.selectedSkill = skill;
    skillEl.classList.add('selected');
    
    showActionPreview(`${skill.icon} ${skill.name} - ${skill.desc} (消耗${gameState.skillCost}⚡)`);
    
    updateConfirmButton();
}

// 清除所有选择
function clearAllSelections() {
    CARD_OPTIONS.forEach((_, i) => {
        const cardEl = document.getElementById(`card-${i}`);
        if (cardEl) cardEl.classList.remove('selected');
    });
    
    if (gameState.hero && gameState.hero.skills) {
        gameState.hero.skills.forEach((_, i) => {
            const skillEl = document.getElementById(`skill-${i}`);
            if (skillEl) skillEl.classList.remove('selected');
        });
    }
}

// 更新确认按钮状态
function updateConfirmButton() {
    const confirmBtn = document.getElementById('confirmBtn');
    const hasSelection = gameState.selectedCard !== null || gameState.selectedSkill !== null;
    confirmBtn.disabled = !hasSelection;
}

// 确认使用
function confirmAction() {
    if (gameState.selectedSkill) {
        useSkill(gameState.selectedSkill);
    } else if (gameState.selectedCard) {
        useCard(gameState.selectedCard);
    }
}

// 使用卡牌
function useCard(card) {
    if (!gameState.isPlayerTurn || gameState.cardUsed || !gameState.gameActive) return;
    
    gameState.cardUsed = true;
    
    const index = gameState.selectedCardIndex;
    const cardEl = document.getElementById(`card-${index}`);
    cardEl.classList.remove('selected');
    cardEl.classList.add('used');
    
    CARD_OPTIONS.forEach((_, i) => {
        if (i !== index) {
            const otherCardEl = document.getElementById(`card-${i}`);
            if (otherCardEl) otherCardEl.classList.add('disabled');
        }
    });
    
    if (gameState.hero.skills) {
        gameState.hero.skills.forEach((_, i) => {
            const skillEl = document.getElementById(`skill-${i}`);
            if (skillEl) skillEl.classList.add('disabled');
        });
    }
    
    updateConfirmButton();
    
    switch (card.type) {
        case 'attack':
            gameState.enemy.hp = Math.max(0, gameState.enemy.hp - card.value);
            addLog(`⚔️ 使用攻击，对 ${gameState.enemy.name} 造成 ${card.value} 点伤害！`);
            showActionPreview(`⚔️ -${card.value} HP`);
            // 使用攻击卡牌回复1格能量
            if (gameState.energy < gameState.maxEnergy) {
                gameState.energy++;
                addLog(`⚡ 攻击回复能量 +1 (${gameState.energy}/${gameState.maxEnergy})`);
            }
            break;
            
        case 'defense':
            gameState.hero.block += card.value;
            addLog(`🛡️ 使用防御，获得 ${card.value} 点格挡！`);
            showActionPreview(`🛡️ +${card.value} 格挡`);
            break;
            
        case 'heal':
            const healAmount = Math.min(card.value, gameState.hero.maxHp - gameState.hero.hp);
            gameState.hero.hp += healAmount;
            addLog(`💚 使用治疗，恢复 ${healAmount} 点生命！`);
            showActionPreview(`💚 +${healAmount} HP`);
            break;
    }
    
    updateUI();
    
    if (gameState.enemy.hp <= 0) {
        setTimeout(() => enemyDefeated(), 1000);
    } else {
        setTimeout(() => endTurn(), 1000);
    }
}

// 使用技能
function useSkill(skill) {
    if (!gameState.isPlayerTurn || gameState.cardUsed || !gameState.gameActive) return;
    
    // 检查能量是否足够
    if (gameState.energy < gameState.skillCost) {
        addLog(`⚡ 能量不足！需要 ${gameState.skillCost} 格能量，当前 ${gameState.energy} 格`);
        return;
    }
    
    // 消耗能量（管理员模式下不消耗）
    if (!isAdminMode) {
        gameState.energy -= gameState.skillCost;
        addLog(`⚡ 消耗 ${gameState.skillCost} 格能量，剩余 ${gameState.energy} 格`);
    } else {
        addLog(`⚡ 管理员模式：能量保持满值！`);
    }
    
    gameState.cardUsed = true;
    
    CARD_OPTIONS.forEach((_, i) => {
        const cardEl = document.getElementById(`card-${i}`);
        if (cardEl) cardEl.classList.add('disabled');
    });
    
    gameState.hero.skills.forEach((_, i) => {
        const skillEl = document.getElementById(`skill-${i}`);
        if (skillEl) {
            skillEl.classList.remove('selected');
            skillEl.classList.add('disabled');
        }
    });
    
    updateConfirmButton();
    
    executeSkillEffect(skill);
    
    updateUI();
    
    if (gameState.enemy.hp <= 0) {
        setTimeout(() => enemyDefeated(), 1000);
    } else {
        setTimeout(() => endTurn(), 1000);
    }
}

// 执行技能效果
function executeSkillEffect(skill) {
    const hero = gameState.hero;
    const enemy = gameState.enemy;
    
    switch (skill.type) {
        case 'attack':
            let damage = skill.value;
            if (hero.buff) damage += hero.buff;
            enemy.hp = Math.max(0, enemy.hp - damage);
            if (skill.block) hero.block += skill.block;
            addLog(`${skill.icon} 使用 ${skill.name}！造成 ${damage} 点伤害！`);
            showActionPreview(`${skill.icon} -${damage} HP`);
            break;
            
        case 'defense':
            let heal = skill.value;
            if (heal > 0) {
                heal = Math.min(heal, hero.maxHp - hero.hp);
                hero.hp += heal;
            }
            hero.block += skill.block;
            if (skill.debuff) hero.enemyDebuff = skill.debuff;
            addLog(`${skill.icon} 使用 ${skill.name}！获得 ${skill.block} 点格挡！`);
            showActionPreview(`${skill.icon} +${skill.block} 格挡`);
            // 圣骑士使用防御技能回复1格能量
            if (hero.id === 'paladin' && gameState.energy < gameState.maxEnergy) {
                gameState.energy++;
                addLog(`⚡ 圣骑士防御回复能量 +1 (${gameState.energy}/${gameState.maxEnergy})`);
            }
            break;
            
        case 'heal':
            const healAmount = Math.min(skill.value, hero.maxHp - hero.hp);
            hero.hp += healAmount;
            if (skill.block) hero.block += skill.block;
            addLog(`${skill.icon} 使用 ${skill.name}！恢复 ${healAmount} 点生命！`);
            showActionPreview(`${skill.icon} +${healAmount} HP`);
            // 牧师使用治疗技能回复1格能量
            if (hero.id === 'cleric' && gameState.energy < gameState.maxEnergy) {
                gameState.energy++;
                addLog(`⚡ 牧师治疗回复能量 +1 (${gameState.energy}/${gameState.maxEnergy})`);
            }
            break;
            
        case 'hybrid':
            let hybridDamage = skill.value;
            if (hero.buff) hybridDamage += hero.buff;
            enemy.hp = Math.max(0, enemy.hp - hybridDamage);
            const hybridHeal = Math.min(skill.heal || 0, hero.maxHp - hero.hp);
            if (hybridHeal > 0) hero.hp += hybridHeal;
            if (skill.block) hero.block += skill.block;
            addLog(`${skill.icon} 使用 ${skill.name}！造成 ${hybridDamage} 伤害，恢复 ${hybridHeal} 生命！`);
            showActionPreview(`${skill.icon} 攻击+恢复！`);
            break;
            
        case 'multi':
            let totalDamage = 0;
            for (let i = 0; i < skill.times; i++) {
                let hitDamage = skill.value;
                if (hero.buff) hitDamage += hero.buff;
                enemy.hp = Math.max(0, enemy.hp - hitDamage);
                totalDamage += hitDamage;
            }
            addLog(`${skill.icon} 使用 ${skill.name}！连续 ${skill.times} 次攻击，造成 ${totalDamage} 点伤害！`);
            showActionPreview(`${skill.icon} ${skill.times}连击 -${totalDamage} HP`);
            break;
            
        case 'poison':
            let poisonDamage = skill.value;
            if (hero.buff) poisonDamage += hero.buff;
            enemy.hp = Math.max(0, enemy.hp - poisonDamage);
            enemy.poison = skill.poison;
            enemy.poisonDuration = skill.duration;
            addLog(`${skill.icon} 使用 ${skill.name}！造成 ${poisonDamage} 伤害，敌人中毒！`);
            showActionPreview(`${skill.icon} 中毒！`);
            break;
            
        case 'stun':
            let stunDamage = skill.value;
            if (hero.buff) stunDamage += hero.buff;
            enemy.hp = Math.max(0, enemy.hp - stunDamage);
            enemy.stunned = skill.stun;
            addLog(`${skill.icon} 使用 ${skill.name}！造成 ${stunDamage} 伤害，敌人眩晕！`);
            showActionPreview(`${skill.icon} 眩晕！`);
            break;
            
        case 'drain':
            let drainDamage = skill.value;
            if (hero.buff) drainDamage += hero.buff;
            enemy.hp = Math.max(0, enemy.hp - drainDamage);
            const drainHeal = Math.min(drainDamage, hero.maxHp - hero.hp);
            hero.hp += drainHeal;
            addLog(`${skill.icon} 使用 ${skill.name}！造成 ${drainDamage} 伤害，吸收 ${drainHeal} 生命！`);
            showActionPreview(`${skill.icon} 生命吸收！`);
            break;
            
        case 'buff':
            hero.block += skill.block;
            hero.buff = skill.buff;
            addLog(`${skill.icon} 使用 ${skill.name}！获得 ${skill.block} 格挡，下回合攻击+${skill.buff}！`);
            showActionPreview(`${skill.icon} 攻击提升！`);
            break;
    }
}

// 显示行动预览
function showActionPreview(text) {
    const preview = document.getElementById('actionPreview');
    preview.textContent = text;
}

// 结束回合
function endTurn() {
    if (!gameState.isPlayerTurn || !gameState.gameActive) return;
    
    gameState.isPlayerTurn = false;
    document.getElementById('turnInfo').textContent = '敌人回合';
    
    CARD_OPTIONS.forEach((_, i) => {
        const cardEl = document.getElementById(`card-${i}`);
        if (cardEl) cardEl.classList.add('disabled');
    });
    
    if (gameState.hero.skills) {
        gameState.hero.skills.forEach((_, i) => {
            const skillEl = document.getElementById(`skill-${i}`);
            if (skillEl) skillEl.classList.add('disabled');
        });
    }
    
    addLog(`⏭️ ${gameState.hero.name} 结束回合`);
    
    setTimeout(() => enemyAttack(), 1000);
}

// 逃跑功能
function fleeBattle() {
    if (!gameState.isPlayerTurn || !gameState.gameActive) return;
    
    // 确认是否逃跑
    if (!confirm('确定要逃跑吗？逃跑将视为战斗失败！')) {
        return;
    }
    
    gameState.gameActive = false;
    addLog('🏃 ' + gameState.hero.name + ' 选择了逃跑！');
    
    // 显示战斗失败结算
    setTimeout(() => showFleeResult(), 500);
}

// 显示逃跑失败结算
function showFleeResult() {
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const title = document.getElementById('levelCompleteTitle');
    const stats = document.getElementById('levelCompleteStats');
    const rewards = document.getElementById('levelRewards');
    const nextBtn = document.getElementById('nextLevelBtn');
    
    title.textContent = '💀 战斗失败';
    title.style.color = '#ff4444';
    
    stats.innerHTML = `
        <div class="stat-item">😢 ${gameState.hero.name} 逃跑了</div>
        <div class="stat-item">📊 当前章节: 第 ${gameState.chapter} 章</div>
        <div class="stat-item">👹 敌人: ${gameState.enemy.name}</div>
        <div class="stat-item">❤️ 剩余生命: ${gameState.hero.hp}/${gameState.hero.maxHp}</div>
    `;
    
    rewards.innerHTML = `
        <h3>💀 逃跑惩罚</h3>
        <div class="reward-item" style="color: #ff4444;">❌ 失去 20 金币</div>
        <div class="reward-item" style="color: #ff4444;">❌ 失去 10 生命</div>
    `;
    
    // 应用惩罚
    gameState.gold = Math.max(0, gameState.gold - 20);
    gameState.hero.hp = Math.max(1, gameState.hero.hp - 10);
    
    nextBtn.textContent = '🏠 返回主界面';
    nextBtn.onclick = function() {
        returnToMainMenu();
    };
    
    document.getElementById('gameScreen').classList.add('hidden');
    levelCompleteScreen.classList.remove('hidden');
}

// 返回主菜单
function returnToMainMenu() {
    // 重置英雄数据为原始数值（如果是admin账号）
    if (isAdminMode) {
        resetHeroesToOriginal();
    }
    
    // 重置游戏状态但保留玩家名称和API Key
    const playerName = gameState.playerName;
    const apiKey = gameState.apiKey;
    gameState = {
        playerName: playerName,
        apiKey: apiKey,
        hero: null,
        enemy: null,
        chapter: 1,
        monsterCount: 0,
        eliteCount: 0,
        isPlayerTurn: true,
        cardUsed: false,
        selectedCard: null,
        selectedCardIndex: null,
        selectedSkill: null,
        gameActive: false,
        gold: 0,
        equipment: [],
        energy: 2,
        maxEnergy: 3,
        skillCost: 3,
        totalKills: 0
    };
    
    // 重置管理员模式
    isAdminMode = false;
    
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // 显示开始界面
    document.getElementById('startScreen').classList.remove('hidden');
    
    // 重置按钮事件
    document.getElementById('nextLevelBtn').onclick = goToNextLevel;
    document.getElementById('nextLevelBtn').textContent = '⚔️ 继续战斗';
    document.getElementById('levelCompleteTitle').style.color = '';
}

// 敌人攻击
function enemyAttack() {
    if (!gameState.gameActive) return;
    
    const enemy = gameState.enemy;
    const hero = gameState.hero;
    
    // 检查眩晕
    if (enemy.stunned > 0) {
        enemy.stunned--;
        addLog(`💫 ${enemy.name} 处于眩晕状态，无法攻击！`);
        setTimeout(() => startNewTurn(), 1000);
        return;
    }
    
    // 计算伤害
    let attackDamage = enemy.attack;
    if (hero.enemyDebuff) attackDamage -= hero.enemyDebuff;
    attackDamage = Math.max(1, attackDamage);
    
    const blocked = Math.min(hero.block, attackDamage);
    const damage = attackDamage - blocked;
    
    hero.block -= blocked;
    hero.enemyDebuff = 0;
    
    if (damage > 0) {
        hero.hp = Math.max(0, hero.hp - damage);
        addLog(`💥 ${enemy.name} 攻击造成 ${damage} 点伤害！(格挡 ${blocked} 点)`);
    } else {
        addLog(`🛡️ 完全格挡了 ${enemy.name} 的攻击！`);
    }
    
    // 中毒效果
    if (enemy.poison > 0 && enemy.poisonDuration > 0) {
        enemy.hp = Math.max(0, enemy.hp - enemy.poison);
        enemy.poisonDuration--;
        addLog(`🐍 中毒效果造成 ${enemy.poison} 点伤害！(${enemy.poisonDuration}回合剩余)`);
        
        if (enemy.hp <= 0) {
            updateUI();
            setTimeout(() => enemyDefeated(), 1000);
            return;
        }
    }
    
    updateUI();
    
    if (hero.hp <= 0) {
        setTimeout(() => gameOver(false), 1000);
        return;
    }
    
    setTimeout(() => startNewTurn(), 1500);
}

// 开始新回合
function startNewTurn() {
    if (!gameState.gameActive) return;
    
    gameState.isPlayerTurn = true;
    gameState.cardUsed = false;
    gameState.selectedCard = null;
    gameState.selectedCardIndex = null;
    gameState.selectedSkill = null;
    
    gameState.hero.block = 0;
    gameState.hero.buff = 0;
    
    // 应用装备效果 - 生命恢复
    if (gameState.hero.regen && gameState.hero.regen > 0) {
        const regenAmount = Math.min(gameState.hero.regen, gameState.hero.maxHp - gameState.hero.hp);
        if (regenAmount > 0) {
            gameState.hero.hp += regenAmount;
            addLog(`💚 生命戒指恢复 ${regenAmount} 点生命！`);
        }
    }
    
    if (gameState.hero.nextBlock) {
        gameState.hero.block += gameState.hero.nextBlock;
        addLog(`💨 获得 ${gameState.hero.nextBlock} 点额外格挡！`);
        gameState.hero.nextBlock = 0;
    }
    
    document.getElementById('turnInfo').textContent = '你的回合';
    
    CARD_OPTIONS.forEach((_, i) => {
        const cardEl = document.getElementById(`card-${i}`);
        if (cardEl) cardEl.classList.remove('disabled', 'used', 'selected');
    });
    
    if (gameState.hero.skills) {
        gameState.hero.skills.forEach((_, i) => {
            const skillEl = document.getElementById(`skill-${i}`);
            if (skillEl) skillEl.classList.remove('disabled', 'selected');
        });
    }
    
    updateConfirmButton();
    showActionPreview('');
    
    // 重新渲染技能选项以更新能量状态
    renderSkillOptions();
    
    addLog(`🔄 新回合开始！能量: ${gameState.energy}/${gameState.maxEnergy}`);
    updateUI();
}

// 敌人被击败
function enemyDefeated() {
    addLog(`🎉 ${gameState.enemy.name} 被击败了！`);
    
    // 获得金币奖励
    let goldReward = 10;
    if (gameState.enemy.isElite) goldReward = 30;
    if (gameState.enemy.isBoss) goldReward = 100;
    gameState.gold += goldReward;
    addLog(`💰 获得 ${goldReward} 金币！`);
    
    // 检查是否是Boss
    if (gameState.enemy.isBoss) {
        if (gameState.chapter >= 3) {
            // 最终胜利
            setTimeout(() => showFinalVictory(), 1000);
            return;
        } else {
            // 章节完成
            setTimeout(() => showChapterComplete(), 800);
            return;
        }
    }
    
    // 普通怪物：1/5概率触发随机事件，否则直接显示结算界面
    if (gameState.enemy.isElite) {
        // 精英怪必定触发随机事件
        setTimeout(() => showLevelComplete(), 800);
    } else {
        // 普通怪物：1/5概率触发随机事件
        const roll = Math.random();
        if (roll < 0.2) {
            console.log('普通怪物后触发随机事件');
            setTimeout(() => showLevelComplete(), 800);
        } else {
            console.log('普通怪物后无事件，直接显示结算');
            setTimeout(() => showLevelComplete(), 800);
        }
    }
}

// 当前AI生成的事件
let currentEvent = null;

// 显示加载界面
function showLoadingScreen(text = '加载中...') {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
    loadingScreen.classList.remove('hidden');
}

// 隐藏加载界面
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
}

// 显示 AI 生成的事件
function showAIEvent(event) {
    const eventScreen = document.getElementById('eventScreen');
    const eventContainer = document.getElementById('eventContainer');
    const eventTypeBadge = document.getElementById('eventTypeBadge');
    const eventTitle = document.getElementById('eventTitle');
    const eventIcon = document.getElementById('eventIcon');
    const eventDesc = document.getElementById('eventDesc');
    const choiceText1 = document.getElementById('choiceText1');
    const choiceText2 = document.getElementById('choiceText2');
    const eventChoices = document.getElementById('eventChoices');
    const eventResult = document.getElementById('eventResult');
    
    // 设置事件类型样式 - 统一使用随机遭遇样式
    eventTypeBadge.textContent = '🎲 随机事件';
    eventTypeBadge.className = 'event-type-badge minor';
    eventContainer.classList.remove('major-event');
    
    // 解析事件名称，提取 emoji
    const nameMatch = event.name.match(/^(\p{Emoji}+)\s*(.+)$/u);
    if (nameMatch) {
        eventIcon.textContent = nameMatch[1];
        eventTitle.textContent = nameMatch[2];
    } else {
        eventIcon.textContent = '✨';
        eventTitle.textContent = event.name;
    }
    
    eventDesc.textContent = event.desc;
    choiceText1.textContent = event.option1;
    choiceText2.textContent = event.option2;
    
    // 显示选择区域，隐藏结果区域
    eventChoices.classList.remove('hidden');
    eventResult.classList.add('hidden');
    
    eventScreen.classList.remove('hidden');
}

// 处理 AI 事件选择
async function handleAIEventChoice(choice) {
    if (!currentEvent) return;
    
    // 获取选择的选项和结果
    const selectedOption = choice === 1 ? currentEvent.option1 : currentEvent.option2;
    const selectedResult = choice === 1 ? currentEvent.result1 : currentEvent.result2;
    
    // 显示加载界面
    document.getElementById('eventScreen').classList.add('hidden');
    showLoadingScreen('正在处理你的选择...');
    
    // 调用AI根据完整事件文本决定属性变化
    const effectDescription = await generateEventEffect(
        currentEvent.name,
        currentEvent.desc,
        selectedOption,
        selectedResult,
        gameState.hero.name,
        gameState.hero.hp,
        gameState.hero.maxHp,
        gameState.gold,
        gameState.energy,
        gameState.maxEnergy
    );
    
    // 隐藏加载界面
    hideLoadingScreen();
    
    // 解析并应用数值变化
    const effects = parseEventEffects(effectDescription);
    applyEventEffects(effects);
    updateUI();
    
    // 显示游戏内结果窗口
    showEventResultWindow(effectDescription, effects);
}

// 调用AI根据事件文本生成属性变化
async function generateEventEffect(eventName, eventDesc, option, result, heroName, currentHp, maxHp, gold, energy, maxEnergy) {
    if (!gameState.apiKey) {
        // 如果没有API Key，直接返回原始结果
        return result;
    }
    
    try {
        const prompt = `你是一个DND游戏主持人。根据以下随机事件的完整信息，为英雄"${heroName}"决定具体的属性变化。

当前英雄状态：
- 生命：${currentHp}/${maxHp}
- 金币：${gold}
- 能量：${energy}/${maxEnergy}

事件信息：
- 事件名称：${eventName}
- 事件描述：${eventDesc}
- 玩家选择：${option}
- 初步结果：${result}

请根据事件的上下文和逻辑，生成一个完整的结果描述，包含具体的数值变化。

要求：
1. 结果描述要有叙事性，符合DND风格
2. 必须明确写出数值变化，格式如：生命+15、生命-10、金币+30、金币-20、能量+1、最大生命+5
3. 奖励和惩罚要合理，与事件描述相符
4. 如果英雄生命低，适当给予治疗机会；如果金币多，可以设置花费
5. 描述在50-80字之间

请直接输出结果描述，不需要其他格式。`;

        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('API 请求失败');
        }

        const data = await response.json();
        const effectText = data.choices?.[0]?.message?.content?.trim() || '';
        
        console.log('AI生成的效果描述:', effectText);
        
        // 如果AI返回的内容有效，使用它；否则使用原始结果
        if (effectText && effectText.length > 10) {
            return effectText;
        } else {
            return result;
        }
    } catch (error) {
        console.error('AI生成事件效果失败:', error);
        return result;
    }
}

// 解析事件效果（返回效果对象数组）
function parseEventEffects(result) {
    const effects = [];
    
    // 解析生命值变化
    const hpPositiveMatch = result.match(/生命\s*[+＋]\s*(\d+)|恢复\s*(\d+)\s*生命|获得\s*(\d+)\s*生命/i);
    const hpNegativeMatch = result.match(/生命\s*[-－]\s*(\d+)|失去\s*(\d+)\s*生命|受到\s*(\d+)\s*伤害|伤害\s*(\d+)/i);
    
    if (hpPositiveMatch) {
        const value = parseInt(hpPositiveMatch[1] || hpPositiveMatch[2] || hpPositiveMatch[3]);
        effects.push({ type: 'hp', value: value, label: '生命' });
    } else if (hpNegativeMatch) {
        const value = -parseInt(hpNegativeMatch[1] || hpNegativeMatch[2] || hpNegativeMatch[3] || hpNegativeMatch[4]);
        effects.push({ type: 'hp', value: value, label: '生命' });
    }
    
    // 解析最大生命值变化
    const maxHpMatch = result.match(/最大生命\s*[+＋]\s*(\d+)/i);
    if (maxHpMatch) {
        const value = parseInt(maxHpMatch[1]);
        effects.push({ type: 'maxHp', value: value, label: '最大生命' });
    }
    
    // 解析金币变化
    const goldPositiveMatch = result.match(/金币\s*[+＋]\s*(\d+)|获得\s*(\d+)\s*金币|得到\s*(\d+)\s*金币/i);
    const goldNegativeMatch = result.match(/金币\s*[-－]\s*(\d+)|失去\s*(\d+)\s*金币|花费\s*(\d+)\s*金币|消耗\s*(\d+)\s*金币/i);
    
    if (goldPositiveMatch) {
        const value = parseInt(goldPositiveMatch[1] || goldPositiveMatch[2] || goldPositiveMatch[3]);
        effects.push({ type: 'gold', value: value, label: '金币' });
    } else if (goldNegativeMatch) {
        const value = -parseInt(goldNegativeMatch[1] || goldNegativeMatch[2] || goldNegativeMatch[3] || goldNegativeMatch[4]);
        effects.push({ type: 'gold', value: value, label: '金币' });
    }
    
    // 解析能量变化
    const energyPositiveMatch = result.match(/能量\s*[+＋]\s*(\d+)|恢复\s*(\d+)\s*能量/i);
    const energyFullMatch = result.match(/能量恢复满|能量全满|回满能量/i);
    
    if (energyFullMatch) {
        effects.push({ type: 'energyFull', value: 0, label: '能量回满' });
    } else if (energyPositiveMatch) {
        const value = parseInt(energyPositiveMatch[1] || energyPositiveMatch[2]);
        effects.push({ type: 'energy', value: value, label: '能量' });
    }
    
    // 解析最大能量变化
    const maxEnergyMatch = result.match(/最大能量\s*[+＋]\s*(\d+)/i);
    if (maxEnergyMatch) {
        const value = parseInt(maxEnergyMatch[1]);
        effects.push({ type: 'maxEnergy', value: value, label: '最大能量' });
    }
    
    return effects;
}

// 应用事件效果
function applyEventEffects(effects) {
    effects.forEach(effect => {
        switch (effect.type) {
            case 'hp':
                if (effect.value > 0) {
                    gameState.hero.hp = Math.min(gameState.hero.maxHp, gameState.hero.hp + effect.value);
                } else {
                    gameState.hero.hp = Math.max(1, gameState.hero.hp + effect.value);
                }
                break;
            case 'maxHp':
                gameState.hero.maxHp += effect.value;
                gameState.hero.hp += effect.value;
                break;
            case 'gold':
                if (effect.value > 0) {
                    gameState.gold += effect.value;
                } else {
                    gameState.gold = Math.max(0, gameState.gold + effect.value);
                }
                break;
            case 'energy':
                gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + effect.value);
                break;
            case 'energyFull':
                gameState.energy = gameState.maxEnergy;
                break;
            case 'maxEnergy':
                gameState.maxEnergy += effect.value;
                gameState.energy += effect.value;
                break;
        }
    });
    updateUI();
}

// 显示事件结果窗口
function showEventResultWindow(description, effects) {
    const resultScreen = document.getElementById('eventResultScreen');
    const resultText = document.getElementById('eventResultText');
    const resultEffects = document.getElementById('eventResultEffects');
    
    // 显示结果描述
    resultText.textContent = description;
    
    // 格式化效果显示
    if (effects.length > 0) {
        const effectsText = effects.map(e => {
            if (e.type === 'energyFull') {
                return '⚡ 能量已回满';
            }
            const sign = e.value > 0 ? '+' : '';
            let icon = '';
            switch (e.type) {
                case 'hp': icon = '❤️'; break;
                case 'maxHp': icon = '💪'; break;
                case 'gold': icon = '💰'; break;
                case 'energy': icon = '⚡'; break;
                case 'maxEnergy': icon = '🔋'; break;
            }
            return `${icon} ${e.label}: ${sign}${e.value}`;
        }).join(' | ');
        resultEffects.textContent = effectsText;
        resultEffects.classList.remove('hidden');
    } else {
        resultEffects.classList.add('hidden');
    }
    
    // 显示结果窗口
    resultScreen.classList.remove('hidden');
}

// 关闭事件结果窗口并继续
function closeEventResultAndContinue() {
    document.getElementById('eventResultScreen').classList.add('hidden');
    startBattle();
}

// 应用事件结果（兼容旧代码）
function applyEventResult(result) {
    console.log('应用事件结果:', result);
    const effects = parseEventEffects(result);
    applyEventEffects(effects);
}

// 关闭 AI 事件并继续
function closeAIEvent() {
    document.getElementById('eventScreen').classList.add('hidden');
    startBattle();
}

// 当前商店显示的装备
let currentShopItems = [];

// 显示商店（普通商店，用于随机事件）
function showShop() {
    const shopScreen = document.getElementById('shopScreen');
    const shopGold = document.getElementById('shopGold');
    const shopItems = document.getElementById('shopItems');
    
    shopGold.textContent = gameState.gold;
    shopItems.innerHTML = '';
    
    // 获取可用装备（未拥有的）
    const availableItems = SHOP_ITEMS.filter(item => !gameState.equipment.includes(item.id));
    
    // 如果currentShopItems为空或所有装备都已购买，重新生成
    if (currentShopItems.length === 0 || currentShopItems.every(item => gameState.equipment.includes(item.id))) {
        currentShopItems = availableItems.sort(() => 0.5 - Math.random()).slice(0, 3);
    }
    
    // 渲染商店物品
    renderShopItems();
    
    document.getElementById('gameScreen').classList.add('hidden');
    shopScreen.classList.remove('hidden');
}

// 渲染商店物品
function renderShopItems() {
    const shopItems = document.getElementById('shopItems');
    const shopGold = document.getElementById('shopGold');
    
    shopGold.textContent = gameState.gold;
    shopItems.innerHTML = '';
    
    // 获取可用装备（未拥有的）
    const availableItems = SHOP_ITEMS.filter(item => !gameState.equipment.includes(item.id));
    
    // 检查并补充商店物品
    for (let i = 0; i < 3; i++) {
        // 如果当前位置为空或已购买，从可用装备中补充
        if (!currentShopItems[i] || gameState.equipment.includes(currentShopItems[i].id)) {
            // 找一个未在currentShopItems中的可用装备
            const newItem = availableItems.find(item => 
                !currentShopItems.some((si, idx) => idx !== i && si && si.id === item.id) &&
                !gameState.equipment.includes(item.id)
            );
            if (newItem) {
                currentShopItems[i] = newItem;
            }
        }
    }
    
    // 渲染3个装备位置
    for (let i = 0; i < 3; i++) {
        const item = currentShopItems[i];
        const itemDiv = document.createElement('div');
        
        if (item && !gameState.equipment.includes(item.id)) {
            const canAfford = gameState.gold >= item.price;
            itemDiv.className = 'shop-item' + (canAfford ? '' : ' expensive');
            itemDiv.onclick = () => buyItem(item, i);
            itemDiv.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.desc}</div>
                <div class="shop-item-price ${canAfford ? 'affordable' : 'expensive'}">💰 ${item.price}</div>
            `;
        } else {
            // 空位置或已购买，显示为已售罄
            itemDiv.className = 'shop-item purchased';
            itemDiv.innerHTML = `
                <div class="shop-item-icon">❌</div>
                <div class="shop-item-name">已售罄</div>
                <div class="shop-item-desc">-</div>
                <div class="shop-item-price">-</div>
            `;
        }
        shopItems.appendChild(itemDiv);
    }
}

// 购买装备
function buyItem(item, slotIndex) {
    if (gameState.gold < item.price) {
        addLog(`💰 金币不足！需要 ${item.price} 金币`);
        return;
    }
    
    if (gameState.equipment.includes(item.id)) {
        addLog(`⚠️ 已拥有 ${item.name}！`);
        return;
    }
    
    gameState.gold -= item.price;
    gameState.equipment.push(item.id);
    
    // 应用装备效果
    applyEquipmentEffect(item);
    
    addLog(`🛒 购买成功！获得 ${item.name}`);
    
    // 立即补充新装备到该位置
    const availableItems = SHOP_ITEMS.filter(it => 
        !gameState.equipment.includes(it.id) && 
        !currentShopItems.some((si, idx) => idx !== slotIndex && si && si.id === it.id)
    );
    
    if (availableItems.length > 0) {
        // 随机选择一个新装备补充
        const newItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        currentShopItems[slotIndex] = newItem;
        addLog(`🆕 新装备 ${newItem.name} 已上架！`);
    } else {
        // 没有更多装备了
        currentShopItems[slotIndex] = null;
    }
    
    // 刷新商店显示
    renderShopItems();
}

// 应用装备效果
function applyEquipmentEffect(item) {
    const hero = gameState.hero;
    switch (item.effect.type) {
        case 'attackBonus':
            hero.attackBonus = (hero.attackBonus || 0) + item.effect.value;
            break;
        case 'blockBonus':
            hero.blockBonus = (hero.blockBonus || 0) + item.effect.value;
            break;
        case 'maxHpBonus':
            hero.maxHp += item.effect.value;
            hero.hp += item.effect.value;
            break;
        case 'energyBonus':
            gameState.maxEnergy += item.effect.value;
            break;
        case 'regen':
            hero.regen = (hero.regen || 0) + item.effect.value;
            break;
        case 'dodge':
            hero.dodge = (hero.dodge || 0) + item.effect.value;
            break;
    }
}

// 关闭商店
function closeShop() {
    document.getElementById('shopScreen').classList.add('hidden');
    // 重置商店物品，下次进入时重新生成
    currentShopItems = [];
    showLevelComplete();
}

// 显示关卡结算界面
function showLevelComplete() {
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const statsDiv = document.getElementById('levelCompleteStats');
    const nextBtn = document.getElementById('nextLevelBtn');
    
    // 安全检查：确保有敌人数据
    if (!gameState.enemy) {
        console.error('showLevelComplete: gameState.enemy is null');
        return;
    }
    
    const healAmount = Math.min(15, gameState.hero.maxHp - gameState.hero.hp);
    const oldHp = gameState.hero.hp;
    gameState.hero.hp += healAmount;
    
    let enemyType = '';
    if (gameState.enemy.isElite) enemyType = '【精英】';
    else enemyType = '【普通】';
    
    statsDiv.innerHTML = `
        <div>🎯 击败: ${enemyType} ${gameState.enemy.name}</div>
        <div>❤️ 生命: ${oldHp} → ${gameState.hero.hp} (+${healAmount})</div>
        <div>💰 金币: ${gameState.gold}</div>
        <div>📊 第 ${gameState.chapter} 章 - 第 ${gameState.monsterCount} 场战斗</div>
        <div>🏆 总击杀: ${gameState.totalKills}</div>
    `;
    
    const nextEnemyType = (gameState.monsterCount + 1) % 10 === 0 ? '【BOSS】' : 
                          (gameState.monsterCount + 1) % 3 === 0 ? '【精英】' : '【普通】';
    nextBtn.textContent = `⚔️ 继续 (${nextEnemyType})`;
    
    document.getElementById('gameScreen').classList.add('hidden');
    levelCompleteScreen.classList.remove('hidden');
}

// 显示章节完成界面
function showChapterComplete() {
    const chapterCompleteScreen = document.getElementById('chapterCompleteScreen');
    const statsDiv = document.getElementById('chapterCompleteStats');
    
    // 大量恢复
    const healAmount = Math.min(50, gameState.hero.maxHp - gameState.hero.hp);
    const oldHp = gameState.hero.hp;
    gameState.hero.hp += healAmount;
    
    statsDiv.innerHTML = `
        <div>🎉 第 ${gameState.chapter} 章完成！</div>
        <div>👑 击败Boss: ${gameState.enemy.name}</div>
        <div>❤️ 生命: ${oldHp} → ${gameState.hero.hp} (+${healAmount})</div>
        <div>📊 本章击杀: ${gameState.monsterCount} 个怪物</div>
        <div>🏆 总击杀: ${gameState.totalKills}</div>
    `;
    
    document.getElementById('gameScreen').classList.add('hidden');
    chapterCompleteScreen.classList.remove('hidden');
}

// 进入下一章
function goToNextChapter() {
    document.getElementById('chapterCompleteScreen').classList.add('hidden');
    document.getElementById('shopScreen').classList.add('hidden');
    
    gameState.chapter++;
    gameState.monsterCount = 0;
    
    startBattle();
}

// 管理员关卡跳转
function jumpToLevel() {
    if (!isAdminMode) {
        alert('只有管理员可以使用此功能！');
        return;
    }
    
    const input = document.getElementById('levelJumpInput').value.trim();
    const match = input.match(/^(\d+)-(\d+)$/);
    
    if (!match) {
        alert('格式错误！请输入 "章-关" 格式，如：3-5');
        return;
    }
    
    const chapter = parseInt(match[1]);
    const level = parseInt(match[2]);
    
    // 验证范围 - 只允许 1-1~1-10, 2-1~2-10, 3-1~3-10
    const validChapters = [1, 2, 3];
    const validLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    if (!validChapters.includes(chapter) || !validLevels.includes(level)) {
        alert('输入有误！只能跳转到以下关卡：\n1-1 ~ 1-10\n2-1 ~ 2-10\n3-1 ~ 3-10');
        return;
    }
    
    // 设置章节和关卡
    gameState.chapter = chapter;
    gameState.monsterCount = level - 1; // monsterCount是已击败数，所以减1
    
    // 关闭可能打开的弹窗
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    document.getElementById('chapterCompleteScreen').classList.add('hidden');
    document.getElementById('shopScreen').classList.add('hidden');
    document.getElementById('eventScreen').classList.add('hidden');
    document.getElementById('eventResultScreen').classList.add('hidden');
    
    // 清空输入
    document.getElementById('levelJumpInput').value = '';
    
    // 开始战斗
    startBattle();
    
    addLog(`🔧 管理员跳转至第 ${chapter} 章第 ${level} 关`);
}

// 显示章节商店（Boss战后）
function showChapterShop() {
    const shopScreen = document.getElementById('shopScreen');
    const shopGold = document.getElementById('shopGold');
    const shopItems = document.getElementById('shopItems');
    
    // 隐藏章节完成界面，显示商店
    document.getElementById('chapterCompleteScreen').classList.add('hidden');
    
    shopGold.textContent = gameState.gold;
    shopItems.innerHTML = '';
    
    // 根据玩家金币数量动态定价
    // 确保至少能买一件装备（最便宜的装备价格为玩家金币的60-80%）
    const playerGold = gameState.gold;
    const minPrice = Math.max(10, Math.floor(playerGold * 0.3));  // 最低价格
    const maxPrice = Math.max(minPrice + 20, Math.floor(playerGold * 0.9)); // 最高价格
    
    // 获取可用装备（未拥有的）
    const availableItems = SHOP_ITEMS.filter(item => !gameState.equipment.includes(item.id));
    
    // 生成3个装备，价格基于玩家金币动态调整
    currentShopItems = [];
    
    // 确保有一个便宜的装备（玩家能买得起）
    if (availableItems.length > 0) {
        const cheapItem = { ...availableItems[0] };
        cheapItem.price = Math.max(10, Math.floor(playerGold * 0.5)); // 50%金币价格
        currentShopItems.push(cheapItem);
        
        // 其他装备随机价格
        for (let i = 1; i < Math.min(3, availableItems.length); i++) {
            const item = { ...availableItems[i] };
            // 随机价格在玩家金币的40%-90%之间
            const priceRatio = 0.4 + Math.random() * 0.5;
            item.price = Math.max(15, Math.floor(playerGold * priceRatio));
            currentShopItems.push(item);
        }
    }
    
    // 渲染商店物品
    renderChapterShopItems();
    
    shopScreen.classList.remove('hidden');
}

// 渲染章节商店物品
function renderChapterShopItems() {
    const shopItems = document.getElementById('shopItems');
    const shopGold = document.getElementById('shopGold');
    
    shopGold.textContent = gameState.gold;
    shopItems.innerHTML = '';
    
    // 渲染3个装备位置
    for (let i = 0; i < 3; i++) {
        const item = currentShopItems[i];
        const itemDiv = document.createElement('div');
        
        if (item && !gameState.equipment.includes(item.id)) {
            const canAfford = gameState.gold >= item.price;
            itemDiv.className = 'shop-item' + (canAfford ? '' : ' expensive');
            itemDiv.onclick = () => buyChapterItem(item, i);
            itemDiv.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.desc}</div>
                <div class="shop-item-price ${canAfford ? 'affordable' : 'expensive'}">💰 ${item.price}</div>
            `;
        } else {
            // 空位置或已购买，显示为已售罄
            itemDiv.className = 'shop-item purchased';
            itemDiv.innerHTML = `
                <div class="shop-item-icon">❌</div>
                <div class="shop-item-name">已售罄</div>
                <div class="shop-item-desc">-</div>
                <div class="shop-item-price">-</div>
            `;
        }
        shopItems.appendChild(itemDiv);
    }
}

// 购买章节商店装备
function buyChapterItem(item, slotIndex) {
    if (gameState.gold < item.price) {
        addLog(`💰 金币不足！需要 ${item.price} 金币`);
        return;
    }
    
    if (gameState.equipment.includes(item.id)) {
        addLog(`⚠️ 已拥有 ${item.name}！`);
        return;
    }
    
    gameState.gold -= item.price;
    gameState.equipment.push(item.id);
    
    // 应用装备效果
    applyEquipmentEffect(item);
    
    addLog(`🛒 购买成功！获得 ${item.name}`);
    
    // 标记该位置为已购买
    currentShopItems[slotIndex] = null;
    
    // 重新渲染商店
    renderChapterShopItems();
    updateUI();
    
    // 玩家可以继续购买其他装备，或点击下一章按钮离开
}

// 进入下一关
async function goToNextLevel() {
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    
    // 判断是否应该触发随机事件
    // 精英怪必定触发，普通怪物1/5概率触发
    let shouldTriggerEvent = false;
    
    if (gameState.enemy && gameState.enemy.isElite) {
        shouldTriggerEvent = true;
        console.log('精英怪后必定触发随机事件');
    } else {
        // 普通怪物1/5概率
        const roll = Math.random();
        if (roll < 0.2) {
            shouldTriggerEvent = true;
            console.log('普通怪物后触发随机事件 (1/5概率)');
        } else {
            console.log('普通怪物后无随机事件 (4/5概率)');
        }
    }
    
    // 只有满足概率条件且有API Key时才触发事件
    const hasApiKey = gameState.apiKey && gameState.apiKey.length > 0;
    console.log('是否触发事件:', shouldTriggerEvent, '是否有API Key:', hasApiKey);
    
    if (shouldTriggerEvent && hasApiKey) {
        // 显示"请稍后"界面，AI在后台生成事件
        showLoadingScreen('正在生成随机事件...');
        
        try {
            // 生成 AI 事件
            const aiEvent = await generateAIEvent(gameState.hero.name, gameState.chapter);
            
            if (aiEvent) {
                // 保存当前事件
                currentEvent = aiEvent;
                
                // 隐藏加载，显示事件
                hideLoadingScreen();
                showAIEvent(aiEvent);
                return; // 不立即开始战斗，等待事件处理
            } else {
                // AI 生成失败，等待2.5秒后进入下一场战斗
                console.log('AI 事件生成失败，2.5秒后进入下一场战斗');
                await new Promise(resolve => setTimeout(resolve, 2500));
                hideLoadingScreen();
            }
        } catch (error) {
            console.error('生成 AI 事件失败:', error);
            // 出错后等待2.5秒再继续
            await new Promise(resolve => setTimeout(resolve, 2500));
            hideLoadingScreen();
        }
    } else {
        // 不触发事件，显示"请稍后"后直接进入下一场战斗
        showLoadingScreen('请稍后...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        hideLoadingScreen();
    }
    
    // 继续战斗
    startBattle();
}

// 显示最终胜利界面
function showFinalVictory() {
    const finalVictoryScreen = document.getElementById('finalVictoryScreen');
    const statsDiv = document.getElementById('finalVictoryStats');
    const storyDiv = document.getElementById('finalStoryEnding');
    
    statsDiv.innerHTML = `
        <div>🎭 英雄: ${gameState.hero.name}</div>
        <div>📊 完成章节: 3/3</div>
        <div>⚔️ 总击杀数: ${gameState.totalKills}</div>
        <div>❤️ 剩余生命: ${gameState.hero.hp}/${gameState.hero.maxHp}</div>
        <div>👑 最终Boss: ${gameState.enemy.name}</div>
    `;
    
    // 设置故事结局
    const endings = [
        `📖 ${gameState.hero.name}完成了史诗般的冒险，击败了${gameState.totalKills}个敌人，成为了传说中的英雄。人们会永远记住这位勇者的事迹...`,
        `📖 经过无数战斗，${gameState.hero.name}终于战胜了所有邪恶。名字被刻在英雄殿堂的最高处，流芳百世...`,
        `📖 ${gameState.hero.name}的冒险结束了，但传说才刚刚开始。吟游诗人将用歌声传颂这段史诗，直到时间的尽头...`,
        `📖 当${gameState.hero.name}击败最终Boss时，整个世界都为之震动。这位英雄的名字将永远铭刻在历史之中...`,
        `📖 从无名小卒到传奇英雄，${gameState.hero.name}用行动证明了勇气和毅力的力量。这个故事将被世代传颂...`
    ];
    storyDiv.innerHTML = endings[Math.floor(Math.random() * endings.length)];
    
    document.getElementById('gameScreen').classList.add('hidden');
    finalVictoryScreen.classList.remove('hidden');
}

// ==================== 游戏结束 ====================

function gameOver(victory) {
    gameState.gameActive = false;
    
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('endScreen').classList.remove('hidden');
    
    const title = document.getElementById('endTitle');
    const message = document.getElementById('endMessage');
    const stats = document.getElementById('endStats');
    
    if (victory) {
        title.textContent = '🎉 胜利！';
        title.style.color = '#ffd700';
        message.textContent = `恭喜 ${gameState.hero.name} 完成了所有挑战！`;
    } else {
        title.textContent = '💀 失败';
        title.style.color = '#e74c3c';
        message.textContent = `${gameState.hero.name} 在第 ${gameState.chapter} 章倒下了...`;
    }
    
    stats.innerHTML = `
        <div>🗺️ 到达章节: ${gameState.chapter}/3</div>
        <div>⚔️ 击杀怪物: ${gameState.totalKills}</div>
        <div>❤️ 剩余生命: ${gameState.hero.hp}/${gameState.hero.maxHp}</div>
        <div>🎭 使用英雄: ${gameState.hero.name}</div>
    `;
}

// 重置游戏
function resetGame() {
    // 重置英雄数据为原始数值（如果是admin账号）
    if (isAdminMode) {
        resetHeroesToOriginal();
    }
    
    // 保留API Key和玩家名称
    const apiKey = gameState.apiKey;
    const playerName = gameState.playerName;
    
    gameState.hero = null;
    gameState.enemy = null;
    gameState.chapter = 1;
    gameState.monsterCount = 0;
    gameState.eliteCount = 0;
    gameState.isPlayerTurn = true;
    gameState.cardUsed = false;
    gameState.gameActive = false;
    gameState.selectedCard = null;
    gameState.selectedCardIndex = null;
    gameState.selectedSkill = null;
    gameState.totalKills = 0;
    gameState.apiKey = apiKey;
    gameState.playerName = playerName;
    
    // 重置管理员模式
    isAdminMode = false;
    
    // 隐藏管理员关卡跳转框
    const adminLevelJump = document.getElementById('adminLevelJump');
    if (adminLevelJump) {
        adminLevelJump.classList.add('hidden');
    }
    
    document.getElementById('logContent').innerHTML = '<div class="log-entry">战斗开始！</div>';
    
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('endScreen').classList.add('hidden');
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    document.getElementById('chapterCompleteScreen').classList.add('hidden');
    document.getElementById('finalVictoryScreen').classList.add('hidden');
    document.getElementById('battleStartScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    
    document.getElementById('username').value = '';
}

// 更新UI
function updateUI() {
    const hero = gameState.hero;
    const enemy = gameState.enemy;
    
    if (hero) {
        document.getElementById('heroHp').textContent = hero.hp;
        document.getElementById('heroBlock').textContent = hero.block;
        document.getElementById('heroHpText').textContent = `${hero.hp}/${hero.maxHp}`;
        document.getElementById('heroHpBar').style.width = `${(hero.hp / hero.maxHp) * 100}%`;
        document.getElementById('heroGold').textContent = gameState.gold;
        
        // 更新能量显示
        updateEnergyBar();
    }
    
    if (enemy) {
        document.getElementById('enemyHp').textContent = enemy.hp;
        document.getElementById('enemyAtk').textContent = enemy.attack;
        document.getElementById('enemyHpText').textContent = `${enemy.hp}/${enemy.maxHp}`;
        document.getElementById('enemyHpBar').style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
    }
}

// 更新能量条显示
function updateEnergyBar() {
    const energyBar = document.getElementById('energyBar');
    const energyText = document.getElementById('energyText');
    
    if (energyBar && energyText) {
        const slots = energyBar.querySelectorAll('.energy-slot');
        slots.forEach((slot, index) => {
            if (index < gameState.energy) {
                slot.classList.add('filled');
            } else {
                slot.classList.remove('filled');
            }
        });
        energyText.textContent = `${gameState.energy}/${gameState.maxEnergy}`;
    }
}

// 添加日志
function addLog(message) {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// 临时存储选中的英雄
let tempSelectedHero = null;

// 通过ID选择英雄（新版地图界面）
function selectHeroById(heroId) {
    const hero = HEROES.find(h => h.id === heroId);
    if (!hero) return;
    
    tempSelectedHero = hero;
    
    // 显示弹窗
    const modal = document.getElementById('heroDetailModal');
    const imageDiv = document.getElementById('modalHeroImage');
    const nameEl = document.getElementById('modalHeroName');
    const descEl = document.getElementById('modalHeroDesc');
    const skillsDiv = document.getElementById('modalHeroSkills');
    
    // 设置图片 - 使用对应的1-9.png图片
    const heroImageMap = {
        'ranger': 'photo/1.png',      // 1.png = 弓箭手
        'warrior': 'photo/4.png',     // 4.png = 骑士
        'mage': 'photo/3.png',        // 3.png = 法师
        'cleric': 'photo/6.png',      // 6.png = 牧师
        'bard': 'photo/5.png',        // 5.png = 吟游诗人
        'monk': 'photo/7.png',        // 7.png = 武僧
        'paladin': 'photo/2.png',     // 2.png = 持盾重甲骑士
        'cavalier': 'photo/8.png',    // 8.png = 骑马圣职者
        'druid': 'photo/9.png'        // 9.png = 熊
    };
    
    const imageSrc = heroImageMap[heroId] || hero.avatar;
    imageDiv.innerHTML = `<img src="${imageSrc}" alt="${hero.name}">`;
    nameEl.textContent = hero.name;
    descEl.textContent = hero.desc;
    
    // 显示技能预览
    skillsDiv.innerHTML = hero.skills.map(skill => `
        <div class="skill-preview-item">
            <div class="skill-preview-icon">${skill.icon}</div>
            <div class="skill-preview-name">${skill.name}</div>
        </div>
    `).join('');
    
    modal.classList.remove('hidden');
}

// 关闭英雄详情弹窗
function closeHeroModal() {
    const modal = document.getElementById('heroDetailModal');
    modal.classList.add('hidden');
    tempSelectedHero = null;
}

// 确认选择英雄
function confirmHeroSelect() {
    if (!tempSelectedHero) return;
    
    selectHero(tempSelectedHero);
    closeHeroModal();
}
