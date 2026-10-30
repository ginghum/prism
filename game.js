        // --- Game State & DOM Elements ---
        let money = 0;
        let lastTick = performance.now();
        let usingItemType = null; 
        let autoItemMode = false; 

        // Fever System
        let feverActive = false;
        let feverTimer = 0; // 120秒で発動
        let feverDuration = 0; // 30秒持続
        let activeFeverEffect = null;

        // Statistics
        let gameStats = {
            totalMoneyEarned: 0,
            totalGoodsSold: 0,
            totalFeverCount: 0,
            totalItemsDropped: 0,
            totalItemsUsed: 0
        };

        const totalMoneyEl = document.getElementById('total-money');
        const moneyPerSecEl = document.getElementById('money-per-sec');
        const idolListEl = document.getElementById('idol-list');
        const goodsListEl = document.getElementById('goods-list');
        const itemsListEl = document.getElementById('items-list');
        const messageBox = document.getElementById('message-box');

        const formatMoney = (num) => Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        function getStarSvg(textColorClass) {
            return `<svg class="w-full h-full ${textColorClass}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`;
        }

        function createFloatText(element, text, color = '#e879f9') { 
            if(!element) return;
            const floater = document.createElement('div');
            floater.className = 'money-float text-sm md:text-lg drop-shadow-md';
            floater.textContent = text;
            floater.style.color = color;
            floater.style.left = `${(Math.random() - 0.5) * 60}px`;
            element.appendChild(floater);
            
            setTimeout(() => {
                if(floater.parentNode) floater.parentNode.removeChild(floater);
            }, 1000);
        }

        // --- Item Data (Rank 1 to 3) ---
        let inventory = {
            vocal_1: 0, dance_1: 0, talk_1: 0, visual_1: 0, stamina_1: 0,
            vocal_2: 0, dance_2: 0, talk_2: 0, visual_2: 0, stamina_2: 0,
            vocal_3: 0, dance_3: 0, talk_3: 0, visual_3: 0, stamina_3: 0
        };

        const itemDefs = {
            // ☆1 (+1)
            vocal_1:   { id: 'vocal_1',   name: 'のど飴',   desc: '歌唱+1',     emoji: '🍬', stat: 'vocal', val: 1, rank: 1, color: 'bg-rose-900/50 text-rose-300 border-rose-700' },
            dance_1:   { id: 'dance_1',   name: '絆創膏', desc: 'ダンス+1',   emoji: '🩹', stat: 'dance', val: 1, rank: 1, color: 'bg-green-900/50 text-green-300 border-green-700' },
            talk_1:    { id: 'talk_1',    name: '週刊誌',   desc: 'トーク+1',    emoji: '📰', stat: 'talk', val: 1, rank: 1, color: 'bg-blue-900/50 text-blue-300 border-blue-700' },
            visual_1:  { id: 'visual_1',  name: '手鏡',   desc: 'ビジュ+1',  emoji: '🪞', stat: 'visual', val: 1, rank: 1, color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
            stamina_1: { id: 'stamina_1', name: '栄養ドリンク', desc: 'スタミナ+1',emoji: '🧪', stat: 'stamina', val: 1, rank: 1, color: 'bg-orange-900/50 text-orange-300 border-orange-700' },
            // ☆2 (+5)
            vocal_2:   { id: 'vocal_2',   name: '高級マイク',   desc: '歌唱+5',     emoji: '🎤', stat: 'vocal', val: 5, rank: 2, color: 'bg-rose-800 text-rose-100 border-rose-500 shadow-md' },
            dance_2:   { id: 'dance_2',   name: '特注シューズ', desc: 'ダンス+5',   emoji: '👟', stat: 'dance', val: 5, rank: 2, color: 'bg-green-800 text-green-100 border-green-500 shadow-md' },
            talk_2:    { id: 'talk_2',    name: 'エッセイ本',   desc: 'トーク+5',    emoji: '📘', stat: 'talk', val: 5, rank: 2, color: 'bg-blue-800 text-blue-100 border-blue-500 shadow-md' },
            visual_2:  { id: 'visual_2',  name: '高級コスメ',   desc: 'ビジュ+5',  emoji: '💄', stat: 'visual', val: 5, rank: 2, color: 'bg-yellow-800 text-yellow-100 border-yellow-500 shadow-md' },
            stamina_2: { id: 'stamina_2', name: '特上焼肉弁当', desc: 'スタミナ+5',emoji: '🍱', stat: 'stamina', val: 5, rank: 2, color: 'bg-orange-800 text-orange-100 border-orange-500 shadow-md' },
            // ☆3 (+20) 激レア
            vocal_3:   { id: 'vocal_3',   name: '伝説の楽譜',   desc: '歌唱+20',     emoji: '🎼', stat: 'vocal', val: 20, rank: 3, color: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-pink-400 shadow-lg ring-2 ring-pink-300 animate-pulse' },
            dance_3:   { id: 'dance_3',   name: '天使の羽', desc: 'ダンス+20',   emoji: '🪽', stat: 'dance', val: 20, rank: 3, color: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-300 animate-pulse' },
            talk_3:    { id: 'talk_3',    name: '魔法のインク',   desc: 'トーク+20',    emoji: '🖋️', stat: 'talk', val: 20, rank: 3, color: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-lg ring-2 ring-cyan-300 animate-pulse' },
            visual_3:  { id: 'visual_3',  name: '女神のティアラ',   desc: 'ビジュ+20',  emoji: '👑', stat: 'visual', val: 20, rank: 3, color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-300 shadow-lg ring-2 ring-yellow-200 animate-pulse' },
            stamina_3: { id: 'stamina_3', name: '不老不死の霊薬', desc: 'スタミナ+20',emoji: '🍷', stat: 'stamina', val: 20, rank: 3, color: 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-red-400 shadow-lg ring-2 ring-red-300 animate-pulse' },
        };

        let teamStats = { dance: 0, visual: 0, talk: 0 };

        const idols = [
            {
                id: 'ageha', name: 'アゲハ', fullName: '塗離 愛夏羽（ぬらり あげは）',
                age: 18, height: 161, cup: 'D',
                color: 'bg-slate-800', borderColor: 'border-pink-500', textColor: 'text-pink-400', btnColor: 'bg-pink-600 hover:bg-pink-500', emoji: '🦋', hexColor: '#f472b6',
                level: 1, baseIncome: 10, currentIncome: 10, baseUpgradeCost: 500, upgradeCost: 500, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 10, dance: 10, talk: 10, visual: 10, stamina: 1 }, 
                quotes: [
                    "今日、私のことを見つけてくれてありがとう。あなたが振ってくれるピンクの光が、私の体に何よりの力をくれるんだよ。", 
                    "体が弱いからって心配させちゃってごめんね。でも約束する。ステージの上の私は誰よりも強くて、誰よりもあなたを幸せにするから。", 
                    "私が何度でも立ち上がるのはね、私の夢を一緒に信じてくれる、あなたがいるからだよ。一緒に行こう、まだ見ぬ一番高い場所へ。",
                    "みんなの笑顔が見られるなら、私はどこまででも頑張れるよ。絶対に諦めないから。",
                    "今日も会いに来てくれて嬉しいな。あなたとお話しする時間、すごく好き。",
                    "少し疲れちゃった時は、私に寄りかかっていいからね。いつでも味方だよ。",
                    "私のステージ、ちゃんと目に焼き付けてね。",
                    "パパは優しい人だよ。みんな誤解してるだけなんだから。",
                    "今日はいつもより長く起きられそう！みんなと話せるね！"
                ],
                lvlUpQuotes: ["もっともっと、一番高い景色を見せてあげるね！", "これでまた一歩、頂点に近づけたね！", "あなたのおかげで、もっと強くなれたよ！"],
                lvl30Quote: "信じてくれてありがとう。私、あなたにとっての一番になれたかな？ これ、私からのプレゼント。ずっと大切にしてね。",
                memorial: "🌸アゲハの髪飾り", hasMemorial: false,
                loveName: "アゲハの愛", hasLove: false,
                lvl50Quote: "私の全部、あなたにあげる。ずっと一緒にいてね。",
                desc: "すべての柵を受け止める「聖人」であり、猛獣たちを笑顔にさせる圧倒的なカリスマ。孤児院で育ち、裏社会の大物芸能人である父に引き取られた。過去のステージでメンバーに背中を刺され、日に3時間しか動けない体となるが、父の雪辱を果たすためPRISMを結成した。ドカ食い癖がある。",
                skillName: "天性のカリスマ", skillDesc: "フィーバー中、チーム全員のライブ収益が【3倍】になる。", skillDescLove: "フィーバー中、チーム全員のライブ収益が【6倍】になる。"
            },
            {
                id: 'queen', name: 'クイーン', fullName: '針生 王女（はりう おうじょ）',
                age: 18, height: 168, cup: 'E',
                color: 'bg-slate-800', borderColor: 'border-emerald-500', textColor: 'text-emerald-400', btnColor: 'bg-emerald-600 hover:bg-emerald-500', emoji: '👑', hexColor: '#34d399',
                level: 1, baseIncome: 4.0, currentIncome: 4.0, baseUpgradeCost: 250, upgradeCost: 250, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 8, dance: 7, talk: 6, visual: 8, stamina: 6 },
                quotes: [
                    "私のステージへようこそ。プロとして、貴方たちに極上の夢を見せてあげるわ。背筋を伸ばして、私の優美な姿をその目に焼き付けなさい。", 
                    "私が一番輝くべき場所は、アゲハの隣、そしてこのステージの上。貴方たちファンは、その美しい絵画を飾る額縁のようなもの。だからこそ、最高に美しく私を支えなさい？",
                    "ふふ、見惚れているようね。その眼差し、もっと熱烈に私へ向けなさい。",
                    "アゲハの邪魔をする虫がいれば、私が全て潰してあげるわ。それが私の愛だから。",
                    "貴方たちも、私を応援するからには品格を持ちなさい。妥協は許さないわよ。",
                    "ファンなら私の靴の先まで崇めなさい。",
                    "アゲハの邪魔をするなら、ファンでも容赦しないわよ。"
                ],
                lvlUpQuotes: ["当然の成果ね。私のアートはまだ洗練されるわ。", "アゲハの隣に立つに相応しい姿へ、また一歩進んだわ。", "私の美しさに、もっと磨きがかかったようね。"],
                lvl30Quote: "ふふ、貴方の忠誠、見事だったわ。このティアラのレプリカ、特別に賜ることを許してあげる。",
                memorial: "👑ティアラのレプリカ", hasMemorial: false,
                loveName: "クイーンの愛", hasLove: false,
                lvl50Quote: "貴方に私の全てを捧げるわ。……永遠に私の傍にいなさい。",
                desc: "プライドが高く、自分の価値観を押し付ける厳しいお姉様。アゲハを狂信しており、アゲハの介護を一手に引き受ける。元はNo.2チームのトップでアゲハの熱狂的ファン。アゲハ引退時に絶望し身を投げたが、助けられ彼女を守る女王として生きることを決意した。",
                skillName: "優美なる支配", skillDesc: "フィーバー中、すべてのグッズの販売価格が【2倍】になる。", skillDescLove: "フィーバー中、すべてのグッズの販売価格が【3倍】になる。"
            },
            {
                id: 'hotaru', name: 'ホタル', fullName: '火垂 瑠流（ほたる るる）',
                age: 18, height: 160, cup: 'F',
                color: 'bg-slate-800', borderColor: 'border-yellow-500', textColor: 'text-yellow-400', btnColor: 'bg-yellow-600 hover:bg-yellow-500', emoji: '🐝', hexColor: '#facc15',
                level: 1, baseIncome: 2.5, currentIncome: 2.5, baseUpgradeCost: 150, upgradeCost: 150, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 6, dance: 6, talk: 9, visual: 7, stamina: 5 },
                quotes: [
                    "いつも温かいご声援、ありがとうございます。あなたが私に投資してくださる時間と熱量、それに見合うだけの極上のステージをお返しすることをお約束します。",
                    "世間の評価なんて曖昧なものです。でも、あなたの中にいる『私』だけは、絶対に揺るぎない最強の存在であり続けたいですね。",
                    "あら、何か悩み事ですか？ もし法的トラブルなら、私がお安く相談に乗りますよ？（にっこり）",
                    "無駄な努力は嫌いですが、効率的な投資は大好きです。あなたもそうでしょう？",
                    "私を疑うのなら、証拠を出してください。無いなら……大人しく私のファンでいなさい。",
                    "私の計算に狂いなどありません。",
                    "感情論なんて何の役にも立ちませんよ。証拠を出してください。"
                ],
                lvlUpQuotes: ["ふふ、私の価値がまた証明されましたね。", "努力は裏切りません。計算通りです。", "これほど優秀な私を応援できること、誇りに思いなさい。"],
                lvl30Quote: "これほど私に投資するとは、狂気ですね。でも…その狂気、嫌いではありません。特別にこの品を差し上げましょう。",
                memorial: "🐝特製万年筆", hasMemorial: false,
                loveName: "ホタルの愛", hasLove: false,
                lvl50Quote: "計算外です。まさか私が、こんなにもあなたを……。",
                desc: "どんなときも笑顔を崩さず淡々とロジックで相手を殴り倒す。悪徳弁護士の娘であり、アゲハとは幼馴染（双子のような存在）。いじめられた過去を持ち、いつか圧倒的な力を手に入れるための弾丸（証拠）を握りしめている超現実主義者。",
                skillName: "完全論破", skillDesc: "フィーバー中、グッズの販売時間が【さらに半減】する。", skillDescLove: "フィーバー中、グッズの販売時間が【さらに75%短縮】になる。"
            },
            {
                id: 'maimai', name: 'マイマイ', fullName: '嵐山 真唯（あらしやま まい）',
                age: 17, height: 155, cup: 'C',
                color: 'bg-slate-800', borderColor: 'border-lime-500', textColor: 'text-lime-400', btnColor: 'bg-lime-600 hover:bg-lime-500', emoji: '🐸', hexColor: '#a3e635',
                level: 1, baseIncome: 1.5, currentIncome: 1.5, baseUpgradeCost: 80, upgradeCost: 80, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 2, dance: 6, talk: 4, visual: 3, stamina: 15 },
                quotes: [
                    "おーっ！ わたしの応援に来てくれたのか！ ありがとな！ よーし、今日のライブはいつもより余計に走っちゃうぞー！",
                    "悩んだって始まらないからさ！ 辛いことがあったなら、わたしのライブ中だけでも全部忘れて一緒に大声出そうぜ！",
                    "うおー！ 今日も元気いっぱいだぞ！ プロデューサーも一緒に走るか！？",
                    "難しいことは考えない！ 気合と根性で全部なんとかなるって！",
                    "お腹すいたなぁ……終わったら、みんなでご飯食べに行こうぜ！",
                    "プロデューサー！次は何周走ればいい！？",
                    "難しいことはアゲハに任せた！わたしは身体を動かすぞー！"
                ],
                lvlUpQuotes: ["おっしゃー！ もっと速く走れそうな気がするぞ！", "なんか力がみなぎってきたー！", "わたし、また元気になっちゃったぞ！"],
                lvl30Quote: "へへっ、ここまで一緒に走ってくれてありがとな！ ずっと隣にいてくれよ！ これ、お揃いのミサンガだ！",
                memorial: "🐸お揃いのミサンガ", hasMemorial: false,
                loveName: "マイマイの愛", hasLove: false,
                lvl50Quote: "わたし、お前のことめっちゃ好きだ！ これからもずっと一緒に走ろうな！",
                desc: "バカで明るく、考えることが大嫌いで走ることで解決しようとする少女。過去に親の転勤で友人に絶交されたトラウマがあり、怪我で入院中にアゲハと出会う。対等な友人として受け入れてくれた彼女を絶対に離さないと誓っている。チームの緩衝材。",
                skillName: "バカげた体力", skillDesc: "フィーバー中、販売速度・収益・ドロップ率すべてが【1.3倍】のバフ！", skillDescLove: "フィーバー中、販売速度・収益・ドロップ率すべてが【2倍】のバフ！"
            },
            {
                id: 'hataori', name: 'ハタオリ', fullName: '東堂 織香（とうどう おりか）',
                age: 17, height: 158, cup: 'E',
                color: 'bg-slate-800', borderColor: 'border-orange-500', textColor: 'text-orange-400', btnColor: 'bg-orange-600 hover:bg-orange-500', emoji: '🕸️', hexColor: '#fb923c',
                level: 1, baseIncome: 2.2, currentIncome: 2.2, baseUpgradeCost: 120, upgradeCost: 120, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 4, dance: 10, talk: 6, visual: 6, stamina: 9 },
                quotes: [
                    "ぬくぬくと平和に生きてるあんたたちを、あたしの歌とダンスでボコボコに脳震盪起こさせる瞬間が一番サイコー。ねえ、もっとあたしに圧倒されたい？",
                    "安心しな、あたしのファンやってる限り、誰もあんたを傷つけさせないから。あたし、身内は徹底的に守る主義なんだよねー。",
                    "ギャハハハ！ 今日もウケるくらい汗かいてんなー！ もっと熱くなろうぜ！",
                    "あたしのステップ、ちゃんと見えてる？ まばたきしてる暇なんてないよ！",
                    "アゲハに手ェ出すやつは、あたしが地の果てまで追い詰めてやっから。",
                    "アゲハに近づく不審者は、あたしがスクラップにしてやんよ！",
                    "ギャハハ！今日のライブも最高に暴れられそうじゃん！"
                ],
                lvlUpQuotes: ["いいね、あたしの細胞がもっと暴れたがってるよ！", "ギャハハ！ もっとヤバいもん見せてやるよ！", "これでまた一つ、限界を超えたね！"],
                lvl30Quote: "あんた、最後まであたしについてきたじゃん。最高にイカれてるよ。ほら、あたしの特注リング。大事にしな。",
                memorial: "🕸️特注シルバーリング", hasMemorial: false,
                loveName: "ハタオリの愛", hasLove: false,
                lvl50Quote: "ギャハハ！ あたしの心、完全に盗まれちゃったわ。責任とりなよ？",
                desc: "ゲラなギャル。裏社会の奴隷一族の生まれで圧倒的な身体能力を持つ。アゲハ暗殺に失敗し死を覚悟したところを優しく抱きしめられ匿われた。戸籍を消し顔を変え、アゲハを陰から守り抜く最強のボディーガードとして仕えている。",
                skillName: "暗殺者の本気", skillDesc: "発動時、在庫のあるランダムなグッズを最大【15個】即時販売する！", skillDescLove: "発動時、在庫のあるランダムなグッズを最大【50個】即時販売する！"
            },
            {
                id: 'nanaho', name: 'ナナホ', fullName: '霊堂 七帆（れいどう ななほ）',
                age: 16, height: 172, cup: 'B',
                color: 'bg-slate-800', borderColor: 'border-red-500', textColor: 'text-red-400', btnColor: 'bg-red-600 hover:bg-red-500', emoji: '🐞', hexColor: '#f87171',
                level: 1, baseIncome: 3.0, currentIncome: 3.0, baseUpgradeCost: 180, upgradeCost: 180, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 5, dance: 6, talk: 8, visual: 10, stamina: 6 },
                quotes: [
                    "来てくれたんだ。嬉しいな。今日も君の視線、俺が全部独り占めしていいよね？ 君の可愛い顔、もっと近くで見せてよ。",
                    "東京の夜景も綺麗だけどさ……やっぱり、俺の目にはステージから見える君が一番綺麗に映ってるよ。終わったら、少し話そうか？",
                    "どうしたの？ 寂しい顔して。俺が君の心、全部満たしてあげるよ。",
                    "俺以外の誰かを見たら、許さないよ？ 君は俺のものだからね。",
                    "君のその素直なところ、すごく好きだよ。ずっと俺のそばにいてね。",
                    "君みたいな可愛い子が応援してくれるなら、俺も本気出さなきゃね。",
                    "寂しいなら、俺が抱きしめてあげる。おいで？"
                ],
                lvlUpQuotes: ["ふふ、君のために、もっといい女になってあげる。", "俺の魅力、まだまだ底が知れないだろ？", "君の視線を釘付けにしちゃうよ。"],
                lvl30Quote: "ねえ、俺のことずっと見ててくれたでしょ？ 俺も…君のことずっと見てた。これ、俺の部屋の合鍵。内緒だよ？",
                memorial: "🐞合鍵", hasMemorial: false,
                loveName: "ナナホの愛", hasLove: false,
                lvl50Quote: "俺の可愛いお姫様。もう、一生逃がさないからね。",
                desc: "長身で優しいイケメン風の美少女だが、本質は冷徹なサイコパスで非常に女癖が悪い。昔恋に落ちた都会の少女を探すため上京し、女を抱き潰す荒んだ日々の中でアゲハと出会う。圧倒的なアイドルになれば彼女に見つけてもらえると確信している。",
                skillName: "底なしの魅力", skillDesc: "発動時、通常ライブ収益【45秒分】の投げ銭を獲得！", skillDescLove: "発動時、通常ライブ収益【120秒分】の投げ銭を獲得！"
            },
            {
                id: 'dragon', name: 'ドラゴン', fullName: '飛野 龍子（ひの たつこ）',
                age: 18, height: 159, cup: 'D',
                color: 'bg-slate-800', borderColor: 'border-cyan-500', textColor: 'text-cyan-400', btnColor: 'bg-cyan-600 hover:bg-cyan-500', emoji: '🐉', hexColor: '#22d3ee',
                level: 1, baseIncome: 2.0, currentIncome: 2.0, baseUpgradeCost: 110, upgradeCost: 110, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 4, dance: 9, talk: 2, visual: 5, stamina: 10 },
                quotes: [
                    "おぅ、てめーら！ 今日も気合入ってんじゃねぇか！ アタシの歌に遅れずについてきやがれ！ 魂燃やすぞ！",
                    "アタシは嘘をつくのが大嫌いだ。だからハッキリ言う。てめーらの声援、ちゃんと届いてるぜ。ライブで勝って、アタシたちの時代を絶対に見せてやるからな！",
                    "ヘラヘラしたアイドルなんてぶっ飛ばす！ アタシたちの本気、見せてやるぜ！",
                    "姉貴の頼みなら、地獄の底までついていく覚悟はできてんだよ。",
                    "おい、そこ！ 応援の声が小せぇぞ！ 腹から声出せや！",
                    "オラァ！テメェらの声、そんなもんじゃねぇだろ！",
                    "姉貴の背中はアタシが守る。誰にも指一本触れさせねぇ！"
                ],
                lvlUpQuotes: ["オラァ！ アタシの拳も歌も、まだまだ止まんねぇぜ！", "へへっ、もっと強くなっちまったな！", "てめーらのおかげで、また一つ壁を越えたぜ！"],
                lvl30Quote: "てめーとアタシの絆、本物だなってわかったぜ。これ、アタシの特攻服の切れ端だ。お守りにしろ！",
                memorial: "🐉特攻服の切れ端", hasMemorial: false,
                loveName: "ドラゴンの愛", hasLove: false,
                lvl50Quote: "アタシの魂、お前に預けたぜ。地獄の底までついてきな！",
                desc: "喧嘩っ早いヤクザの娘。孤独な時代に敗れた半グレのボスを慕っていたが、彼女が牙を抜かれ媚びるアイドルになったことに絶望する。ボスをステージから叩き潰すためカチコミをかけた際、アゲハに出会い「姉貴」として従っている。",
                skillName: "ヤンキー魂", skillDesc: "フィーバー中、全員の特訓費用が【30%引き】になる！", skillDescLove: "フィーバー中、全員の特訓費用が【60%引き】になる！"
            },
            {
                id: 'ichiru', name: 'イチル', fullName: '糸金 一縷（いとかね いちる）',
                age: 16, height: 167, cup: 'B',
                color: 'bg-slate-800', borderColor: 'border-blue-500', textColor: 'text-blue-400', btnColor: 'bg-blue-600 hover:bg-blue-500', emoji: '🧵', hexColor: '#60a5fa',
                level: 1, baseIncome: 1.8, currentIncome: 1.8, baseUpgradeCost: 90, upgradeCost: 90, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 6, dance: 4, talk: 3, visual: 7, stamina: 4 },
                quotes: [
                    "あ、あの！ 本日はお越しいただき、本当に、ありがとうございます……っ！ 私、緊張で、声が裏返ってないでしょうか……？",
                    "み、皆さんが私を応援してくれるように、私も、皆さんのつらい日常を支えられるような、そんな存在になりたいんです。未熟者ですが、隣にいてください……！",
                    "ふ、ふん……。アゲハがいないからといって、楽屋で騒ぐのは良くないぞ。（うぅ…どうして素直に言えないんだ…！）",
                    "わ、私の描いた絵、見てくれたんですか！？ えへへ、ちょっと恥ずかしいけど嬉しいです…！",
                    "失敗しないように、何度も何度も確認しました。今日も全力で頑張ります！",
                    "ひぃっ！ご、ごめんなさい！少し声が大きかったでしょうか…",
                    "こ、これも会社の…じゃなくて、アイドルのためですっ！"
                ],
                lvlUpQuotes: ["わ、私、少しはアゲハさんに近づけましたか…！？", "皆さんの期待に、少しでも応えられていたら嬉しいです！", "えへへ、頑張った甲斐がありました……！"],
                lvl30Quote: "あ、あの！ いつも支えてくれて、本当にありがとうございます。これ、あなたを描いた絵です。受け取ってください！",
                memorial: "🧵あなたを描いた似顔絵", hasMemorial: false,
                loveName: "イチルの愛", hasLove: false,
                lvl50Quote: "わ、私……あなたのことが、だ、大好きですっ……！",
                desc: "ビビりで小心者だが真面目で責任感が強い。心の中では常に早口大パニック状態。実家の会社が倒産危機に陥った際、アゲハの紹介で救われた。その恩を返すため、恐ろしい猛獣だらけの楽屋で事務兼調停役を務めている。",
                skillName: "神業の経理", skillDesc: "フィーバー中、グッズの入荷費用が【20%引き】になる！", skillDescLove: "フィーバー中、グッズの入荷費用が【40%引き】になる！"
            },
            {
                id: 'iehime', name: 'イエヒメ', fullName: '亜里園 葦江（ありその いえ）',
                age: 17, height: 140, cup: 'AA',
                color: 'bg-slate-800', borderColor: 'border-purple-500', textColor: 'text-purple-400', btnColor: 'bg-purple-600 hover:bg-purple-500', emoji: '🐜', hexColor: '#c084fc',
                level: 1, baseIncome: 2.8, currentIncome: 2.8, baseUpgradeCost: 160, upgradeCost: 160, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 7, dance: 5, talk: 6, visual: 8, stamina: 7 },
                quotes: [
                    "ふん！ やっと私の偉大さに気づいたのね！ ほら、もっと私の一番可愛い姿を見て、ひれ伏しなさい！",
                    "私は世界で一番努力してるの。だから、世界で一番愛されて当然なの。……だから、あんたも、絶対に私のこと一番でいなさいよね。他の子を見たら怒るから！",
                    "毎日走って帰ってるわよ。少しの運動不足も許されないんだから！",
                    "誰よりも早く起きて、誰よりも練習してるの。私の可愛さは、努力の結晶なんだから！",
                    "……ぐすん。才能がないなら、倍努力するしかないじゃない……！",
                    "私の可愛さにひれ伏しなさい！当然よね！",
                    "誰よりも練習してるんだから、一番に決まってるでしょ！"
                ],
                lvlUpQuotes: ["ふふん！ 私の才能ならこれくらい朝飯前よ！", "世界一可愛い私に、また磨きがかかっちゃったわ！", "当然の成長ね！もっと崇めなさい！"],
                lvl30Quote: "ふん、あんたにしてはよくやったわね。私を立派に育てたご褒美に、特別にこのサイン入りリボンをあげる！",
                memorial: "🐜サイン入りリボン", hasMemorial: false,
                loveName: "イエヒメの愛", hasLove: false,
                lvl50Quote: "ふん、特別に私の愛をあげるわ。一生感謝しなさい！",
                desc: "体は小さいが非常に我が強く傲慢なツンデレ。姉に憧れ10年血の滲む努力をしたが成果が出ず絶望していた所、アゲハに見出され救われた。裏では誰よりも努力家。お姉ちゃんが1番で自分が2番、アゲハは世界で3番目に凄い人。",
                skillName: "努力の結晶", skillDesc: "フィーバー中、イエヒメ自身のライブ収益が【15倍】に跳ね上がる！", skillDescLove: "フィーバー中、イエヒメ自身のライブ収益が【35倍】に跳ね上がる！"
            },
            {
                id: 'sickle', name: 'シックル', fullName: '不明',
                age: 17, height: 161, cup: 'A',
                color: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-400', btnColor: 'bg-slate-600 hover:bg-slate-500', emoji: '🦂', hexColor: '#94a3b8',
                level: 1, baseIncome: 3.5, currentIncome: 3.5, baseUpgradeCost: 220, upgradeCost: 220, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 10, dance: 8, talk: 1, visual: 7, stamina: 8 },
                quotes: [
                    "……あなた、わたしの歌を聴くと、なつかしい顔をする。この歌、あなたも、知ってるの……？",
                    "おはなしするのは、にがて。だから、歌う。わたしのこころ、この声に全部入ってるから。……届いた？",
                    "……アゲハ以外は、あんまり興味ない。でも、あなたは……すこしだけ、特別。",
                    "……ヘッドホン、外さない。この音が、わたしの世界の全部だから。",
                    "……いつか、本当のわたしを、思い出す日が来るのかな。",
                    "……また、あたらしいメロディが聴こえる。",
                    "……あなたといると、不思議と安心する……。"
                ],
                lvlUpQuotes: ["……新しい音が、聞こえる。", "……この声、あなたに届くかな。", "……わたし、少しだけ、変わった？"],
                lvl30Quote: "……あなたと一緒にいると、あたたかい。このイヤホン……片方、あなたにあげる。ずっと……おなじ音、聴こう。",
                memorial: "🦂片方のイヤホン", hasMemorial: false,
                loveName: "シックルの愛", hasLove: false,
                lvl50Quote: "……あなた。わたしの、大事な人。ずっと、そばにいて。",
                desc: "記憶喪失の無口な少女。周囲を完全に拒絶しているが、アゲハ（とマイマイ・イチル）には懐いている。歌うときだけ生き生きとした表情を見せる。過去のメロディを教えてくれた大事な人に再会する日を夢見ている。",
                skillName: "魂のメロディ", skillDesc: "フィーバー中、アイテムドロップ率が【確定(100%)】になる！", skillDescLove: "フィーバー中、アイテムドロップ率が【確定(100%)】になり、獲得数が【2倍】になる！"
            },
            {
                id: 'mimino', name: 'ミミノ', fullName: '雲居 巳実（くもい みみの）',
                age: 16, height: 148, cup: 'D',
                color: 'bg-slate-800', borderColor: 'border-gray-500', textColor: 'text-gray-300', btnColor: 'bg-gray-600 hover:bg-gray-500', emoji: '🐛', hexColor: '#d1d5db',
                level: 1, baseIncome: 1.2, currentIncome: 1.2, baseUpgradeCost: 60, upgradeCost: 60, upgradeCost5: 0, upgradeCost10: 0,
                stats: { vocal: 5, dance: 3, talk: 5, visual: 6, stamina: 2 },
                quotes: [
                    "うぅ、私なんかのファンをしてるなんて、あなたもよっぽど物好きですね……。でも、お互い人生上手くいかない者同士、慰め合いましょう…？",
                    "私がステージで転ばなかったのは、あなたがずっと祈っててくれたからですね。私の不幸を吸い取ってくれる優しいあなた、大好きです。",
                    "うぅ…また転んじゃいました。でも、皆さんが笑ってくれたから、これで良かったんですよね…？",
                    "不幸な私でも、アイドルになれたんです。だから、あなたもきっと大丈夫ですよ。",
                    "私がいるとみんな不幸になっちゃうかも……でも、離れたく、ないです。",
                    "うぅ、今日も照明が落ちてこないか心配です…",
                    "私がいじられるのは、皆様の愛情表現ですよね…？うふふ。"
                ],
                lvlUpQuotes: ["ひぇっ、私が成長しちゃっていいんですか！？", "あなたが応援してくれるから……私、もっと頑張ります……！", "うぅ、明日しんだりしませんよね……？ 嬉しいです……"],
                lvl30Quote: "あ、あの…こんな私を見捨てないでくれて、ありがとうございます。これ、手作りのお守りです。私の不幸がうつらないように…",
                memorial: "🐛手作りのお守り", hasMemorial: false,
                loveName: "ミミノの愛", hasLove: false,
                lvl50Quote: "わ、私なんかを愛してくれるなんて……絶対、離れませんからね……！",
                desc: "気弱で卑屈だが、無意識に周囲を煽って自爆させる天才。生まれた時から天災級の不運体質で人生の殆どを入院して過ごした。絶望の中アゲハに救われ、不幸を儚い魅力へと昇華させPRISMに辿り着いた。いじめもノーダメージ。",
                skillName: "不運の反動", skillDesc: "発動時、ランダムな育成アイテムを【3個】獲得する！", skillDescLove: "発動時、ランダムな育成アイテムを【8個】獲得する！"
            }
        ];

        const goods = [
            { id: 'badge', name: 'PRISM 缶バッジ', cost: 50, sellPrice: 80, stock: 0, baseTimeMax: 3, sellTimer: 0, emoji: '📛', dropRate: 0.02, autoBuy: false },
            { id: 'penlight', name: 'PRISM ペンライト', cost: 100, sellPrice: 150, stock: 0, baseTimeMax: 5, sellTimer: 0, emoji: '🪄', dropRate: 0.05, autoBuy: false },
            { id: 'photo', name: 'ランダム生写真セット', cost: 300, sellPrice: 500, stock: 0, baseTimeMax: 8, sellTimer: 0, emoji: '📸', dropRate: 0.10, autoBuy: false },
            { id: 'uchiwa', name: '公式応援うちわ', cost: 500, sellPrice: 900, stock: 0, baseTimeMax: 10, sellTimer: 0, emoji: '🪭', dropRate: 0.12, autoBuy: false },
            { id: 'towel', name: 'マフラータオル', cost: 800, sellPrice: 1500, stock: 0, baseTimeMax: 15, sellTimer: 0, emoji: '🧣', dropRate: 0.15, autoBuy: false },
            { id: 'cd', name: 'デビューシングルCD', cost: 2000, sellPrice: 4500, stock: 0, baseTimeMax: 30, sellTimer: 0, emoji: '💿', dropRate: 0.20, autoBuy: false },
            { id: 'acryl', name: 'アクリルスタンド', cost: 5000, sellPrice: 12000, stock: 0, baseTimeMax: 60, sellTimer: 0, emoji: '🧍‍♀️', dropRate: 0.25, autoBuy: false },
            { id: 'poster', name: '直筆サイン入りポスター', cost: 10000, sellPrice: 25000, stock: 0, baseTimeMax: 90, sellTimer: 0, emoji: '📜', dropRate: 0.30, autoBuy: false },
            { id: 'parka', name: '公式ライブパーカー', cost: 15000, sellPrice: 40000, stock: 0, baseTimeMax: 120, sellTimer: 0, emoji: '🧥', dropRate: 0.35, autoBuy: false },
            { id: 'ticket', name: 'VIPライブチケット', cost: 50000, sellPrice: 150000, stock: 0, baseTimeMax: 300, sellTimer: 0, emoji: '🎫', dropRate: 0.50, autoBuy: false },
            { id: 'panel', name: '等身大パネル', cost: 100000, sellPrice: 300000, stock: 0, baseTimeMax: 600, sellTimer: 0, emoji: '🧍', dropRate: 0.60, autoBuy: false },
            { id: 'dinner', name: 'シークレットディナーショー', cost: 500000, sellPrice: 1500000, stock: 0, baseTimeMax: 1200, sellTimer: 0, emoji: '🍽️', dropRate: 0.80, autoBuy: false },
            // Premium Goods
            { id: 'p_badge', name: 'プレミアム 缶バッジ', cost: 2000000, sellPrice: 8000000, stock: 0, baseTimeMax: 1800, sellTimer: 0, emoji: '✨', dropRate: 0.55, autoBuy: false },
            { id: 'p_penlight', name: 'プレミアム ペンライト', cost: 10000000, sellPrice: 50000000, stock: 0, baseTimeMax: 3600, sellTimer: 0, emoji: '✨', dropRate: 0.65, autoBuy: false }
        ];

        // Saturating team bonuses prevent runaway income while keeping every stat useful.
        function getDanceReduction(){return 0.8*teamStats.dance/(teamStats.dance+300)}
        function getVisualBonus(){return 3*teamStats.visual/(teamStats.visual+500)}
        function getTalkBonus(){return 0.25*teamStats.talk/(teamStats.talk+300)}

        function updateTeamStats() {
            idols.forEach(recalcIdolStats);
            teamStats.dance = idols.reduce((sum, idol) => sum + idol.stats.dance, 0);
            teamStats.visual = idols.reduce((sum, idol) => sum + idol.stats.visual, 0);
            teamStats.talk = idols.reduce((sum, idol) => sum + idol.stats.talk, 0);
            
            document.getElementById('team-dance-eff').textContent = `-${(getDanceReduction()*100).toFixed(1)}% 時間`;
            document.getElementById('team-vis-eff').textContent = `+${(getVisualBonus()*100).toFixed(1)}% 価格`;
            document.getElementById('team-talk-eff').textContent = `+${(getTalkBonus()*100).toFixed(1)}% ドロップ率`;
        }

        function calculateUpgradeCost(idol, addLevels) {
            let totalCost = 0;
            let feverDiscount = 1.0;
            if (feverActive && activeFeverEffect === 'dragon') {
                const dragon = idols.find(i => i.id === 'dragon');
                feverDiscount = dragon.hasLove ? 0.4 : 0.7; // 覚醒で60%割引
            }
            // スタミナ割引は最大60%、フィーバーとは乗算
            let discount = Math.max(0.4, 1 / (1 + idol.stats.stamina * 0.01)) * feverDiscount;
            discount = Math.max(0.16, discount); 

            for(let i = 0; i < addLevels; i++) {
                let rawCost = idol.baseUpgradeCost * Math.pow(1.16, (idol.level + i) - 1);
                totalCost += Math.floor(rawCost * discount);
            }
            return totalCost;
        }

        function recalcIdolStats(idol) {
            // 歌唱力ボーナスを0.1から0.2へ倍増
            const statMulti = (idol.stats.vocal * 0.08) + ((idol.stats.dance + idol.stats.talk + idol.stats.visual) * 0.005);
            let base = idol.baseIncome;
            if (feverActive && activeFeverEffect === 'iehime' && idol.id === 'iehime') {
                base *= idol.hasLove ? 35 : 15; // 単体の収益を強化
            }
            idol.currentIncome = base * Math.pow(1.07, idol.level - 1) * (1 + statMulti);
            
            idol.upgradeCost = calculateUpgradeCost(idol, 1);
            idol.upgradeCost5 = calculateUpgradeCost(idol, 5);
            idol.upgradeCost10 = calculateUpgradeCost(idol, 10);
        }

        let pressTimer = null, holdTriggered = false;
        function setupHoldEvent(element, idolId) {
          let x=0,y=0;
          const stop=()=>clearTimeout(pressTimer);
          element.addEventListener('pointerdown', e=>{if(e.target.closest('button'))return;holdTriggered=false;x=e.clientX;y=e.clientY;pressTimer=setTimeout(()=>{holdTriggered=true;showProfile(idolId)},550)});
          element.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-x)+Math.abs(e.clientY-y)>12)stop()});
          ['pointerup','pointerleave','pointercancel'].forEach(t=>element.addEventListener(t,stop));
          element.addEventListener('click',e=>{if(holdTriggered){e.stopImmediatePropagation();holdTriggered=false}},true);
        }

        function renderIdols() {
            idolListEl.innerHTML = '';
            idols.forEach(idol => {
                recalcIdolStats(idol);
                
                const card = document.createElement('div');
                card.id = `card-${idol.id}`;
                card.style.setProperty("--member", idol.hexColor);
                card.className = `idol-card bg-slate-800 rounded-xl shadow-lg border-t-4 ${idol.borderColor} overflow-hidden relative flex flex-col h-full`;
                
                card.onclick = (e) => {
                    if(e.target.closest('button')) return;
                    if (usingItemType) {
                        applyItemToIdol(idol.id);
                    } else {
                        talkToIdol(idol.id);
                    }
                };
                
                setupHoldEvent(card, idol.id);
                
                card.innerHTML = `
                    <div class="portrait-area"><span class="member-number">${String(idols.indexOf(idol)+1).padStart(2,'0')} / PRISM</span><img class="member-art" src="assets/${idol.id}.webp" alt="${idol.name}の全身立ち絵" loading="lazy" width="720" height="1080"><button class="profile-trigger" onclick="showProfile('${idol.id}')" aria-label="${idol.name}のプロフィール">↗</button></div>
                    <div class="bg-slate-900/50 p-3 md:p-4 flex items-center justify-between border-b border-slate-700">
                        <div class="flex items-center">
                            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center p-2 shadow-inner mr-3 border border-slate-600">
                                <img src="assets/${idol.id}.webp" class="avatar" alt="">
                            </div>
                            <div>
                                <h3 class="text-lg md:text-xl font-bold ${idol.textColor} tracking-wide">${idol.name}</h3>
                                <p class="text-xs text-slate-400 font-semibold">Lv.<span id="lvl-${idol.id}">${idol.level}</span></p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] text-slate-400 font-bold">🎤歌唱ボーナス</p>
                            <p class="font-bold ${idol.textColor}">¥<span id="income-${idol.id}">${formatMoney(idol.currentIncome)}</span>/s</p>
                        </div>
                    </div>
                    
                    <div class="p-3 md:p-4 bg-slate-800 flex-1 flex flex-col justify-between relative">
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] md:text-xs mb-3 text-slate-300 font-medium">
                            <div class="flex justify-between border-b border-slate-700 pb-1" title="個人の収益力が大幅UP"><span>🎤 歌唱</span> <span id="stat-voc-${idol.id}" class="font-mono font-bold text-white">${idol.stats.vocal}</span></div>
                            <div class="flex justify-between border-b border-slate-700 pb-1" title="チームのグッズ販売時間が短縮"><span>💃 ダンス</span> <span id="stat-dan-${idol.id}" class="font-mono font-bold text-white">${idol.stats.dance}</span></div>
                            <div class="flex justify-between border-b border-slate-700 pb-1" title="チームのアイテムドロップ率UP"><span>🗣️ トーク</span> <span id="stat-tal-${idol.id}" class="font-mono font-bold text-white">${idol.stats.talk}</span></div>
                            <div class="flex justify-between border-b border-slate-700 pb-1" title="チームのグッズ販売価格UP"><span>✨ ビジュ</span> <span id="stat-vis-${idol.id}" class="font-mono font-bold text-white">${idol.stats.visual}</span></div>
                            <div class="flex justify-between border-b border-slate-700 pb-1 col-span-2 mt-1 bg-red-900/30 px-1 rounded text-red-400" title="このキャラの特訓費用が割引">
                                <span>❤️ スタミナ (特訓費割引)</span> <span id="stat-sta-${idol.id}" class="font-mono font-bold">${idol.stats.stamina}</span>
                            </div>
                        </div>
                        
                        <div id="memorial-container-${idol.id}" class="${idol.hasMemorial ? '' : 'hidden'} text-center mb-1 bg-gradient-to-r from-pink-900/50 to-purple-900/50 p-1.5 rounded border border-pink-500/50 pointer-events-none">
                            <span class="text-[10px] md:text-xs font-bold text-pink-400">💐 <span>${idol.memorial}</span></span>
                        </div>

                        <div id="love-container-${idol.id}" class="${idol.hasLove ? '' : 'hidden'} text-center mb-2 bg-gradient-to-r from-red-900/50 to-red-800/50 p-1.5 rounded border border-red-500/50 pointer-events-none mt-1">
                            <span class="text-[10px] md:text-xs font-bold text-red-400">💖 <span>${idol.loveName}</span></span>
                        </div>

                        <div class="mt-auto flex space-x-1">
                            <button onclick="upgradeIdol('${idol.id}', 1)" id="upg-btn-${idol.id}" class="flex-1 py-1.5 rounded-lg text-white font-bold text-[10px] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${idol.btnColor} leading-tight border border-white/20">
                                特訓x1<br>(¥<span id="cost-${idol.id}">${formatMoney(idol.upgradeCost)}</span>)
                            </button>
                            <button onclick="upgradeIdol('${idol.id}', 5)" id="upg-btn5-${idol.id}" class="flex-1 py-1.5 rounded-lg text-white font-bold text-[10px] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${idol.btnColor} leading-tight border border-white/20">
                                特訓x5<br>(¥<span id="cost5-${idol.id}">${formatMoney(idol.upgradeCost5)}</span>)
                            </button>
                            <button onclick="upgradeIdol('${idol.id}', 10)" id="upg-btn10-${idol.id}" class="flex-1 py-1.5 rounded-lg text-white font-bold text-[10px] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${idol.btnColor} leading-tight border border-white/20">
                                特訓x10<br>(¥<span id="cost10-${idol.id}">${formatMoney(idol.upgradeCost10)}</span>)
                            </button>
                        </div>
                        <div id="coin-spawn-${idol.id}" class="absolute top-0 right-1/2 w-0 h-0"></div>
                    </div>
                `;
                idolListEl.appendChild(card);
            });
        }

        function renderGoods() {
            goodsListEl.innerHTML = '';
            goods.forEach(item => {
                const div = document.createElement('div');
                div.className = 'bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-sm hover:border-indigo-500 transition-colors';
                div.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <div class="font-bold text-slate-200 text-sm flex items-center">
                            <span class="text-xl mr-1">${item.emoji}</span> ${item.name}
                        </div>
                        <div class="flex items-center space-x-2">
                            <label class="relative inline-flex items-center cursor-pointer" title="在庫が10個未満の時、自動で1個ずつ入荷します">
                                <input type="checkbox" id="auto-buy-${item.id}" class="sr-only peer" ${item.autoBuy ? 'checked' : ''} onchange="toggleAutoBuy('${item.id}')">
                                <div class="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
                                <span class="ml-1 text-[9px] text-slate-400 font-bold">自動入荷</span>
                            </label>
                            <div class="text-xs font-mono bg-indigo-900/50 text-indigo-300 border border-indigo-700 px-2 py-1 rounded">
                                在庫: <span id="stock-${item.id}" class="font-bold">${item.stock}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
                        <span>仕入: <span id="cost-disp-${item.id}">¥${formatMoney(item.cost)}</span></span>
                        <span class="text-indigo-400 font-bold" id="sellprice-disp-${item.id}">売値: ¥${formatMoney(item.sellPrice)}</span>
                    </div>
                    <div class="text-[10px] text-pink-400 mb-2 text-right">アイテムドロップ率: ${(item.dropRate * 100).toFixed(0)}% + ボーナス</div>
                    <div class="relative w-full h-1.5 bg-slate-800 rounded-full mb-3 overflow-hidden">
                        <div id="progress-${item.id}" class="absolute top-0 left-0 h-full bg-indigo-500 w-0 progress-bar-fill"></div>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="buyGoods('${item.id}', 1)" id="buy-btn-${item.id}" class="flex-1 py-1.5 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 rounded text-[10px] md:text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm leading-tight">
                            入荷x1
                        </button>
                        <button onclick="buyGoods('${item.id}', 5)" id="buy-btn5-${item.id}" class="flex-1 py-1.5 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 rounded text-[10px] md:text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm leading-tight">
                            入荷x5
                        </button>
                        <button onclick="buyGoods('${item.id}', 10)" id="buy-btn10-${item.id}" class="flex-1 py-1.5 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 rounded text-[10px] md:text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm leading-tight">
                            入荷x10
                        </button>
                    </div>
                `;
                goodsListEl.appendChild(div);
            });
        }

        function renderItems() {
            itemsListEl.innerHTML = '';
            let hasItems = false;
            Object.keys(itemDefs).forEach(key => {
                const def = itemDefs[key];
                const count = inventory[key];
                
                if (count > 0) {
                    hasItems = true;
                    const div = document.createElement('div');
                    div.className = `border rounded-lg p-3 flex items-center justify-between ${def.color}`;
                    div.innerHTML = `
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${def.emoji}</span>
                            <div>
                                <p class="font-bold text-sm leading-tight">${def.name} <span class="text-xs font-normal opacity-80">x<span id="item-count-${key}">${count}</span></span></p>
                                <p class="text-[10px] font-bold mt-1">${def.desc}</p>
                            </div>
                        </div>
                        <button onclick="startItemUse('${key}')" id="use-item-btn-${key}" class="px-3 py-1.5 rounded bg-black/20 hover:bg-black/40 border border-current font-bold text-xs transition-colors">
                            使う
                        </button>
                    `;
                    itemsListEl.appendChild(div);
                }
            });
            if (!hasItems) {
                itemsListEl.innerHTML = '<p class="text-slate-500 text-sm text-center py-4">現在アイテムを所持していません。<br>高額グッズを販売すると手に入ります。</p>';
            }
        }

        function toggleAutoItem() {
            autoItemMode = document.getElementById('auto-item-toggle').checked;
            if (autoItemMode) consumeAllItemsAuto();
        }

        function toggleAutoBuy(id) {
            const item = goods.find(g => g.id === id);
            if(item) {
                item.autoBuy = document.getElementById(`auto-buy-${item.id}`).checked;
            }
        }

        function consumeAllItemsAuto() {
            let used = false;
            Object.keys(inventory).forEach(type => {
                while (inventory[type] > 0) {
                    applyItemToRandomIdol(type);
                    used = true;
                }
            });
            if(used) {
                renderItems();
                updateUI();
            }
        }

        function applyItemToRandomIdol(type) {
            const randomIdol = idols[Math.floor(Math.random() * idols.length)];
            const def = itemDefs[type];
            randomIdol.stats[def.stat] += def.val;
            inventory[type]--;
            gameStats.totalItemsUsed++;
            recalcIdolStats(randomIdol);
            updateTeamStats();
            createFloatText(document.getElementById(`coin-spawn-${randomIdol.id}`), 'UP!', '#f43f5e');
        }

        function startItemUse(type) {
            if(inventory[type] <= 0) return;
            usingItemType = type;
            document.getElementById('main-area').classList.add('item-cursor-mode');
            const overlay = document.getElementById('item-use-overlay');
            overlay.classList.remove('hidden');
            document.getElementById('using-item-desc').textContent = `使用アイテム: ${itemDefs[type].emoji} ${itemDefs[type].name} (${itemDefs[type].desc})`;
            document.getElementById('idols-container').scrollTop = 0;
        }

        function cancelItemUse() {
            usingItemType = null;
            document.getElementById('main-area').classList.remove('item-cursor-mode');
            document.getElementById('item-use-overlay').classList.add('hidden');
        }

        function applyItemToIdol(idolId) {
            if (!usingItemType || inventory[usingItemType] <= 0) {
                cancelItemUse();
                return;
            }
            const idol = idols.find(i => i.id === idolId);
            const def = itemDefs[usingItemType];
            
            idol.stats[def.stat] += def.val;
            inventory[usingItemType]--;
            gameStats.totalItemsUsed++;
            
            recalcIdolStats(idol);
            updateTeamStats();
            renderItems();
            updateUI();
            createFloatText(document.getElementById(`coin-spawn-${idol.id}`), 'UP!', '#f43f5e');
            
            if (inventory[usingItemType] <= 0) cancelItemUse();
        }

        function showLevel30Effect(idol) {
            const overlay = document.getElementById('lvl30-overlay');
            const content = document.getElementById('lvl30-content');
            document.getElementById('lvl30-icon').innerHTML = getStarSvg(idol.textColor);
            document.getElementById('lvl30-text').textContent = `${idol.name}と深い絆で結ばれた！`;
            document.getElementById('lvl30-quote').textContent = `「${idol.lvl30Quote}」`;
            document.getElementById('lvl30-memorial-name').textContent = `🎁 ${idol.memorial}`;
            
            overlay.classList.remove('hidden');
            void overlay.offsetWidth;
            content.classList.remove('scale-0');
            content.classList.add('scale-100');
            
            setTimeout(() => {
                content.classList.remove('scale-100');
                content.classList.add('scale-0');
                setTimeout(() => overlay.classList.add('hidden'), 500);
            }, 6000); 
        }

        function showLevel50Effect(idol) {
            const overlay = document.getElementById('lvl50-overlay');
            const content = document.getElementById('lvl50-content');
            document.getElementById('lvl50-icon').innerHTML = getStarSvg(idol.textColor);
            document.getElementById('lvl50-text').textContent = `${idol.name}からの愛を受け取った！`;
            document.getElementById('lvl50-quote').textContent = `「${idol.lvl50Quote}」`;
            document.getElementById('lvl50-love-name').textContent = `💖 ${idol.loveName}`;
            
            overlay.classList.remove('hidden');
            void overlay.offsetWidth;
            content.classList.remove('scale-0');
            content.classList.add('scale-100');
            
            setTimeout(() => {
                content.classList.remove('scale-100');
                content.classList.add('scale-0');
                setTimeout(() => overlay.classList.add('hidden'), 500);
            }, 6000); 
        }

        function upgradeIdol(id, amount = 1) {
            const idol = idols.find(i => i.id === id);
            const totalCost = calculateUpgradeCost(idol, amount);
            
            if (money >= totalCost) {
                money -= totalCost;
                
                for(let i = 0; i < amount; i++) {
                    idol.level++;
                    // 特訓ステータス上昇を3倍に
                    const statKeys = ['vocal', 'dance', 'talk', 'visual'];
                    const upStat = statKeys[Math.floor(Math.random() * statKeys.length)];
                    idol.stats[upStat] += 3;
                    
                    if(Math.random() > 0.6) {
                        idol.stats.stamina += 3; 
                    }
                    
                    if (idol.level === 30 && !idol.hasMemorial) {
                        idol.hasMemorial = true;
                        idol.baseIncome *= 2; 
                        showLevel30Effect(idol);
                    }
                    if (idol.level === 50 && !idol.hasLove) {
                        idol.hasLove = true;
                        showLevel50Effect(idol);
                    }
                }
                
                recalcIdolStats(idol);
                updateTeamStats();
                updateUI();
                createFloatText(document.getElementById(`coin-spawn-${idol.id}`), 'LV UP!', '#10b981');
                
                const randomQuote = idol.lvlUpQuotes[Math.floor(Math.random() * idol.lvlUpQuotes.length)];
                talkToIdol(idol.id, randomQuote);
            }
        }

        function buyGoods(id, amount = 1) {
            const item = goods.find(g => g.id === id);
            
            let ichiruCostMulti = 1;
            if (feverActive && activeFeverEffect === 'ichiru') {
                const ichiru = idols.find(i => i.id === 'ichiru');
                ichiruCostMulti = ichiru.hasLove ? 0.6 : 0.8;
            }
            const currentCost = item.cost * ichiruCostMulti;
            const totalCost = currentCost * amount;
            
            if (money >= totalCost) {
                money -= totalCost;
                item.stock += amount;
                updateUI();
            }
        }

        function showProfile(id) {
            const idol = idols.find(i => i.id === id);
            const modal = document.getElementById('profile-modal');
            const modalContent = document.getElementById('profile-modal-content');
            
            // メンバーカラーを適用
            modalContent.className = `bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border-2 ${idol.borderColor} transition-colors duration-300`;

            const skillDesc = idol.hasLove ? idol.skillDescLove : idol.skillDesc;
            const skillTitle = idol.hasLove ? `固有スキル: ${idol.skillName} 【愛の覚醒💖】` : `固有スキル: ${idol.skillName}`;
            
            document.getElementById('profile-header').innerHTML = `
                <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center p-3 shadow-inner mr-4 border border-slate-600">
                    ${getStarSvg(idol.textColor)}
                </div>
                <div>
                    <h2 class="text-2xl font-bold ${idol.textColor}">${idol.fullName}</h2>
                    <p class="text-sm text-slate-400">ニックネーム: ${idol.name}</p>
                </div>
            `;
            
            document.getElementById('profile-content').innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div><span class="text-slate-400">年齢:</span> <span class="font-bold">${idol.age}歳</span></div>
                    <div><span class="text-slate-400">身長:</span> <span class="font-bold">${idol.height}cm</span></div>
                </div>
                <div>
                    <h3 class="font-bold ${idol.textColor} border-b border-slate-700 pb-1 mb-2">${skillTitle}</h3>
                    <p class="text-sm bg-slate-800 p-2 rounded text-slate-300 font-bold">${skillDesc}</p>
                </div>
                <div>
                    <h3 class="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2">バックボーン</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">${idol.desc}</p>
                </div>
            `;
            
            document.getElementById('profile-content').insertAdjacentHTML('afterbegin', `<img class="profile-art" src="assets/${idol.id}.webp" alt="${idol.name}の全身立ち絵">`);
            modal.classList.remove('hidden');
            modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-label', idol.name+'のプロフィール');
            previousFocus = document.activeElement; modal.querySelector('button').focus();
        }

        function closeProfile() {
            document.getElementById('profile-modal').classList.add('hidden');
            if(previousFocus) previousFocus.focus();
        }

        function triggerFever(forceIdolId = null) {
            if (feverActive) {
                endFever(); 
            }
            
            const idol = forceIdolId ? idols.find(i => i.id === forceIdolId) : idols[Math.floor(Math.random() * idols.length)];
            feverActive = true;
            activeFeverEffect = idol.id;
            feverDuration = 30; // 30 seconds
            gameStats.totalFeverCount++;
            
            // 即時発動スキルの処理
            if (idol.id === 'nanaho') {
                const totalIncome = idols.reduce((s, i) => s + i.currentIncome, 0);
                const multi = idol.hasLove ? 120 : 45;
                const bonus = totalIncome * multi;
                money += bonus;
                gameStats.totalMoneyEarned += bonus;
            } else if (idol.id === 'mimino') {
                const amt = idol.hasLove ? 8 : 3;
                for(let n=0;n<amt;n++) {
                    const types=['vocal','dance','talk','visual','stamina'];
                    const roll=Math.random();
                    const rank=roll<0.01?3:roll<0.15?2:1;
                    const key=types[Math.floor(Math.random()*types.length)]+'_'+rank;
                    inventory[key]++; gameStats.totalItemsDropped++;
                }
                renderItems();
                if(autoItemMode) consumeAllItemsAuto();
            } else if (idol.id === 'hataori') {
                let hataoriBonus = 0;
                const visualBonus = getVisualBonus();
                let soldCount = 0;
                const maxSell = idol.hasLove ? 50 : 15;
                
                for(let i=0; i<maxSell; i++) {
                    const availableGoods = goods.filter(g => g.stock > 0);
                    if(availableGoods.length === 0) break;
                    const randGoods = availableGoods[Math.floor(Math.random() * availableGoods.length)];
                    randGoods.stock--;
                    const finalPrice = Math.floor(randGoods.sellPrice * (1 + visualBonus));
                    hataoriBonus += finalPrice;
                    soldCount++;
                    gameStats.totalGoodsSold++;
                }
                money += hataoriBonus;
                gameStats.totalMoneyEarned += hataoriBonus;
            }
            
            idols.forEach(recalcIdolStats);
            updateUI();
            
            // カットイン演出
            const cutin = document.getElementById('fever-cutin');
            const cutinBox = document.getElementById('fever-cutin-box');
            
            document.getElementById('fever-cutin-name').textContent = idol.name;
            document.getElementById('fever-cutin-name').style.color = idol.hexColor;
            document.getElementById('fever-cutin-quote').textContent = `「${idol.quotes[0]}」`;
            document.getElementById('fever-cutin-desc').textContent = `効果: ${idol.hasLove ? idol.skillDescLove : idol.skillDesc}`;
            
            cutin.classList.remove('hidden');
            void cutin.offsetWidth;
            cutinBox.classList.remove('scale-y-0');
            cutinBox.classList.add('scale-y-100');
            
            setTimeout(() => {
                cutinBox.classList.remove('scale-y-100');
                cutinBox.classList.add('scale-y-0');
                setTimeout(() => cutin.classList.add('hidden'), 500);
            }, 3000);
        }

        function endFever() {
            feverActive = false;
            activeFeverEffect = null;
            feverDuration = 0;
            idols.forEach(recalcIdolStats);
            updateUI();
        }

        function talkToIdol(id, forceQuote = null) {
            const idol = idols.find(i => i.id === id);
            const quote = forceQuote || idol.quotes[Math.floor(Math.random() * idol.quotes.length)];
            
            document.getElementById('message-icon').innerHTML = `<img class="avatar" src="assets/${idol.id}.webp" alt="">`; selectSpotlight(id);
            document.getElementById('message-name').textContent = idol.name;
            document.getElementById('message-name').className = `font-bold text-sm md:text-base mb-1 ${idol.textColor}`;
            document.getElementById('message-text').textContent = quote;
            
            messageBox.classList.remove('translate-y-full');
            createFloatText(document.getElementById(`coin-spawn-${idol.id}`), '💬', '#818cf8');

            clearTimeout(window.messageTimeout);
            const displayTime = Math.max(4000, quote.length * 100);
            window.messageTimeout = setTimeout(closeMessage, displayTime);
        }

        function closeMessage() {
            messageBox.classList.add('translate-y-full');
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
            
            ['goods', 'items', 'stats'].forEach(t => document.getElementById(`${t}-tab`).classList.add('hidden'));
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
            if(tabId === 'items') document.getElementById('item-badge').classList.add('hidden');
        }

        function updateUI() {
            totalMoneyEl.textContent = formatMoney(money);
            
            let totalIncomePerSec = 0;
            const activeIdol = feverActive ? idols.find(i => i.id === activeFeverEffect) : null;
            const isLove = activeIdol ? activeIdol.hasLove : false;
            
            idols.forEach(idol => {
                let currentIncome = idol.currentIncome;
                
                // Fever Income Modifiers
                if (feverActive) {
                    if (activeFeverEffect === 'maimai') currentIncome *= (isLove ? 2 : 1.3);
                    if (activeFeverEffect === 'ageha') currentIncome *= (isLove ? 6 : 3);
                }
                
                totalIncomePerSec += currentIncome;
                document.getElementById(`lvl-${idol.id}`).textContent = idol.level;
                document.getElementById(`income-${idol.id}`).textContent = formatMoney(currentIncome);
                document.getElementById(`cost-${idol.id}`).textContent = formatMoney(idol.upgradeCost);
                document.getElementById(`cost5-${idol.id}`).textContent = formatMoney(idol.upgradeCost5);
                document.getElementById(`cost10-${idol.id}`).textContent = formatMoney(idol.upgradeCost10);
                
                document.getElementById(`stat-voc-${idol.id}`).textContent = idol.stats.vocal;
                document.getElementById(`stat-dan-${idol.id}`).textContent = idol.stats.dance;
                document.getElementById(`stat-tal-${idol.id}`).textContent = idol.stats.talk;
                document.getElementById(`stat-vis-${idol.id}`).textContent = idol.stats.visual;
                document.getElementById(`stat-sta-${idol.id}`).textContent = idol.stats.stamina;

                if (idol.hasMemorial) document.getElementById(`memorial-container-${idol.id}`).classList.remove('hidden');
                if (idol.hasLove) document.getElementById(`love-container-${idol.id}`).classList.remove('hidden');

                const btn = document.getElementById(`upg-btn-${idol.id}`);
                const btn5 = document.getElementById(`upg-btn5-${idol.id}`);
                const btn10 = document.getElementById(`upg-btn10-${idol.id}`);
                btn.disabled = money < idol.upgradeCost;
                btn5.disabled = money < idol.upgradeCost5;
                btn10.disabled = money < idol.upgradeCost10;
            });

            moneyPerSecEl.textContent = `ライブ収益: ¥${formatMoney(totalIncomePerSec)}/s`;

            // Goods UI Update
            const visualBonus = getVisualBonus();
            let queenMulti = (feverActive && activeFeverEffect === 'queen') ? (isLove ? 3 : 2) : 1;
            let ichiruCostMulti = (feverActive && activeFeverEffect === 'ichiru') ? (isLove ? 0.6 : 0.8) : 1;

            goods.forEach(item => {
                document.getElementById(`stock-${item.id}`).textContent = item.stock;
                
                const currentCost = item.cost * ichiruCostMulti;
                const currentSellPrice = Math.floor(item.sellPrice * (1 + visualBonus) * queenMulti);
                
                const costDisp = document.getElementById(`cost-disp-${item.id}`);
                costDisp.textContent = `¥${formatMoney(currentCost)}`;
                if(ichiruCostMulti < 1) costDisp.classList.add('text-green-400', 'font-bold');
                else costDisp.classList.remove('text-green-400', 'font-bold');
                
                const sellDisp = document.getElementById(`sellprice-disp-${item.id}`);
                sellDisp.textContent = `売値: ¥${formatMoney(currentSellPrice)}`;
                if(visualBonus > 0 || queenMulti > 1) sellDisp.classList.add('text-pink-400');
                else sellDisp.classList.remove('text-pink-400');

                const btn = document.getElementById(`buy-btn-${item.id}`);
                const btn5 = document.getElementById(`buy-btn5-${item.id}`);
                const btn10 = document.getElementById(`buy-btn10-${item.id}`);
                btn.disabled = money < currentCost;
                btn5.disabled = money < (currentCost * 5);
                btn10.disabled = money < (currentCost * 10);
            });

            // Update Stats UI
            document.getElementById('stat-total-money').textContent = `¥${formatMoney(gameStats.totalMoneyEarned)}`;
            document.getElementById('stat-total-goods').textContent = formatMoney(gameStats.totalGoodsSold);
            document.getElementById('stat-total-fever').textContent = formatMoney(gameStats.totalFeverCount);
            document.getElementById('stat-total-drop').textContent = formatMoney(gameStats.totalItemsDropped);
            document.getElementById('stat-total-use').textContent = formatMoney(gameStats.totalItemsUsed);
        }

        function gameLoop(currentTime) {
            const deltaTime = Math.min(1, Math.max(0, (currentTime - lastTick) / 1000)); 
            lastTick = currentTime;
            if(document.hidden) { requestAnimationFrame(gameLoop); return; }

            if (feverActive) {
                feverDuration -= deltaTime;
                if (feverDuration <= 0) endFever();
            } else {
                feverTimer += deltaTime;
                if (feverTimer >= 120) {
                    feverTimer = 0;
                    triggerFever();
                }
            }

            const activeIdol = feverActive ? idols.find(i => i.id === activeFeverEffect) : null;
            const isLove = activeIdol ? activeIdol.hasLove : false;

            let incomeThisTick = 0;
            const globalIncomeMulti = (feverActive && activeFeverEffect === 'maimai') ? (isLove ? 2 : 1.3) : 1;
            const agehaMulti = (feverActive && activeFeverEffect === 'ageha') ? (isLove ? 6 : 3) : 1;
            
            idols.forEach(idol => {
                let tickIncome = idol.currentIncome * globalIncomeMulti * agehaMulti;
                incomeThisTick += tickIncome * deltaTime;
                if (Math.random() < 0.15 * deltaTime) {
                     createFloatText(document.getElementById(`coin-spawn-${idol.id}`), '♪', '#c084fc'); 
                }
            });
            money += incomeThisTick;
            gameStats.totalMoneyEarned += incomeThisTick;

            let timeReduction = getDanceReduction();
            if (feverActive && activeFeverEffect === 'hotaru') {
                timeReduction += (1 - timeReduction) * (isLove ? 0.75 : 0.5);
            }
            
            const visualBonus = getVisualBonus();
            const queenMulti = (feverActive && activeFeverEffect === 'queen') ? (isLove ? 3 : 2) : 1;
            let talkBonus = getTalkBonus();
            if(feverActive && activeFeverEffect === 'maimai') talkBonus *= isLove ? 2 : 1.3;
            let ichiruCostMulti = (feverActive && activeFeverEffect === 'ichiru') ? (isLove ? 0.6 : 0.8) : 1;

            goods.forEach(item => {
                // 自動入荷ロジック
                if (item.autoBuy && currentTime - (item.lastAutoBuy || 0) >= 500) {
                    item.lastAutoBuy = currentTime;
                    const currentCost = item.cost * ichiruCostMulti;
                    if (item.stock < 10 && money >= currentCost) {
                        money -= currentCost;
                        item.stock++;
                    }
                }

                if (item.stock > 0) {
                    const speedMulti = (feverActive && activeFeverEffect === 'maimai') ? (isLove ? 2 : 1.3) : 1;
                    item.sellTimer += deltaTime * speedMulti;
                    
                    const actualTimeMax = Math.max(0.5, item.baseTimeMax * (1 - timeReduction));
                    
                    const progressEl = document.getElementById(`progress-${item.id}`);
                    if(progressEl) {
                        const percent = (item.sellTimer / actualTimeMax) * 100;
                        progressEl.style.width = `${Math.min(percent, 100)}%`;
                    }

                    if (item.sellTimer >= actualTimeMax) {
                        item.stock--;
                        const finalPrice = Math.floor(item.sellPrice * (1 + visualBonus) * queenMulti);
                        money += finalPrice;
                        gameStats.totalMoneyEarned += finalPrice;
                        gameStats.totalGoodsSold++;
                        item.sellTimer = 0; 
                        
                        let finalDropRate = Math.min(0.95, item.dropRate + talkBonus);
                        let dropCount = 1;
                        if(feverActive && activeFeverEffect === 'sickle') {
                            finalDropRate = 1.0; 
                            if(isLove) dropCount = 2;
                        }

                        if (Math.random() < finalDropRate) {
                            for(let d = 0; d < dropCount; d++) {
                                // Rarity Check
                                const rRand = Math.random();
                                let rarity = 1; 
                                if (rRand < 0.005) rarity = 3; // 0.5%
                                else if (rRand < 0.055) rarity = 2; // 5%

                                const types = ['vocal', 'dance', 'talk', 'visual', 'stamina'];
                                const statType = types[Math.floor(Math.random() * types.length)];
                                const dropped = statType + '_' + rarity;
                                
                                inventory[dropped]++;
                                gameStats.totalItemsDropped++;
                                
                                if (autoItemMode) applyItemToRandomIdol(dropped);
                            }
                            
                            renderItems();
                            if(document.getElementById('items-tab').classList.contains('hidden')){
                                document.getElementById('item-badge').classList.remove('hidden');
                            }
                        }
                        
                        const stockEl = document.getElementById(`stock-${item.id}`);
                        stockEl.classList.add('text-indigo-400', 'scale-125');
                        setTimeout(() => stockEl.classList.remove('text-indigo-400', 'scale-125'), 300);
                        if(progressEl) progressEl.style.width = '0%';
                    }
                } else {
                    item.sellTimer = 0;
                    const progressEl = document.getElementById(`progress-${item.id}`);
                    if(progressEl) progressEl.style.width = '0%';
                }
            });

            if (currentTime - lastUIUpdate >= 100) { updateUI(); updateDashboard(); lastUIUpdate = currentTime; }
            requestAnimationFrame(gameLoop);
        }

        window.onload = () => {
            loadGame();
            updateTeamStats(); 
            renderIdols();
            renderGoods();
            renderItems();
            initDashboard(); updateUI();
            requestAnimationFrame(gameLoop);
        };
