require('dotenv').config();
const {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, EmbedBuilder,
  MessageFlags, REST, Routes, SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ─── Client Discord ────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ══════════════════════════════════════════════════════════════════════════════
//  STOCKAGE JSON (fichier local)
//
//  Par défaut les résultats sont dans /app/resultats_qcm.json
//
//  Pour garder les données ENTRE les déploiements :
//    → Railway : Settings → Volumes → Mount Path : /data
//    → Le bot détecte /data automatiquement et l'utilise
// ══════════════════════════════════════════════════════════════════════════════

const DATA_DIR  = fs.existsSync('/data') ? '/data' : '/app';
const DATA_FILE = `${DATA_DIR}/resultats_qcm.json`;

function loadResults() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) { console.error('⚠️  Lecture résultats :', err.message); }
  return {};
}

function saveResults(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }
  catch (err) { console.error('⚠️  Écriture résultats :', err.message); }
}

async function appendResult(userId, username, leconId, score, total, erreurs) {
  const data = loadResults();
  if (!data[userId]) data[userId] = { username, sessions: [] };
  data[userId].username = username;
  data[userId].sessions.push({
    lecon: leconId,
    date:  new Date().toLocaleString('fr-FR'),
    score, total, pct: Math.round(score / total * 100), erreurs,
  });
  saveResults(data);
}

async function readAllResults(leconFilter = '') {
  const data   = loadResults();
  const result = {};
  for (const [uid, info] of Object.entries(data)) {
    const sessions = leconFilter ? info.sessions.filter(s => s.lecon === leconFilter) : info.sessions;
    if (sessions.length) result[uid] = { username: info.username, sessions };
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
//  QCM — LEÇONS
//
//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║  COMMENT AJOUTER UNE NOUVELLE LEÇON (3 étapes)                      ║
//  ║                                                                       ║
//  ║  1. AJOUTER le bloc ici dans LECONS :                                ║
//  ║       lecon2: {                                                       ║
//  ║         titre: 'Leçon 2 — ...',                                      ║
//  ║         questions: [                                                  ║
//  ║           {                                                           ║
//  ║             enonce:      'Question (**mot** en gras) ?',             ║
//  ║             options:     [['الخيار أ'], ['الخيار ب'], ['الخيار ج']], ║
//  ║             reponse:     0,   ← 0=A  1=B  2=C                       ║
//  ║             explication: 'Explication courte ✅',                    ║
//  ║           },                                                          ║
//  ║         ],                                                            ║
//  ║       },                                                              ║
//  ║                                                                       ║
//  ║  2. AJOUTER dans LECON_CHOICES (~ligne 200) :                        ║
//  ║       { name: 'Leçon 2 — ...', value: 'lecon2' },                   ║
//  ║                                                                       ║
//  ║  3. PUSH sur GitHub → Railway redéploie ✅                           ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

const LECONS = {

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 1 — أسماء الإشارة  (Pronoms démonstratifs)
  // ─────────────────────────────────────────────────────────────────
  lecon1: {
    titre: 'Leçon 1 — أسماء الإشارة',
    questions: [
      {
        enonce:      'Quel pronom utilises-tu pour **طَالِبٌ** (étudiant — proche) ?',
        options:     [['هَذَا'], ['ذَلِكَ'], ['هَذِهِ']],
        reponse:     0,
        explication: '**هَذَا** = مفرد مذكر للقريب — singulier masculin proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **قَلَمٌ** (stylo — loin) ?',
        options:     [['هَذَا'], ['ذَلِكَ'], ['هَؤُلَاءِ']],
        reponse:     1,
        explication: '**ذَلِكَ** = مفرد مذكر للبعيد — singulier masculin loin ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **مَدْرَسَةٌ** (école — proche) ?',
        options:     [['هَذَا'], ['هَذِهِ'], ['تِلْكَ']],
        reponse:     1,
        explication: '**هَذِهِ** = مفرد مؤنث للقريب — singulier féminin proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **حَقِيبَةٌ** (sac — loin) ?',
        options:     [['هَذِهِ'], ['ذَلِكَ'], ['تِلْكَ']],
        reponse:     2,
        explication: '**تِلْكَ** = مفرد مؤنث للبعيد — singulier féminin loin ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **كُتُبٌ** (livres — proche) ? ⚠️ Objets !',
        options:     [['هَؤُلَاءِ'], ['هَذِهِ'], ['هَذَا']],
        reponse:     1,
        explication: '**هَذِهِ** = جمع غير عاقل — pluriel non-humain, toujours هَذِهِ pour les objets ! ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **طَالِبَانِ** (deux étudiants — proche) ?',
        options:     [['هَذَانِ'], ['ذَانِكَ'], ['هَؤُلَاءِ']],
        reponse:     0,
        explication: '**هَذَانِ** = مثنى مذكر للقريب — duel masculin proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **بِنْتَانِ** (deux filles — loin) ?',
        options:     [['هَاتَانِ'], ['تَانِكَ'], ['ذَانِكَ']],
        reponse:     1,
        explication: '**تَانِكَ** = مثنى مؤنث للبعيد — duel féminin loin ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **طُلَّابٌ** (étudiants — proche) ? ⚠️ Humains !',
        options:     [['هَذِهِ'], ['أُولَئِكَ'], ['هَؤُلَاءِ']],
        reponse:     2,
        explication: '**هَؤُلَاءِ** = جمع عاقل للقريب — pluriel humain proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **طَالِبَاتٌ** (étudiantes — loin) ? ⚠️ Humaines !',
        options:     [['هَؤُلَاءِ'], ['أُولَئِكَ'], ['تِلْكَ']],
        reponse:     1,
        explication: '**أُولَئِكَ** = جمع عاقل للبعيد — pluriel humain loin ✅',
      },
      {
        enonce:      'Au pluriel, les **objets** utilisent **هَؤُلَاءِ** — vrai ou faux ?',
        options:     [['❌ فَاسِدٌ'], ['✅ صَحِيحٌ'], ['أَحْيَانًا']],
        reponse:     0,
        explication: '**فَاسِدٌ (FAUX)** ! Objets au pluriel → toujours **هَذِهِ**. هَؤُلَاءِ = humains seulement ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 2 — أدوات الاستفهام  (Mots interrogatifs)
  // ─────────────────────────────────────────────────────────────────
  lecon2: {
    titre: 'Leçon 2 — أدوات الاستفهام',
    questions: [
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **qui** (une personne) ?',
        options:     [['مَا'], ['مَنْ'], ['أَيْنَ']],
        reponse:     1,
        explication: '**مَنْ** = qui (pour les personnes) ✅  Exemple : مَنْ هُوَ؟ — Qui est-il ?',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **quoi / qu\'est-ce que** (un objet) ?',
        options:     [['مَنْ'], ['مَا'], ['كَيْفَ']],
        reponse:     1,
        explication: '**مَا** = quoi / qu\'est-ce que (pour les choses) ✅  Exemple : مَا هَذَا؟',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **où** ?',
        options:     [['مَتَى'], ['أَيْنَ'], ['كَمْ']],
        reponse:     1,
        explication: '**أَيْنَ** = où ✅  Exemple : أَيْنَ سُفْيَانُ؟ — Où est Sufyân ?',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **quand** ?',
        options:     [['أَيْنَ'], ['لِمَاذَا'], ['مَتَى']],
        reponse:     2,
        explication: '**مَتَى** = quand ✅  Exemple : مَتَى تَرْجِعُ؟ — Quand reviens-tu ?',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **combien** (nombre) ?',
        options:     [['بِكَمْ'], ['كَمْ'], ['هَلْ']],
        reponse:     1,
        explication: '**كَمْ** = combien (quantité) ✅  Exemple : كَمْ دَرْسًا دَرَسْتَ؟',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **combien ça coûte** (prix) ?',
        options:     [['كَمْ'], ['بِكَمْ'], ['مَاذَا']],
        reponse:     1,
        explication: '**بِكَمْ** = combien (prix) ✅  Exemple : بِكَمْ هَذَا؟ — C\'est à combien ?',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **pourquoi** ?',
        options:     [['مَاذَا'], ['لِمَاذَا'], ['هَلْ']],
        reponse:     1,
        explication: '**لِمَاذَا** = pourquoi ✅  Exemple : لِمَاذَا فَعَلْتَ هَذَا؟',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour poser une **question oui/non** ?',
        options:     [['هَلْ  /  أَ'], ['مَنْ'], ['كَيْفَ']],
        reponse:     0,
        explication: '**هَلْ** et **أَ** = questions oui/non ✅  Exemples : هَلْ تَعْرِفُ هَذَا؟  /  أَهُوَ مُسْلِمٌ؟',
      },
      {
        enonce:      'Quel mot interrogatif utilises-tu pour demander **comment** ?',
        options:     [['مَتَى'], ['أَيْنَ'], ['كَيْفَ']],
        reponse:     2,
        explication: '**كَيْفَ** = comment ✅  Exemple : كَيْفَ حَالُكَ؟ — Comment vas-tu ?',
      },
      {
        enonce:      'Quelle est la différence entre **مَا** et **مَاذَا** ?',
        options:     [['مَا = quoi  /  مَاذَا = que (+ verbe)'], ['Aucune différence'], ['مَا = où  /  مَاذَا = quand']],
        reponse:     0,
        explication: '**مَا هَذَا؟** (Qu\'est-ce que c\'est ?) vs **مَاذَا تَفْعَلُ؟** (Que fais-tu ?) ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 3 — الممنوع من الصرف  (Diptotes)
  // ─────────────────────────────────────────────────────────────────
  lecon3: {
    titre: 'Leçon 3 — الممنوع من الصرف',
    questions: [
      {
        enonce:      'Le mot **مَدَارِسُ** (écoles) prend-il le tanwīn ?',
        options:     [['❌ لَا — c\'est un diptote (صيغة منتهى الجموع)'], ['✅ نَعَمْ'], ['Seulement au nominatif']],
        reponse:     0,
        explication: '**مَدَارِسُ** est sur le schème صيغة منتهى الجموع → ممنوع من الصرف → pas de tanwīn ✅',
      },
      {
        enonce:      'Parmi ces prénoms, lequel est **ممنوع من الصرف** (diptote) ?',
        options:     [['مُحَمَّدٌ'], ['فَاطِمَةُ'], ['إِبْرَاهِيمُ']],
        reponse:     2,
        explication: '**إِبْرَاهِيمُ** est diptote car c\'est un prénom non-arabe (أعجمي) ✅',
      },
      {
        enonce:      'Pourquoi **فَاطِمَةُ** est-il ممنوع من الصرف ?',
        options:     [['C\'est un prénom étranger'], ['C\'est un prénom féminin (علم مؤنث)'], ['C\'est un pluriel brisé']],
        reponse:     1,
        explication: '**فَاطِمَةُ** = علم مؤنث (prénom féminin) → ممنوع من الصرف ✅',
      },
      {
        enonce:      'Le mot **أَحْمَرُ** (rouge) est diptote car il est sur le schème ?',
        options:     [['فَعْلَانُ'], ['أَفْعَلُ'], ['فَعِيلٌ']],
        reponse:     1,
        explication: '**أَفْعَلُ** = schème des couleurs et défauts → ممنوع من الصرف ✅  (أَحْمَرُ، أَخْضَرُ، أَزْرَقُ…)',
      },
      {
        enonce:      'Le mot **عَطْشَانُ** (assoiffé) est diptote car il est sur le schème ?',
        options:     [['أَفْعَلُ'], ['فَعْلَانُ'], ['فُعَلَاءُ']],
        reponse:     1,
        explication: '**فَعْلَانُ** = schème des adjectifs d\'état → ممنوع من الصرف ✅  (عَطْشَانُ، جَوْعَانُ، كَسْلَانُ…)',
      },
      {
        enonce:      'Parmi ces mots, lequel prend normalement le tanwīn (n\'est PAS diptote) ?',
        options:     [['أَطِبَّاءُ'], ['كِتَابٌ'], ['مَسَاجِدُ']],
        reponse:     1,
        explication: '**كِتَابٌ** = mot ordinaire → prend le tanwīn ✅  Les deux autres sont des diptotes.',
      },
      {
        enonce:      'Le mot **أَصْدِقَاءُ** (amis) est diptote à cause de ?',
        options:     [['La hamza du madūd (همزة الممدود الزائدة)'], ['C\'est un prénom'], ['C\'est sur le schème أَفْعَلُ']],
        reponse:     0,
        explication: '**أَصْدِقَاءُ** = همزة الممدود الزائدة → ممنوع من الصرف ✅  (أَغْنِيَاءُ، أَقْوِيَاءُ…)',
      },
      {
        enonce:      'Comment reconnaît-on la **صيغة منتهى الجموع** (pluriel brisé diptote) ?',
        options:     [['Pluriel brisé avec alif + 2 ou 3 lettres après'], ['Mot se terminant par ة'], ['Tout pluriel masculin']],
        reponse:     0,
        explication: 'Tout pluriel brisé contenant une alif avec 2 ou 3 lettres après elle → ممنوع ✅  (مَدَارِسُ، مَسَاجِدُ، مَكَاتِبُ…)',
      },
      {
        enonce:      'Un mot ممنوع من الصرف prend la kasra au génitif — vrai ou faux ?',
        options:     [['❌ فَاسِدٌ — il prend la فتحة au génitif'], ['✅ صَحِيحٌ'], ['Seulement avec أل']],
        reponse:     0,
        explication: '**FAUX** ! Sans أل, le ممنوع من الصرف prend la **فتحة** aux cas génitif ET accusatif, jamais la kasra ✅',
      },
      {
        enonce:      'Avec l\'article **أل** ou en état construit (إضافة), le diptote reprend le tanwīn ?',
        options:     [['❌ Non, il reprend les voyelles normales mais toujours sans tanwīn'], ['✅ Oui, il reprend tout'], ['Seulement le tanwīn kasra']],
        reponse:     0,
        explication: 'Avec أل ou en إضافة → le diptote se comporte **normalement** (kasra au génitif) mais toujours sans tanwīn ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 4 — الجملة الاسمية  (Phrase nominale)
  // ─────────────────────────────────────────────────────────────────
  lecon4: {
    titre: 'Leçon 4 — الجملة الاسمية',
    questions: [
      {
        enonce:      'La phrase nominale (جملة اسمية) est composée de ?',
        options:     [['مبتدأ + خبر'], ['فعل + فاعل'], ['حرف + اسم']],
        reponse:     0,
        explication: '**مبتدأ** (sujet) + **خبر** (prédicat) = الجملة الاسمية ✅',
      },
      {
        enonce:      'Dans **الكِتَابُ جَدِيدٌ**, quel est le خبر ?',
        options:     [['الكِتَابُ'], ['جَدِيدٌ'], ['Les deux']],
        reponse:     1,
        explication: '**جَدِيدٌ** = خبر مفرد (prédicat simple) ✅  الكتابُ = مبتدأ',
      },
      {
        enonce:      'Dans **الكِتَابُ لَوْنُهُ أَزْرَقُ**, le خبر est ?',
        options:     [['خبر مفرد'], ['خبر جملة اسمية'], ['خبر شبه جملة']],
        reponse:     1,
        explication: '**لَوْنُهُ أَزْرَقُ** = خبر جملة اسمية (le prédicat est lui-même une phrase nominale) ✅',
      },
      {
        enonce:      'Dans **زَيْدٌ فِي الْبَيْتِ**, le خبر est ?',
        options:     [['خبر مفرد'], ['خبر جملة فعلية'], ['خبر شبه جملة — جار ومجرور']],
        reponse:     2,
        explication: '**فِي الْبَيْتِ** = جار ومجرور → خبر شبه جملة ✅',
      },
      {
        enonce:      'Dans **الكِتَابُ فَوْقَ الْمَكْتَبِ**, le خبر est ?',
        options:     [['خبر شبه جملة — ظرف ومضاف إليه'], ['خبر مفرد'], ['خبر جملة فعلية']],
        reponse:     0,
        explication: '**فَوْقَ الْمَكْتَبِ** = ظرف مكان → خبر شبه جملة (ظرف ومضاف إليه) ✅',
      },
      {
        enonce:      'Parmi les حروف الجر, lequel n\'en fait PAS partie ?',
        options:     [['فِي'], ['إِلَى'], ['فَوْقَ']],
        reponse:     2,
        explication: '**فَوْقَ** est un ظرف (adverbe de lieu), pas un حرف جر. Les حروف الجر : في / إلى / مِنْ / عَلَى ✅',
      },
      {
        enonce:      'Parmi les ظروف, lequel n\'en fait PAS partie ?',
        options:     [['قَبْلَ'], ['مِنْ'], ['بَعْدَ']],
        reponse:     1,
        explication: '**مِنْ** est un حرف جر. Les ظروف : قَبْلَ / بَعْدَ / فَوْقَ / تَحْتَ ✅',
      },
      {
        enonce:      'Dans **الطَّالِبُ كَتَبَ الدَّرْسَ**, le خبر est ?',
        options:     [['خبر مفرد'], ['خبر جملة فعلية'], ['خبر شبه جملة']],
        reponse:     1,
        explication: '**كَتَبَ الدَّرْسَ** = جملة فعلية → خبر جملة فعلية ✅',
      },
      {
        enonce:      'Le مبتدأ est toujours au cas ?',
        options:     [['النصب (accusatif)'], ['الرفع (nominatif)'], ['الجر (génitif)']],
        reponse:     1,
        explication: 'Le **مبتدأ** est toujours **مرفوع** (nominatif) ✅  Même chose pour le خبر مفرد.',
      },
      {
        enonce:      'Combien de types de خبر existent dans le cours ?',
        options:     [['2'], ['3'], ['5']],
        reponse:     2,
        explication: 'Il y a **5** types de خبر : ① مفرد ② جملة اسمية ③ جملة فعلية ④ جار ومجرور ⑤ ظرف ومضاف إليه ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 5 — الأسماء الموصولة  (Pronoms relatifs)
  // ─────────────────────────────────────────────────────────────────
  lecon5: {
    titre: 'Leçon 5 — الأسماء الموصولة',
    questions: [
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **singulier masculin** ?',
        options:     [['الَّتِي'], ['الَّذِي'], ['الَّذِينَ']],
        reponse:     1,
        explication: '**الَّذِي** = singulier masculin (doué de raison OU non) ✅  Ex : الطَّالِبُ الَّذِي…',
      },
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **singulier féminin** ?',
        options:     [['الَّذِي'], ['اللَّتَانِ'], ['الَّتِي']],
        reponse:     2,
        explication: '**الَّتِي** = singulier féminin ✅  Ex : الْبِنْتُ الَّتِي… / الْقِصَّةُ الَّتِي…',
      },
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **pluriel non-humain** (objets, animaux) ?',
        options:     [['الَّذِينَ'], ['الَّتِي'], ['اللَّاتِي']],
        reponse:     1,
        explication: '**الَّتِي** = aussi pour le pluriel non-humain ! Même forme qu\'au singulier féminin ✅',
      },
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **duel masculin** ?',
        options:     [['اللَّذَانِ'], ['اللَّتَانِ'], ['الَّذِينَ']],
        reponse:     0,
        explication: '**اللَّذَانِ** = duel masculin ✅  Ex : الطَّالِبَانِ اللَّذَانِ…',
      },
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **duel féminin** ?',
        options:     [['اللَّذَانِ'], ['اللَّتَانِ'], ['اللَّاتِي']],
        reponse:     1,
        explication: '**اللَّتَانِ** = duel féminin ✅  Ex : الْبِنْتَانِ اللَّتَانِ…',
      },
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **pluriel masculin humain** ?',
        options:     [['الَّتِي'], ['اللَّاتِي'], ['الَّذِينَ']],
        reponse:     2,
        explication: '**الَّذِينَ** = pluriel masculin humain ✅  Ex : الطُّلَّابُ الَّذِينَ…',
      },
      {
        enonce:      'Quel pronom relatif utilises-tu pour un **pluriel féminin** (humaines ou objets féminins) ?',
        options:     [['الَّذِينَ'], ['اللَّاتِي  /  اللَّائِي'], ['اللَّذَانِ']],
        reponse:     1,
        explication: '**اللَّاتِي** ou **اللَّائِي** = pluriel féminin ✅  Ex : الطَّالِبَاتُ اللَّاتِي…',
      },
      {
        enonce:      'Le pronom relatif s\'accorde avec ?',
        options:     [['Le verbe qui suit'], ['Le nom qu\'il qualifie (nombre et genre)'], ['Le sujet de la phrase']],
        reponse:     1,
        explication: 'Le اسم موصول s\'accorde en **nombre et genre** avec le nom qu\'il qualifie (المنعوت) ✅',
      },
      {
        enonce:      'Complète : **الطَّائِرَاتُ _____ طَارَتْ** (les avions qui ont volé)',
        options:     [['الَّذِينَ'], ['الَّتِي'], ['اللَّذَانِ']],
        reponse:     1,
        explication: '**الَّتِي** — طائرات = pluriel non-humain → même règle que singulier féminin ✅',
      },
      {
        enonce:      'La phrase relative qui suit le اسم موصول s\'appelle ?',
        options:     [['الصِّلَة'], ['الْخَبَر'], ['الْمُبْتَدَأ']],
        reponse:     0,
        explication: '**الصِّلَة** = la proposition relative qui suit le pronom ✅  Elle doit contenir un pronom de rappel (العائد).',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 6 — الضمائر  (Pronoms personnels)
  // ─────────────────────────────────────────────────────────────────
  lecon6: {
    titre: 'Leçon 6 — الضمائر',
    questions: [
      {
        enonce:      'Quel est le pronom détaché pour **"je"** ?',
        options:     [['نَحْنُ'], ['أَنَا'], ['هُوَ']],
        reponse:     1,
        explication: '**أَنَا** = je ✅  Ex : أَنَا دَرَسْتُ',
      },
      {
        enonce:      'Quel est le pronom détaché pour **"nous"** ?',
        options:     [['أَنْتُمْ'], ['نَحْنُ'], ['هُمْ']],
        reponse:     1,
        explication: '**نَحْنُ** = nous ✅  Ex : نَحْنُ دَرَسْنَا',
      },
      {
        enonce:      'Quel est le pronom détaché pour **"tu"** (masculin) ?',
        options:     [['أَنْتِ'], ['أَنْتُمَا'], ['أَنْتَ']],
        reponse:     2,
        explication: '**أَنْتَ** = tu (masculin) ✅  — **أَنْتِ** = tu (féminin)',
      },
      {
        enonce:      'Quel est le pronom détaché pour **"vous deux"** (duel) ?',
        options:     [['أَنْتُمْ'], ['أَنْتُمَا'], ['أَنْتُنَّ']],
        reponse:     1,
        explication: '**أَنْتُمَا** = vous deux (duel, masc. ou fém.) ✅  Ex : أَنْتُمَا دَرَسْتُمَا',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **"elles"** (pluriel féminin) ?',
        options:     [['هُمْ'], ['هُوَ'], ['هُنَّ']],
        reponse:     2,
        explication: '**هُنَّ** = elles ✅  — هُمْ = ils — هُوَ = il — هِيَ = elle',
      },
      {
        enonce:      'Dans **قَلَمِي** (mon stylo), quel est le pronom attaché ?',
        options:     [['كَ'], ['ي'], ['هُ']],
        reponse:     1,
        explication: '**ي** = pronom de 1ère personne singulier (mon/ma/mes) ✅  Ex : كِتَابِي، قَلَمِي',
      },
      {
        enonce:      'Dans **قَلَمُكَ** (ton stylo — masc.), quel est le pronom attaché ?',
        options:     [['كَ'], ['كِ'], ['هُ']],
        reponse:     0,
        explication: '**كَ** = ton/ta (masculin) ✅  — **كِ** = ton/ta (féminin)',
      },
      {
        enonce:      'Dans **قَلَمُهُ** (son stylo — à lui), quel est le pronom attaché ?',
        options:     [['هَا'], ['هُ'], ['هُمَا']],
        reponse:     1,
        explication: '**هُ** = son (à lui) ✅  — **هَا** = son (à elle)',
      },
      {
        enonce:      'Dans **فِيكَ** (en toi — masc.), quelle est la préposition utilisée ?',
        options:     [['مِنْ'], ['إِلَى'], ['فِي']],
        reponse:     2,
        explication: '**فِي** = dans/en ✅  Le pronom كَ se fixe après : فِيكَ, فِيكِ, فِيهِ, فِيهَا…',
      },
      {
        enonce:      'Combien de pronoms détachés (ضمائر منفصلة) y a-t-il dans le tableau de la leçon ?',
        options:     [['10'], ['12'], ['13']],
        reponse:     2,
        explication: '**13** pronoms : أنا / نحن / أنتَ / أنتِ / أنتما / أنتم / أنتنَّ / هو / هي / هما / هما / هم / هنَّ ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 7 — بعض الدروس  (Lettres lunaires/solaires + Défini/Indéfini + Vocatif)
  // ─────────────────────────────────────────────────────────────────
  lecon7: {
    titre: 'Leçon 7 — الحروف القمرية والشمسية / النكرة والمعرفة / المنادى',
    questions: [
      {
        enonce:      'Avec **أل** + lettre **قمرية**, le ل se prononce ?',
        options:     [['Il s\'assimile à la lettre suivante'], ['Il se prononce normalement (لْ)'], ['Il disparaît']],
        reponse:     1,
        explication: 'Lettre قمرية → **أل** se prononce normalement : اَلْبَابُ, اَلْقَمَرُ, اَلْكِتَابُ ✅',
      },
      {
        enonce:      'Avec **أل** + lettre **شمسية**, le ل se prononce ?',
        options:     [['Normalement'], ['Il s\'assimile (shadda sur la lettre suivante)'], ['Il disparaît complètement']],
        reponse:     1,
        explication: 'Lettre شمسية → le ل s\'assimile : اَلشَّمْسُ (al-shams → ash-shams) ✅',
      },
      {
        enonce:      'La lettre **ب** est-elle قمرية ou شمسية ?',
        options:     [['شمسية'], ['قمرية'], ['Les deux selon le mot']],
        reponse:     1,
        explication: '**ب** est قمرية ✅  → اَلْبَابُ (le ل se prononce)',
      },
      {
        enonce:      'La lettre **شـ** est-elle قمرية ou شمسية ?',
        options:     [['قمرية'], ['شمسية'], ['Ni l\'un ni l\'autre']],
        reponse:     1,
        explication: '**شـ** est شمسية ✅  → اَلشَّمْسُ (le ل s\'assimile)',
      },
      {
        enonce:      'Le mot **بَيْتٌ** (sans أل) est ?',
        options:     [['مَعْرِفَة (défini)'], ['نَكِرَة (indéfini)'], ['Les deux']],
        reponse:     1,
        explication: '**بَيْتٌ** avec tanwīn = **نكرة** (indéfini) ✅  → اَلْبَيْتُ = معرفة (défini)',
      },
      {
        enonce:      'Le mot **بَيْتُ الطَّالِبِ** (la maison de l\'étudiant) est ?',
        options:     [['نكرة'], ['معرفة بالإضافة'], ['معرفة بأل']],
        reponse:     1,
        explication: '**بَيْتُ الطَّالِبِ** = **معرفة بالإضافة** (défini par annexion) ✅',
      },
      {
        enonce:      'Pour appeler quelqu\'un par son prénom (يا + علم مفرد), la voyelle finale est ?',
        options:     [['كَسْرَة (ِ)'], ['فَتْحَة (َ)'], ['ضَمَّة (ُ)']],
        reponse:     2,
        explication: '**يَا زَيْدُ** — le منادى علم مفرد est **مبني على الضم** ✅  Idem pour les prénoms féminins : يَا فَاطِمَةُ',
      },
      {
        enonce:      'Pour appeler quelqu\'un par sa fonction (يَا + نكرة مقصودة), la voyelle finale est ?',
        options:     [['ضَمَّة'], ['فَتْحَة'], ['كَسْرَة']],
        reponse:     0,
        explication: '**يَا أُسْتَاذُ** — النكرة المقصودة est aussi **مبنية على الضم** ✅  (يَا أُسْتَاذَةُ pour le féminin)',
      },
      {
        enonce:      'Combien y a-t-il de lettres **قمرية** ?',
        options:     [['12'], ['14'], ['16']],
        reponse:     1,
        explication: 'Il y a **14 lettres قمرية** : أ ب ج ح خ ع غ ف ق ك م ه و ي ✅',
      },
      {
        enonce:      'Combien y a-t-il de lettres **شمسية** ?',
        options:     [['12'], ['14'], ['10']],
        reponse:     1,
        explication: 'Il y a **14 lettres شمسية** : ت ث د ذ ر ز س ش ص ض ط ظ ل ن ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 8 — النعت والمنعوت + العدد  (Adjectif qualificatif + Nombres 3-10)
  // ─────────────────────────────────────────────────────────────────
  lecon8: {
    titre: 'Leçon 8 — النعت والمنعوت / العدد',
    questions: [
      {
        enonce:      'Dans **جَاءَ الطَّالِبُ الْمُجْتَهِدُ**, quel est le نعت (adjectif) ?',
        options:     [['الطَّالِبُ'], ['الْمُجْتَهِدُ'], ['جَاءَ']],
        reponse:     1,
        explication: '**الْمُجْتَهِدُ** = le نعت (adjectif épithète) ✅  الطَّالِبُ = المنعوت (nom qualifié)',
      },
      {
        enonce:      'Le نعت s\'accorde avec le منعوت en ?',
        options:     [['Genre et nombre uniquement'], ['Genre, nombre, cas et définitude'], ['Cas uniquement']],
        reponse:     1,
        explication: 'Le **نعت** s\'accorde en **genre + nombre + cas + définitude** avec le منعوت ✅',
      },
      {
        enonce:      'Dans **رَأَيْتُ الطَّالِبَةَ الْمُجْتَهِدَةَ**, pourquoi le نعت est au féminin ?',
        options:     [['Le verbe رَأَيْتُ l\'exige'], ['Il s\'accorde avec الطَّالِبَة (féminin)'], ['C\'est toujours au féminin']],
        reponse:     1,
        explication: '**الْمُجْتَهِدَةَ** = féminin car الطَّالِبَة est féminin → accord obligatoire ✅',
      },
      {
        enonce:      'Pour les nombres **3 à 10**, le nombre est du genre **opposé** au compté — vrai ou faux ?',
        options:     [['✅ صَحِيحٌ — le nombre contredit le compté'], ['❌ فَاسِدٌ — même genre'], ['Seulement pour 3 et 4']],
        reponse:     0,
        explication: '**VRAI** ! 3 filles = **ثَلَاثَةُ** بَنَاتٍ (ثلاثة masc. + بنات fém.) → inversion systématique 3-10 ✅',
      },
      {
        enonce:      'Comment dit-on **"trois étudiants"** ?',
        options:     [['ثَلَاثُ طُلَّابٍ'], ['ثَلَاثَةُ طُلَّابٍ'], ['ثَلَاثَةٌ طُلَّاب']],
        reponse:     1,
        explication: '**ثَلَاثَةُ طُلَّابٍ** : طلاب est masculin → on utilise ثَلَاثَة (féminin) par inversion + الإضافة ✅',
      },
      {
        enonce:      'Comment dit-on **"quatre étudiantes"** ?',
        options:     [['أَرْبَعَةُ طَالِبَاتٍ'], ['أَرْبَعُ طَالِبَاتٍ'], ['أَرْبَعٌ طَالِبَاتٌ']],
        reponse:     1,
        explication: '**أَرْبَعُ طَالِبَاتٍ** : طالبات est féminin → on utilise أَرْبَع (masculin, sans ة) par inversion ✅',
      },
      {
        enonce:      'Le compté (المعدود) avec les nombres 3-10 est toujours au ?',
        options:     [['Singulier مرفوع'], ['Pluriel مجرور (مضاف إليه)'], ['Duel مرفوع']],
        reponse:     1,
        explication: 'Le المعدود est au **جمع مجرور** (pluriel génitif) car il est مضاف إليه ✅  Ex : ثَلَاثَةُ **طُلَّابٍ**',
      },
      {
        enonce:      'Dans **سَلَّمْتُ عَلَى الطَّالِبَاتِ الْمُجْتَهِدَاتِ**, le نعت est au cas ?',
        options:     [['مرفوع (nominatif)'], ['مجرور (génitif)'], ['منصوب (accusatif)']],
        reponse:     1,
        explication: '**الْمُجْتَهِدَاتِ** = مجرور car الطَّالِبَاتِ est مجرور (après عَلَى) → accord du cas ✅',
      },
      {
        enonce:      'Le نعت doit-il suivre immédiatement le منعوت ?',
        options:     [['Oui, toujours'], ['Non, d\'autres éléments peuvent s\'intercaler'], ['Seulement en phrase nominale']],
        reponse:     0,
        explication: 'Le **نعت** suit directement le **منعوت** ✅  Il vient toujours juste après le nom qu\'il qualifie.',
      },
      {
        enonce:      'Quel est le pluriel de **مُجْتَهِدٌ** (masculin) utilisé en النعت ?',
        options:     [['مُجْتَهِدَاتٌ'], ['مُجْتَهِدُونَ'], ['مُجْتَهِدَةٌ']],
        reponse:     1,
        explication: '**مُجْتَهِدُونَ** = pluriel masculin de مُجْتَهِدٌ ✅  — مُجْتَهِدَاتٌ = pluriel féminin',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 9 — بعض القواعد  (Règles diverses)
  // ─────────────────────────────────────────────────────────────────
  lecon9: {
    titre: 'Leçon 9 — بعض القواعد',
    questions: [
      {
        enonce:      'Pour former le **duel** d\'un nom masculin singulier, on ajoute ?',
        options:     [['وْنَ'], ['اَنِ / يْنِ'], ['اَتٌ']],
        reponse:     1,
        explication: '**اَنِ** au nominatif / **يْنِ** aux autres cas ✅  Ex : طَالِبٌ → طَالِبَانِ / طَالِبَيْنِ',
      },
      {
        enonce:      'Pour former le **duel** d\'un nom féminin en ة, que devient la ة ?',
        options:     [['Elle reste ة'], ['Elle devient ت'], ['Elle disparaît']],
        reponse:     1,
        explication: 'La **ة devient ت** avant la désinence du duel ✅  Ex : طَالِبَةٌ → طَالِبَتَانِ',
      },
      {
        enonce:      'Dans **جَاءَ هَذَا الطَّالِبُ**, pourquoi الطَّالِبُ est-il **بدل** (apposition) ?',
        options:     [['Il est le sujet de جاء'], ['Il précise هذا qui y fait référence'], ['C\'est un adjectif']],
        reponse:     1,
        explication: 'الطَّالِبُ = **بدل** car il précise le pronom démonstratif هذا → الإشارة إلى المعرَّف ب(أل) ✅',
      },
      {
        enonce:      'Comment exprime-t-on **"j\'ai un livre"** en arabe ?',
        options:     [['أَنَا كِتَابٌ'], ['عِنْدِي كِتَابٌ'], ['لِي أَنَا كِتَابٌ']],
        reponse:     1,
        explication: '**عِنْدِي كِتَابٌ** = j\'ai un livre (possession physique) ✅  عند + pronom attaché',
      },
      {
        enonce:      'Quelle est la différence entre **عِنْدِي** et **لِي** ?',
        options:     [['Aucune différence'], ['عندي = j\'ai (proche, physique) / لي = j\'ai (appartenance générale)'], ['لي = verbe / عندي = nom']],
        reponse:     1,
        explication: '**عِنْدِي** = possession physique/proche ✅  **لِي** = appartenance (ex: لِي أَخٌ = j\'ai un frère)',
      },
      {
        enonce:      'Le tâ marbûta féminin **change le verbe** qui précède — vrai ou faux ?',
        options:     [['✅ نَعَمْ — le verbe prend تَأْنِيث'], ['❌ لَا — le verbe ne change pas'], ['Seulement au passé']],
        reponse:     0,
        explication: '**VRAI** ! Si le sujet est féminin → le verbe prend ـَتْ : كَتَبَتْ فَاطِمَةُ ✅  (تأنيث الفاعل)',
      },
      {
        enonce:      '**مَعَ** se construit avec ?',
        options:     [['Un pronom seul'], ['Un مضاف إليه (nom au génitif ou pronom attaché)'], ['Un verbe']],
        reponse:     1,
        explication: '**مَعَ** + مضاف إليه ✅  Ex : مَعَ الطَّالِبِ / مَعِي / مَعَكَ',
      },
      {
        enonce:      '**لِمَنْ** هَذَا الْكِتَابُ؟ — que signifie لِمَنْ ?',
        options:     [['Où est ?'], ['À qui est ?'], ['Comment ?']],
        reponse:     1,
        explication: '**لِمَنْ** = à qui ✅  لِ (préposition) + مَنْ (qui)',
      },
      {
        enonce:      '**أَيٌّ** se construit avec ?',
        options:     [['أَيٌّ + nom doué de raison seulement'], ['أَيٌّ + nom (doué ou non de raison)'], ['Toujours seul']],
        reponse:     1,
        explication: '**أَيٌّ** = lequel (masc.) / **أَيَّةٌ** = laquelle → s\'utilise avec doué ET non-doué de raison ✅',
      },
      {
        enonce:      'Pour dire **"avec qui"**, on utilise ?',
        options:     [['مَعَ أَيٍّ'], ['مَعَ مَنْ'], ['مَعَ مَا']],
        reponse:     1,
        explication: '**مَعَ مَنْ** = avec qui ✅  مَنْ = pour les personnes — مَا = pour les choses',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 10 — مراجعة كاملة  (Révision générale)
  // ─────────────────────────────────────────────────────────────────
  lecon10: {
    titre: 'Leçon 10 — مراجعة كاملة',
    questions: [
      {
        enonce:      'Quel pronom démonstratif pour **نَافِذَةٌ** (fenêtre — loin) ?',
        options:     [['هَذِهِ'], ['تِلْكَ'], ['ذَلِكَ']],
        reponse:     1,
        explication: '**تِلْكَ** = مفرد مؤنث للبعيد ✅  (Leçon 1)',
      },
      {
        enonce:      'Quel mot interrogatif pour demander le **prix** ?',
        options:     [['كَمْ'], ['بِكَمْ'], ['مَتَى']],
        reponse:     1,
        explication: '**بِكَمْ** = combien (prix) ✅  (Leçon 2)',
      },
      {
        enonce:      'Le mot **مَسَاجِدُ** (mosquées) prend-il le tanwīn ?',
        options:     [['✅ نَعَمْ'], ['❌ لَا — c\'est un diptote'], ['Seulement avec أل']],
        reponse:     1,
        explication: '**مَسَاجِدُ** = صيغة منتهى الجموع → ممنوع من الصرف → pas de tanwīn ✅  (Leçon 3)',
      },
      {
        enonce:      'Dans **الطَّالِبُ فِي الْفَصْلِ**, le خبر est de quel type ?',
        options:     [['خبر مفرد'], ['خبر شبه جملة — جار ومجرور'], ['خبر جملة فعلية']],
        reponse:     1,
        explication: '**فِي الْفَصْلِ** = جار ومجرور → خبر شبه جملة ✅  (Leçon 4)',
      },
      {
        enonce:      'Quel اسم موصول pour **الكُتُبُ** (pluriel non-humain) ?',
        options:     [['الَّذِينَ'], ['الَّتِي'], ['اللَّتَانِ']],
        reponse:     1,
        explication: '**الَّتِي** = aussi pour le pluriel non-humain, même forme que le singulier féminin ✅  (Leçon 5)',
      },
      {
        enonce:      'Dans **كِتَابُهَا** (son livre — à elle), quel est le pronom attaché ?',
        options:     [['هُ'], ['هَا'], ['هُمَا']],
        reponse:     1,
        explication: '**هَا** = pronom de 3ème personne féminin singulier attaché ✅  (Leçon 6)',
      },
      {
        enonce:      'La lettre **نـ** est-elle قمرية ou شمسية ?',
        options:     [['قمرية'], ['شمسية'], ['Cela dépend']],
        reponse:     1,
        explication: '**ن** est شمسية ✅  → اَلنَّجْمُ (le ل s\'assimile)  (Leçon 7)',
      },
      {
        enonce:      'Comment dit-on **"cinq livres"** ?',
        options:     [['خَمْسَةُ كُتُبٍ'], ['خَمْسُ كُتُبٍ'], ['خَمْسُونَ كِتَابٍ']],
        reponse:     0,
        explication: '**خَمْسَةُ كُتُبٍ** : كتب est masculin → on utilise خَمْسَة (féminin) par inversion ✅  (Leçon 8)',
      },
      {
        enonce:      'Comment dit-on **"j\'ai un frère"** (appartenance) ?',
        options:     [['عِنْدِي أَخٌ'], ['لِي أَخٌ'], ['أَنَا أَخٌ']],
        reponse:     1,
        explication: '**لِي أَخٌ** = j\'ai un frère (appartenance) ✅  عندي = possession physique/proche  (Leçon 9)',
      },
      {
        enonce:      'Forme le duel de **طَالِبَةٌ** :',
        options:     [['طَالِبَتَانِ'], ['طَالِبَتَيْنِ  (cas direct)'], ['Les deux selon le cas']],
        reponse:     2,
        explication: '**طَالِبَتَانِ** (nominatif) / **طَالِبَتَيْنِ** (accusatif/génitif) — les deux sont corrects selon le contexte ✅  (Leçon 9)',
      },
    ],
  },

};

// ── Liste pour les menus Discord (à copier aussi dans LECON_CHOICES) ──────────
const LECON_CHOICES = [
  { name: 'Leçon 1 — أسماء الإشارة',           value: 'lecon1'  },
  { name: 'Leçon 2 — أدوات الاستفهام',          value: 'lecon2'  },
  { name: 'Leçon 3 — الممنوع من الصرف',         value: 'lecon3'  },
  { name: 'Leçon 4 — الجملة الاسمية',           value: 'lecon4'  },
  { name: 'Leçon 5 — الأسماء الموصولة',         value: 'lecon5'  },
  { name: 'Leçon 6 — الضمائر',                  value: 'lecon6'  },
  { name: 'Leçon 7 — الحروف القمرية والشمسية',  value: 'lecon7'  },
  { name: 'Leçon 8 — النعت والمنعوت / العدد',   value: 'lecon8'  },
  { name: 'Leçon 9 — بعض القواعد',              value: 'lecon9'  },
  { name: 'Leçon 10 — مراجعة كاملة',            value: 'lecon10' },
];

// ─── Sessions QCM actives (mémoire) ──────────────────────────────────────────
// Structure : userId → { leconId, qIndex, score, erreurs }
const qcmSessions = new Map();

// ─── Nettoyage état QCM ───────────────────────────────────────────────────────
function clearQuizState(userId) {
  qcmSessions.delete(userId);
}

// ─── Helpers visuels ─────────────────────────────────────────────────────────

function scoreColor(pct) {
  if (pct >= 85) return 0x0E6655;
  if (pct >= 60) return 0x9A7D0A;
  return 0xB03A2E;
}
function scoreEmoji(pct) {
  if (pct === 100) return '🏆';
  if (pct >= 85)   return '🌟';
  if (pct >= 60)   return '📚';
  return '💪';
}

function buildQuestionEmbed(leconId, qIndex, lastFeedback) {
  const lecon = LECONS[leconId];
  const q     = lecon.questions[qIndex];
  const total = lecon.questions.length;
  const desc  = lastFeedback
    ? `${lastFeedback}\n\n━━━━━━━━━━━━━━━━━━\n\n${q.enonce}`
    : q.enonce;
  return new EmbedBuilder()
    .setTitle(`Question ${qIndex + 1} / ${total}`)
    .setDescription(desc)
    .setColor(0x1A5276)
    .setFooter({ text: lecon.titre });
}

function buildAnswerButtons(leconId, qIndex) {
  const q      = LECONS[leconId].questions[qIndex];
  const labels = ['🅐', '🅑', '🅒'];
  const row    = new ActionRowBuilder();
  q.options.forEach(([ar], i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`qcm_answer_${i}`)
        .setLabel(`${labels[i]}  ${ar}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  return row;
}

function buildQuitButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quit_quiz')
      .setLabel('❌  Quitter le quiz')
      .setStyle(ButtonStyle.Danger)
  );
}

// ─── Vérification rôle professeure ───────────────────────────────────────────

function isProfesseure(interaction) {
  return interaction.member?.roles.cache.some(r => r.name === 'professeure-tome1') ?? false;
}
async function rejectNotProfesseure(interaction) {
  await interaction.reply({
    content: '❌ Cette commande est réservée aux membres avec le rôle **professeure-tome1**.',
    flags: MessageFlags.Ephemeral,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  KHATMA — stockage mémoire (inchangé)
// ══════════════════════════════════════════════════════════════════════════════

const khatmas      = new Map();
const tempUserData = new Map();

function getKhatma(guildId) {
  if (!khatmas.has(guildId)) {
    khatmas.set(guildId, {
      participants: [], listeners: [],
      messageId: null, channelId: null,
      listeMessageId: null, listeChannelId: null,
    });
  }
  return khatmas.get(guildId);
}

const NIVEAU_LABEL = { fluide: 'Fluide', intermediaire: 'Intermédiaire', debutante: 'Débutante' };
function formatPages(p) { return (p === '1 ligne' || p === '1 verset') ? p : `${p} page(s)`; }

function buildListEmbed(khatma) {
  const LTR = '\u200E', BLANK = '\u200B';
  const embed = new EmbedBuilder()
    .setTitle('✨ Khatma — Liste de participation')
    .setColor(0xf4a7c3).setTimestamp().setFooter({ text: 'Dernière mise à jour' });
  const actives       = khatma.participants.filter(p => p.status === 'actif');
  const indisponibles = khatma.participants.filter(p => p.status === 'indisponible');
  if (!khatma.participants.length) {
    embed.addFields({ name: '🌸 Récitatrices', value: `${BLANK}\n*Aucune participante pour l'instant*`, inline: false });
  } else {
    let n = 1;
    const lines = khatma.participants.map(p =>
      p.status === 'indisponible'
        ? `${LTR}⏸️  ${formatPages(p.pages)} — ${p.username}`
        : `${LTR}**${n++}.** 🤍 ${formatPages(p.pages)} — **${p.username}**`
    ).join('\n\n');
    embed.addFields({ name: '🌸 Récitatrices', value: `${LTR}*${actives.length} actives${indisponibles.length ? `, ${indisponibles.length} indisponibles` : ''}*\n${BLANK}\n${lines}`, inline: false });
  }
  if (khatma.listeners.length)
    embed.addFields({ name: '🌺 Sur écoute', value: `${LTR}*${khatma.listeners.length} auditrice(s)*\n${BLANK}\n${khatma.listeners.map(l => `${LTR}🌺 ${l.username}`).join('\n\n')}`, inline: false });
  return embed;
}

function mainButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('khatma_ecoute').setLabel('🌺  J\'écoute').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('khatma_participe').setLabel('🌸  Je participe').setStyle(ButtonStyle.Primary)
  );
}
function statusButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('khatma_rejoindre').setLabel('🌸 Rejoindre la liste').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('khatma_indisponible').setLabel('⏸️ Me mettre indisponible').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('khatma_redevenir_actif').setLabel('✅ Redevenir active').setStyle(ButtonStyle.Secondary)
  );
}
function niveauMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('khatma_niveau')
      .setPlaceholder('Choisir votre niveau de lecture…')
      .addOptions([
        { label: '✨ Fluide',        value: 'fluide',        description: 'Je lis couramment sans hésitation' },
        { label: '🌸 Intermédiaire', value: 'intermediaire', description: 'Je lis avec quelques pauses' },
        { label: '🌺 Débutante',     value: 'debutante',     description: 'Je commence à apprendre' },
      ])
  );
}
function pagesMenu(niveau) {
  const b = [{ label: '1 ligne', value: '1 ligne' }, { label: '1 verset', value: '1 verset' }];
  const m = [...b, { label: '1 page', value: '1', description: 'Une page du Mushaf' }];
  const f = [...m, { label: '2 pages', value: '2' }, { label: '3 pages', value: '3' }];
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('khatma_pages')
      .setPlaceholder('Combien souhaitez-vous lire à chaque passage ?')
      .addOptions(niveau === 'debutante' ? b : niveau === 'intermediaire' ? m : f)
  );
}

async function updateKhatmaMessage(khatma, guild) {
  const pairs = [
    [khatma.channelId, khatma.messageId, mainButtons()],
    [khatma.listeChannelId, khatma.listeMessageId, statusButtons()],
  ];
  for (const [cId, mId, btns] of pairs) {
    if (!cId || !mId) continue;
    try {
      const ch  = guild.channels.cache.get(cId) ?? await guild.channels.fetch(cId);
      const msg = await ch.messages.fetch(mId);
      await msg.edit({ embeds: [buildListEmbed(khatma)], components: [btns] });
    } catch { if (mId === khatma.listeMessageId) { khatma.listeMessageId = null; khatma.listeChannelId = null; } }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMMANDES SLASH
// ══════════════════════════════════════════════════════════════════════════════

// ⬇️ Ajouter chaque nouvelle leçon ici aussi

const commands = [
  new SlashCommandBuilder()
    .setName('khatma').setDescription('Gérer la khatma')
    .addSubcommand(s => s.setName('start').setDescription('🌙 Démarrer une nouvelle khatma'))
    .addSubcommand(s => s.setName('liste').setDescription('📋 Afficher la liste dans le chat'))
    .addSubcommand(s => s.setName('reset').setDescription('🔄 Réinitialiser la khatma'))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('qcm').setDescription('📝 Lancer un QCM pour les élèves')
    .addStringOption(o => o.setName('lecon').setDescription('Leçon à faire passer').setRequired(false).addChoices(...LECON_CHOICES))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('resultats').setDescription('📊 Récap résultats — rôle professeure-tome1 requis')
    .addStringOption(o => o.setName('lecon').setDescription('Filtrer par leçon').setRequired(false).addChoices(...LECON_CHOICES))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('detail').setDescription('🔍 Détail erreurs d\'une élève — rôle professeure-tome1 requis')
    .addUserOption(o => o.setName('eleve').setDescription('Mentionne l\'élève').setRequired(true))
    .addStringOption(o => o.setName('lecon').setDescription('Filtrer par leçon').setRequired(false).addChoices(...LECON_CHOICES))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('reinitialiser_qcm').setDescription('🗑️ Effacer tous les résultats — rôle professeure-tome1 requis')
    .toJSON(),
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Commandes slash enregistrées.');
  } catch (err) { console.error('❌ Erreur enregistrement commandes:', err); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  INTERACTIONS
// ══════════════════════════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
  // Ignorer les interactions expirées / fantômes
  if (!interaction.isRepliable()) return;

  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;

  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    // ══ KHATMA ══
    if (cmd === 'khatma') {
      const khatma = getKhatma(interaction.guildId);
      const sub    = interaction.options.getSubcommand();
      if (sub === 'start') {
        khatma.participants = []; khatma.listeners = []; khatma.channelId = interaction.channelId;
        await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [mainButtons()] });
        khatma.messageId = (await interaction.fetchReply()).id;
        return;
      }
      if (sub === 'liste') {
        await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [statusButtons()] });
        const m = await interaction.fetchReply();
        khatma.listeMessageId = m.id; khatma.listeChannelId = interaction.channelId;
        return;
      }
      if (sub === 'reset') {
        khatmas.delete(interaction.guildId);
        await interaction.reply({ content: '🔄 Khatma réinitialisée.', flags: MessageFlags.Ephemeral });
        return;
      }
    }

    // ══ QCM — lancer ══
    if (cmd === 'qcm') {
      const leconId = interaction.options.getString('lecon') ?? 'lecon1';
      if (!LECONS[leconId]) { await interaction.reply({ content: '❌ Leçon introuvable.', flags: MessageFlags.Ephemeral }); return; }
      const lecon = LECONS[leconId];
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`📖  ${lecon.titre}`)
          .setDescription(`Un nouveau QCM est disponible !\n\n**${lecon.questions.length} questions**\n\nClique sur le bouton pour commencer.\nLes questions n'apparaîtront **que pour toi** 🤲`)
          .setColor(0x1A5276)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`qcm_start_${leconId}`).setLabel('📝  Commencer le QCM').setStyle(ButtonStyle.Success)
        )],
      });
      return;
    }

    // ══ RÉSULTATS (prof) ══
    if (cmd === 'resultats') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const data  = await readAllResults(interaction.options.getString('lecon') ?? '');
      const lines = Object.values(data).flatMap(info => {
        if (!info.sessions.length) return [];
        const derniere = info.sessions.at(-1);
        const moy = Math.round(info.sessions.reduce((a, s) => a + s.pct, 0) / info.sessions.length);
        return [`${scoreEmoji(derniere.pct)} **${info.username}** — Dernière : ${derniere.score}/${derniere.total} (${derniere.pct}%) | Moy : ${moy}% | Essais : ${info.sessions.length}`];
      });
      if (!lines.length) { await interaction.editReply('Aucun résultat enregistré.'); return; }
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setTitle('📊  Récapitulatif').setDescription(lines.join('\n')).setColor(0x1C2833).setTimestamp()
        .setFooter({ text: `${lines.length} élève(s) enregistrée(s)` })] });
      return;
    }

    // ══ DÉTAIL (prof) ══
    if (cmd === 'detail') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const membre = interaction.options.getUser('eleve');
      const data   = await readAllResults(interaction.options.getString('lecon') ?? '');
      const info   = data[membre.id];
      if (!info) { await interaction.editReply(`Aucun résultat pour **${membre.username}**.`); return; }
      const embed = new EmbedBuilder().setTitle(`🔍  Détail — ${info.username}`).setColor(0xE67E22);
      for (const s of info.sessions.slice(-3)) {
        const errs = s.erreurs.length ? s.erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n') : '✅ Aucune erreur !';
        embed.addFields({ name: `${s.date} — ${s.lecon} — ${s.score}/${s.total} (${s.pct}%)`, value: errs, inline: false });
      }
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ══ RÉINITIALISER (prof) ══
    if (cmd === 'reinitialiser_qcm') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      saveResults({});
      await interaction.reply({ content: '🗑️ Tous les résultats ont été effacés.', flags: MessageFlags.Ephemeral });
      return;
    }
  }

  if (interaction.isButton()) {
    const id     = interaction.customId;
    const khatma = getKhatma(interaction.guildId);

    // ══ KHATMA boutons ══
    if (id === 'khatma_ecoute') {
      khatma.participants = khatma.participants.filter(p => p.userId !== userId);
      if (!khatma.listeners.find(l => l.userId === userId)) khatma.listeners.push({ userId, username, joinedAt: new Date() });
      await updateKhatmaMessage(khatma, interaction.guild);
      await interaction.reply({ content: '🌺 Tu as été ajoutée à la liste des auditrices !', flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_participe' || id === 'khatma_rejoindre') {
      await interaction.reply({ content: '🌸 **Quel est votre niveau de lecture ?**', components: [niveauMenu()], flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_indisponible') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) { p.status = 'indisponible'; await updateKhatmaMessage(khatma, interaction.guild); await interaction.reply({ content: '⏸️ Marquée indisponible.', flags: MessageFlags.Ephemeral }); }
      else await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_redevenir_actif') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) { p.status = 'actif'; p.username = username; await updateKhatmaMessage(khatma, interaction.guild); await interaction.reply({ content: '✅ Tu es de nouveau active !', flags: MessageFlags.Ephemeral }); }
      else await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
      return;
    }

    // ══ QCM — démarrer ══
    if (id.startsWith('qcm_start_')) {
      const leconId = id.replace('qcm_start_', '');
      if (qcmSessions.has(userId)) {
        await interaction.reply({ content: '⚠️ Tu as déjà un QCM en cours !', flags: MessageFlags.Ephemeral });
        return;
      }
      qcmSessions.set(userId, { leconId, qIndex: 0, score: 0, erreurs: [] });
      const embed = buildQuestionEmbed(leconId, 0, null);
      embed.setAuthor({ name: `QCM — ${LECONS[leconId].titre}` });
      embed.setFooter({ text: 'Seule toi vois ces messages 🤲' });
      await interaction.reply({ embeds: [embed], components: [buildAnswerButtons(leconId, 0), buildQuitButton()], flags: MessageFlags.Ephemeral });
      return;
    }

    // ══ QCM — répondre ══
    if (id.startsWith('qcm_answer_')) {
      const sess = qcmSessions.get(userId);
      if (!sess) {
        await interaction.reply({ content: '❌ Aucun QCM actif. Utilise /qcm pour commencer.', flags: MessageFlags.Ephemeral });
        return;
      }
      const choice  = parseInt(id.replace('qcm_answer_', ''), 10);
      const lecon   = LECONS[sess.leconId];
      const q       = lecon.questions[sess.qIndex];
      const total   = lecon.questions.length;
      const correct = choice === q.reponse;

      if (correct) {
        sess.score++;
      } else {
        sess.erreurs.push({ question: q.enonce, reponseDonnee: q.options[choice][0], bonneReponse: q.options[q.reponse][0] });
      }

      const feedback = correct
        ? `✅  ${q.explication}`
        : `❌  Bonne réponse : **${q.options[q.reponse][0]}**\n${q.explication}`;

      sess.qIndex++;

      // ── Dernière question → résultat final ──
      if (sess.qIndex >= total) {
        const { score, erreurs, leconId } = sess;
        clearQuizState(userId);
        await appendResult(userId, username, leconId, score, total, erreurs);
        const pct = Math.round(score / total * 100);
        const msg = pct === 100 ? 'مَاشَاءَ اللَّهُ — Parfait, aucune erreur ! 🎉'
          : pct >= 85 ? 'جَيِّدٌ جِدًّا — Très bien ! 📖'
          : pct >= 60 ? 'لَا بَأْسَ — Continue tes révisions ! 💪'
          : 'اِجْتَهِدْ — Relis le cours avant de réessayer 📚';
        const embed = new EmbedBuilder()
          .setTitle(`${scoreEmoji(pct)}  Résultat final — ${lecon.titre}`)
          .setColor(scoreColor(pct))
          .addFields(
            { name: 'Dernière question', value: feedback, inline: false },
            { name: 'Score final', value: `**${score} / ${total}**  (${pct}%)`, inline: false },
            { name: '\u200B', value: msg, inline: false }
          );
        if (erreurs.length)
          embed.addFields({ name: 'Tes erreurs', value: erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n'), inline: false });
        await interaction.update({ embeds: [embed], components: [] });
        return;
      }

      // ── Question suivante — feedback AVANT la question ──
      await interaction.update({
        embeds:     [buildQuestionEmbed(sess.leconId, sess.qIndex, feedback)],
        components: [buildAnswerButtons(sess.leconId, sess.qIndex), buildQuitButton()],
      });
      return;
    }

    // ══ QCM — quitter ══
    if (id === 'quit_quiz') {
      const sess = qcmSessions.get(userId);
      if (!sess) {
        // Session déjà terminée ou inexistante
        await interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle('❌  Quiz abandonné')
            .setDescription('Aucun quiz actif trouvé. Utilise **/qcm** pour en démarrer un nouveau.')
            .setColor(0xB03A2E)],
          components: [],
        });
        return;
      }
      const leconTitre = LECONS[sess.leconId]?.titre ?? sess.leconId;
      const questionsAnswered = sess.qIndex;
      const total = LECONS[sess.leconId]?.questions.length ?? '?';
      clearQuizState(userId);
      await interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle('❌  Quiz abandonné')
          .setDescription(
            `Tu as quitté le quiz **${leconTitre}**.\n\n` +
            `Questions répondues : **${questionsAnswered} / ${total}**\n\n` +
            `Lance **/qcm** pour recommencer quand tu veux 🤲`
          )
          .setColor(0xB03A2E)],
        components: [],
      });
      return;
    }
  }

  if (interaction.isStringSelectMenu()) {
    const khatma = getKhatma(interaction.guildId);
    if (interaction.customId === 'khatma_niveau') {
      const niveau = interaction.values[0];
      tempUserData.set(userId, { niveau });
      await interaction.update({ content: `🌸 Niveau : **${NIVEAU_LABEL[niveau]}**\n\n✨ **Combien souhaitez-vous lire ?**`, components: [pagesMenu(niveau)] });
      return;
    }
    if (interaction.customId === 'khatma_pages') {
      const pages  = interaction.values[0];
      const niveau = (tempUserData.get(userId) ?? {}).niveau ?? 'intermediaire';
      tempUserData.delete(userId);
      khatma.listeners = khatma.listeners.filter(l => l.userId !== userId);
      const existing = khatma.participants.find(p => p.userId === userId);
      if (existing) Object.assign(existing, { niveau, pages, status: 'actif', username });
      else khatma.participants.push({ userId, username, niveau, pages, status: 'actif', joinedAt: new Date() });
      await updateKhatmaMessage(khatma, interaction.guild);
      await interaction.update({ content: `✅ C'est noté ! Tu vas lire **${formatPages(pages)}** à chaque passage.\nBienvenue dans la khatma 🤍✨`, components: [] });
      return;
    }
  }
});

// ─── Démarrage ────────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  await registerCommands();
});

client.login(TOKEN);
