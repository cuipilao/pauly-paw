/* 预置题库 - 人教版 1 年级上下册常见内容
   数据结构：
   - TEXTBOOK 切换（上册 / 下册）
   - PINYIN: 拼音练习（声母/韵母/整体认读）
   - SHIZI: 识字（按主题）
   - KANGTU: 看图说话（含 emoji 插图占位 + 题目）
   - WORD: 看图选词
   - MATH_ADD / MATH_DEC / MATH_DECOMP: 加减法/分解组合
*/
window.DATA = (function () {
  const TEXTBOOK = {
    upper: '人教版 · 一年级上册',
    lower: '人教版 · 一年级下册'
  };

  // 1. 拼音（声母/韵母/整体认读）— 每题给一个字 + 拼音
  const PINYIN = [
    { word: '妈', pinyin: 'mā', opt: ['mā', 'mǎ', 'mà', 'mē'] },
    { word: '爸', pinyin: 'bà', opt: ['bā', 'bá', 'bǎ', 'bà'] },
    { word: '人', pinyin: 'rén', opt: ['rén', 'lén', 'rěn', 'rèn'] },
    { word: '日', pinyin: 'rì', opt: ['rī', 'rí', 'rǐ', 'rì'] },
    { word: '月', pinyin: 'yuè', opt: ['yuē', 'yué', 'yuě', 'yuè'] },
    { word: '山', pinyin: 'shān', opt: ['sān', 'shān', 'shēn', 'shāng'] },
    { word: '水', pinyin: 'shuǐ', opt: ['suǐ', 'shuí', 'shuǐ', 'shùi'] },
    { word: '火', pinyin: 'huǒ', opt: ['huō', 'huó', 'huǒ', 'huò'] },
    { word: '木', pinyin: 'mù', opt: ['mū', 'mú', 'mǔ', 'mù'] },
    { word: '禾', pinyin: 'hé', opt: ['hē', 'hé', 'hě', 'hè'] },
    { word: '竹', pinyin: 'zhú', opt: ['zú', 'zhú', 'zǔ', 'zhù'] },
    { word: '口', pinyin: 'kǒu', opt: ['kōu', 'kóu', 'kǒu', 'kòu'] },
    { word: '目', pinyin: 'mù', opt: ['mū', 'mú', 'mǔ', 'mù'] },
    { word: '耳', pinyin: 'ěr', opt: ['ēr', 'ér', 'ěr', 'èr'] },
    { word: '手', pinyin: 'shǒu', opt: ['shōu', 'shóu', 'shǒu', 'shòu'] },
    { word: '足', pinyin: 'zú', opt: ['zū', 'zú', 'zǔ', 'zù'] },
    { word: '心', pinyin: 'xīn', opt: ['xīn', 'xín', 'xǐn', 'xìn'] },
    { word: '刀', pinyin: 'dāo', opt: ['dāo', 'dáo', 'dǎo', 'dào'] },
    { word: '力', pinyin: 'lì', opt: ['lī', 'lí', 'lǐ', 'lì'] },
    { word: '牛', pinyin: 'niú', opt: ['niū', 'niú', 'niǔ', 'niù'] }
  ];

  // 2. 识字（按主题：自然、动物、人物、物品）
  const SHIZI = {
    natural: [
      { hanzi: '日', pinyin: 'rì' }, { hanzi: '月', pinyin: 'yuè' },
      { hanzi: '水', pinyin: 'shuǐ' }, { hanzi: '山', pinyin: 'shān' },
      { hanzi: '火', pinyin: 'huǒ' }, { hanzi: '木', pinyin: 'mù' },
      { hanzi: '禾', pinyin: 'hé' }, { hanzi: '竹', pinyin: 'zhú' },
      { hanzi: '雪', pinyin: 'xuě' }, { hanzi: '云', pinyin: 'yún' }
    ],
    animal: [
      { hanzi: '牛', pinyin: 'niú' }, { hanzi: '羊', pinyin: 'yáng' },
      { hanzi: '马', pinyin: 'mǎ' }, { hanzi: '鸟', pinyin: 'niǎo' },
      { hanzi: '鱼', pinyin: 'yú' }, { hanzi: '虫', pinyin: 'chóng' },
      { hanzi: '犬', pinyin: 'quǎn' }, { hanzi: '猫', pinyin: 'māo' }
    ],
    people: [
      { hanzi: '人', pinyin: 'rén' }, { hanzi: '你', pinyin: 'nǐ' },
      { hanzi: '我', pinyin: 'wǒ' }, { hanzi: '他', pinyin: 'tā' },
      { hanzi: '口', pinyin: 'kǒu' }, { hanzi: '目', pinyin: 'mù' },
      { hanzi: '耳', pinyin: 'ěr' }, { hanzi: '手', pinyin: 'shǒu' }
    ],
    goods: [
      { hanzi: '书', pinyin: 'shū' }, { hanzi: '本', pinyin: 'běn' },
      { hanzi: '笔', pinyin: 'bǐ' }, { hanzi: '刀', pinyin: 'dāo' },
      { hanzi: '尺', pinyin: 'chǐ' }, { hanzi: '车', pinyin: 'chē' }
    ]
  };

  // 3. 看图说话（用 emoji 当图片占位，孩子可以自己上传图片替换）
  const KANTU = [
    { emoji: '🐶', title: '小狗在做什么？', hint: '请说 1-2 句话：什么时候，谁，在哪里，做什么？', sample: '早上，小狗在草地上跑来跑去，它很开心。' },
    { emoji: '🍎', title: '苹果和篮子', hint: '用 “有几个、颜色、动作” 描述。', sample: '桌子上有 3 个红苹果。小明把苹果放进篮子里。' },
    { emoji: '👨‍👩‍👧', title: '一家人', hint: '介绍家庭成员与正在做的事。', sample: '我和爸爸妈妈一起去公园玩。' },
    { emoji: '🚒', title: '消防车出动', hint: '描述：什么车、要去哪里、为什么。', sample: '消防车呜呜地响，去救火。' },
    { emoji: '🌧️', title: '下雨了', hint: '描述天气和人们的反应。', sample: '天上飘着乌云，下雨了。小朋友撑起小花伞。' },
    { emoji: '🎂', title: '过生日', hint: '说出人物和动作。', sample: '今天是小红的生日，大家一起唱生日歌。' }
  ];

  // 4. 数学 加减法 / 分解组合
  function buildArith(range) {
    const max = range; // 10 或 20
    const list = [];
    for (let i = 0; i < 12; i++) {
      const a = randInt(1, max - 1);
      const b = randInt(1, max - a);
      const ans = a + b;
      list.push({ type: 'add', a, b, ans, range: max });
    }
    for (let i = 0; i < 12; i++) {
      const a = randInt(2, max);
      const b = randInt(1, a);
      list.push({ type: 'sub', a, b, ans: a - b, range: max });
    }
    return shuffle(list);
  }
  function buildDecomp(range) {
    const max = range;
    const list = [];
    for (let n = 2; n <= max; n++) {
      const a = randInt(1, n - 1);
      list.push({ type: 'decomp', n, a, b: n - a, range: max });
    }
    return shuffle(list);
  }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 5. 习惯
  const HABITS = [
    { id: 'lip', name: '唇肌训练', ico: '👄', desc: '抿嘴唇、鼓气各 1 分钟', reward: 2 },
    { id: 'nose', name: '洗鼻子', ico: '💧', desc: '用海盐水清洗鼻腔', reward: 1 },
    { id: 'brush', name: '刷牙', ico: '🪥', desc: '早晚各 1 次，每次 2 分钟', reward: 1 }
  ];

  // 6. 奖励商店
  const SHOP = {
    food: [
      { id: 'f1', name: '狗粮', ico: '🍖', cost: 3, desc: '基础食物' },
      { id: 'f2', name: '骨头饼干', ico: '🦴', cost: 5, desc: '香脆可口' },
      { id: 'f3', name: '鸡肉', ico: '🍗', cost: 8, desc: '超爱鸡肉' },
      { id: 'f4', name: '生日蛋糕', ico: '🎂', cost: 20, desc: '特殊日子' }
    ],
    clothes: [
      { id: 'c1', name: '消防帽', ico: '⛑️', cost: 15, slot: 'hat', desc: '像毛毛一样勇敢' },
      { id: 'c2', name: '警察帽', ico: '👮', cost: 15, slot: 'hat', desc: '像阿奇一样帅气' },
      { id: 'c3', name: '领结', ico: '🎀', cost: 8, slot: 'collar', desc: '可爱装饰' },
      { id: 'c4', name: '小披风', ico: '🧣', cost: 25, slot: 'clothes', desc: '超级英雄风' },
      { id: 'c5', name: '星星徽章', ico: '⭐', cost: 30, slot: 'collar', desc: '最亮的崽' }
    ]
  };

  // 7. 里程碑
  const MILESTONES = [
    { day: 3,  name: '新星',   ico: '🌱', desc: '坚持 3 天' },
    { day: 7,  name: '一周星', ico: '⭐', desc: '坚持 7 天' },
    { day: 14, name: '双周星', ico: '🌟', desc: '坚持 14 天' },
    { day: 30, name: '满月英雄', ico: '🏆', desc: '坚持 30 天' },
    { day: 60, name: '坚持达人', ico: '👑', desc: '坚持 60 天' },
    { day: 100, name: '百日英雄', ico: '💎', desc: '坚持 100 天' }
  ];

  return {
    TEXTBOOK, PINYIN, SHIZI, KANTU,
    buildArith, buildDecomp,
    HABITS, SHOP, MILESTONES
  };
})();
