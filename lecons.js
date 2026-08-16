/**
 * lecons.js — Questions des QCM (Tome 1 de Médine)
 *
 * ► Pour MODIFIER une question :
 *     Trouve la leçon concernée et modifie enonce / options / reponse / explication.
 *
 * ► Pour AJOUTER une leçon (3 étapes) :
 *     1. Ajoute un bloc leconX: { titre, questions: [...] } ici.
 *     2. Ajoute { name: 'Leçon X — ...', value: 'leconX' } dans LECON_CHOICES.
 *     3. Fais de même dans commands.js (addChoices) — puis redéploie sur Railway.
 *
 * Format d'une question :
 *   {
 *     enonce:      'Question en français (le **mot** en gras si besoin)',
 *     options:     [['Option A'], ['Option B'], ['Option C']],  // 2 ou 3 options
 *     reponse:     0,   // index de la bonne réponse (0 = A, 1 = B, 2 = C)
 *     explication: 'Explication affichée après la réponse ✅',
 *   }
 */

const LECONS = {

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 1 — أسماء الإشارة  (Pronoms démonstratifs)
  // ─────────────────────────────────────────────────────────────────
  lecon1: {
    titre: 'Leçon 1 — أسماء الإشارة',
    questions: [
      {
        enonce:      'Quel pronom démonstratif (proche) pour **كِتَابٌ** (masculin) ?',
        options:     [['هَذَا'], ['هَذِهِ']],
        reponse:     0,
        explication: '**هَذَا** = masculin proche. هَذِهِ = féminin proche ✅',
      },
      {
        enonce:      'Quel pronom démonstratif (proche) pour **سَيَّارَةٌ** (féminin) ?',
        options:     [['هَذَا'], ['هَذِهِ']],
        reponse:     1,
        explication: '**هَذِهِ** = féminin proche. سيارة est féminin ✅',
      },
      {
        enonce:      'Quel pronom démonstratif (loin) pour **قَلَمٌ** (masculin) ?',
        options:     [['هَذَا'], ['ذَلِكَ'], ['تِلْكَ']],
        reponse:     1,
        explication: '**ذَلِكَ** = masculin loin. تِلْكَ = féminin loin ✅',
      },
      {
        enonce:      'Quel pronom démonstratif (loin) pour **مَدْرَسَةٌ** (féminin) ?',
        options:     [['ذَلِكَ'], ['تِلْكَ'], ['هَذِهِ']],
        reponse:     1,
        explication: '**تِلْكَ** = féminin loin. ذَلِكَ = masculin loin ✅',
      },
      {
        enonce:      'Est-ce correct : **هَذَا مَدْرَسَةٌ** ?',
        options:     [['✅ Correct'], ['❌ Incorrect — هَذِهِ مَدْرَسَةٌ']],
        reponse:     1,
        explication: 'مَدْرَسَة est féminin → on utilise **هَذِهِ**, pas هَذَا ✅',
      },
      {
        enonce:      'Au pluriel, pour des **objets** (ex : كُتُبٌ), on utilise ?',
        options:     [['هَؤُلَاءِ'], ['هَذِهِ'], ['أُولَئِكَ']],
        reponse:     1,
        explication: 'Pluriel non-humain → **هَذِهِ** (proche) / **تِلْكَ** (loin). هَؤُلَاءِ = humains seulement ✅',
      },
      {
        enonce:      'Au pluriel, pour des **personnes proches** (ex : طُلَّابٌ), on utilise ?',
        options:     [['هَذِهِ'], ['هَؤُلَاءِ'], ['أُولَئِكَ']],
        reponse:     1,
        explication: '**هَؤُلَاءِ** = pluriel humain proche. أُولَئِكَ = pluriel humain loin ✅',
      },
      {
        enonce:      'Au pluriel, pour des **personnes éloignées** (ex : طُلَّابٌ), on utilise ?',
        options:     [['هَؤُلَاءِ'], ['تِلْكَ'], ['أُولَئِكَ']],
        reponse:     2,
        explication: '**أُولَئِكَ** = pluriel humain loin. هَؤُلَاءِ = pluriel humain proche ✅',
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
        enonce:      '"Qui ?" se dit ?',
        options:     [['مَنْ'], ['مَا'], ['أَيْنَ']],
        reponse:     0,
        explication: '**مَنْ** = qui (pour les personnes) ✅  Ex : مَنْ هُوَ؟',
      },
      {
        enonce:      '"Quoi ?" se dit ?',
        options:     [['مَنْ'], ['مَا'], ['مَتَى']],
        reponse:     1,
        explication: '**مَا** = quoi / qu\'est-ce que (pour les choses) ✅  Ex : مَا هَذَا؟',
      },
      {
        enonce:      '"Où ?" se dit ?',
        options:     [['مَتَى'], ['أَيْنَ'], ['كَيْفَ']],
        reponse:     1,
        explication: '**أَيْنَ** = où ✅  Ex : أَيْنَ الْكِتَابُ؟',
      },
      {
        enonce:      '"Quand ?" se dit ?',
        options:     [['أَيْنَ'], ['كَيْفَ'], ['مَتَى']],
        reponse:     2,
        explication: '**مَتَى** = quand ✅  Ex : مَتَى الدَّرْسُ؟',
      },
      {
        enonce:      '"Comment ?" se dit ?',
        options:     [['مَتَى'], ['لِمَاذَا'], ['كَيْفَ']],
        reponse:     2,
        explication: '**كَيْفَ** = comment ✅  Ex : كَيْفَ حَالُكِ؟',
      },
      {
        enonce:      '"Pourquoi ?" se dit ?',
        options:     [['لِمَاذَا'], ['مَاذَا'], ['هَلْ']],
        reponse:     0,
        explication: '**لِمَاذَا** = pourquoi ✅  Ex : لِمَاذَا غِبْتِ؟',
      },
      {
        enonce:      '"Combien" (quantité) se dit ?',
        options:     [['بِكَمْ'], ['كَمْ'], ['كَيْفَ']],
        reponse:     1,
        explication: '**كَمْ** = combien (quantité). بِكَمْ = combien (prix) ✅',
      },
      {
        enonce:      '"Combien ça coûte ?" se dit ?',
        options:     [['كَمْ'], ['بِكَمْ'], ['مَتَى']],
        reponse:     1,
        explication: '**بِكَمْ** = combien (prix) ✅  Ex : بِكَمْ هَذَا؟',
      },
      {
        enonce:      'Pour poser une **question oui/non**, on utilise ?',
        options:     [['هَلْ  /  أَ'], ['مَنْ'], ['مَا']],
        reponse:     0,
        explication: '**هَلْ** ou **أَ** = question oui/non ✅  Ex : هَلْ أَنْتِ طَالِبَةٌ؟',
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
        enonce:      'Le mot **مَسَاجِدُ** (mosquées) prend-il le tanwīn ?',
        options:     [['✅ Oui'], ['❌ Non — c\'est un diptote']],
        reponse:     1,
        explication: 'مَسَاجِدُ = pluriel brisé sur صيغة منتهى الجموع → **ممنوع من الصرف** → pas de tanwīn ✅',
      },
      {
        enonce:      'Pourquoi **إِبْرَاهِيمُ** est-il ممنوع من الصرف ?',
        options:     [['Prénom d\'origine étrangère (أعجمي)'], ['Prénom féminin'], ['Pluriel brisé']],
        reponse:     0,
        explication: '**إِبْرَاهِيمُ** est diptote car c\'est un prénom non-arabe (أعجمي) ✅',
      },
      {
        enonce:      'Pourquoi **فَاطِمَةُ** est-il ممنوع من الصرف ?',
        options:     [['Prénom d\'origine étrangère'], ['Prénom féminin (علم مؤنث)']],
        reponse:     1,
        explication: '**فَاطِمَةُ** = علم مؤنث (prénom féminin) → ممنوع من الصرف ✅',
      },
      {
        enonce:      '**أَحْمَرُ** (rouge) est diptote car il est sur le schème ?',
        options:     [['فَعْلَانُ'], ['أَفْعَلُ'], ['فَعِيلٌ']],
        reponse:     1,
        explication: '**أَفْعَلُ** = schème des couleurs et des défauts physiques → ممنوع ✅  (أَزْرَقُ، أَبْيَضُ...)',
      },
      {
        enonce:      '**عَطْشَانُ** (assoiffé) est diptote car il est sur le schème ?',
        options:     [['أَفْعَلُ'], ['فَعْلَانُ'], ['فُعَلَاءُ']],
        reponse:     1,
        explication: '**فَعْلَانُ** = schème des adjectifs d\'état → ممنوع ✅  (جَوْعَانُ، كَسْلَانُ...)',
      },
      {
        enonce:      'Sans **أل**, un ممنوع من الصرف prend quelle voyelle au génitif ?',
        options:     [['كَسْرَة  (ِ)'], ['فَتْحَة  (َ)']],
        reponse:     1,
        explication: 'Sans أل → le diptote prend la **فَتْحَة** aux cas génitif ET accusatif (jamais la kasra) ✅',
      },
      {
        enonce:      'Le mot **كِتَابٌ** est-il ممنوع من الصرف ?',
        options:     [['✅ Oui'], ['❌ Non — c\'est un mot ordinaire']],
        reponse:     1,
        explication: 'كِتَابٌ est un mot ordinaire → il prend le tanwīn normalement ✅',
      },
      {
        enonce:      'Avec **أل**, le diptote reprend-il la déclinaison normale (kasra au génitif) ?',
        options:     [['✅ Oui'], ['❌ Non']],
        reponse:     0,
        explication: 'Avec أل ou en إضافة → le diptote se décline normalement (kasra au génitif), mais sans tanwīn ✅',
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
        enonce:      'La جملة اسمية est composée de ?',
        options:     [['مبتدأ + خبر'], ['فعل + فاعل'], ['حرف + اسم']],
        reponse:     0,
        explication: '**مبتدأ** (sujet) + **خبر** (prédicat) = الجملة الاسمية ✅',
      },
      {
        enonce:      'Dans **اَلْكِتَابُ جَدِيدٌ**, quel est le مبتدأ ?',
        options:     [['اَلْكِتَابُ'], ['جَدِيدٌ']],
        reponse:     0,
        explication: '**اَلْكِتَابُ** = مبتدأ (sujet). جَدِيدٌ = خبر (prédicat) ✅',
      },
      {
        enonce:      'Le مبتدأ est toujours au cas ?',
        options:     [['رفع (nominatif)'], ['نصب (accusatif)'], ['جر (génitif)']],
        reponse:     0,
        explication: 'Le **مبتدأ** est toujours **مرفوع** (nominatif) — même chose pour le خبر مفرد ✅',
      },
      {
        enonce:      'Dans **زَيْدٌ فِي الْبَيْتِ**, **فِي الْبَيْتِ** est un خبر de type ?',
        options:     [['خبر مفرد'], ['خبر شبه جملة — جار ومجرور'], ['خبر جملة فعلية']],
        reponse:     1,
        explication: '**فِي الْبَيْتِ** = جار ومجرور → خبر شبه جملة ✅',
      },
      {
        enonce:      'Dans **الْكِتَابُ فَوْقَ الطَّاوِلَةِ**, **فَوْقَ** est ?',
        options:     [['حرف جر (préposition)'], ['ظرف مكان (adv. de lieu)'], ['نعت (adjectif)']],
        reponse:     1,
        explication: '**فَوْقَ** est un ظرف مكان, pas un حرف جر. Les حروف جر : فِي / إِلَى / مِنْ / عَلَى ✅',
      },
      {
        enonce:      'Dans **الطَّالِبُ يَكْتُبُ الدَّرْسَ**, **يَكْتُبُ الدَّرْسَ** est un خبر de type ?',
        options:     [['خبر مفرد'], ['خبر جملة فعلية'], ['خبر شبه جملة']],
        reponse:     1,
        explication: '**يَكْتُبُ الدَّرْسَ** = جملة فعلية → خبر جملة فعلية ✅',
      },
      {
        enonce:      'Dans **اَلْكِتَابُ لَوْنُهُ أَزْرَقُ**, **لَوْنُهُ أَزْرَقُ** est un خبر de type ?',
        options:     [['خبر مفرد'], ['خبر جملة اسمية'], ['خبر شبه جملة']],
        reponse:     1,
        explication: '**لَوْنُهُ أَزْرَقُ** = phrase nominale entière → خبر جملة اسمية ✅',
      },
      {
        enonce:      'Combien de types de خبر y a-t-il dans ce cours ?',
        options:     [['3'], ['5'], ['2']],
        reponse:     1,
        explication: '5 types : ① مفرد ② جملة اسمية ③ جملة فعلية ④ جار ومجرور ⑤ ظرف ✅',
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
        enonce:      'Pronom relatif pour un **singulier masculin** ?',
        options:     [['الَّذِي'], ['الَّتِي'], ['الَّذِينَ']],
        reponse:     0,
        explication: '**الَّذِي** = singulier masculin ✅  Ex : الطَّالِبُ الَّذِي…',
      },
      {
        enonce:      'Pronom relatif pour un **singulier féminin** ?',
        options:     [['الَّذِي'], ['الَّتِي'], ['اللَّتَانِ']],
        reponse:     1,
        explication: '**الَّتِي** = singulier féminin ✅  Ex : الطَّالِبَةُ الَّتِي…',
      },
      {
        enonce:      'Pronom relatif pour **الطَّائِرَاتُ** (pluriel d\'objets) ?',
        options:     [['الَّذِينَ'], ['الَّتِي'], ['اللَّاتِي']],
        reponse:     1,
        explication: 'Pluriel non-humain → **الَّتِي** (même forme que le féminin singulier) ✅',
      },
      {
        enonce:      'Pronom relatif pour **الطُّلَّابُ** (pluriel masc. humain) ?',
        options:     [['الَّذِينَ'], ['اللَّاتِي'], ['الَّذِي']],
        reponse:     0,
        explication: '**الَّذِينَ** = pluriel masculin humain ✅  Ex : الطُّلَّابُ الَّذِينَ…',
      },
      {
        enonce:      'Pronom relatif pour un **duel masculin** ?',
        options:     [['اللَّذَانِ'], ['اللَّتَانِ'], ['الَّذِينَ']],
        reponse:     0,
        explication: '**اللَّذَانِ** = duel masculin ✅  Ex : الطَّالِبَانِ اللَّذَانِ…',
      },
      {
        enonce:      'Pronom relatif pour un **duel féminin** ?',
        options:     [['اللَّذَانِ'], ['اللَّتَانِ'], ['اللَّاتِي']],
        reponse:     1,
        explication: '**اللَّتَانِ** = duel féminin ✅  Ex : الطَّالِبَتَانِ اللَّتَانِ…',
      },
      {
        enonce:      'Le اسم موصول s\'accorde avec ?',
        options:     [['Le verbe qui suit'], ['Le nom qu\'il qualifie (genre et nombre)'], ['Le sujet de la phrase principale']],
        reponse:     1,
        explication: 'Le اسم موصول s\'accorde en **genre et nombre** avec le nom qualifié (المنعوت) ✅',
      },
      {
        enonce:      'La proposition qui suit le اسم موصول s\'appelle ?',
        options:     [['الصِّلَة'], ['الخبر'], ['النعت']],
        reponse:     0,
        explication: '**الصِّلَة** = proposition relative qui suit le pronom. Elle doit contenir un pronom de rappel (العائد) ✅',
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
        enonce:      '**أَنَا** signifie ?',
        options:     [['Je'], ['Nous'], ['Tu']],
        reponse:     0,
        explication: '**أَنَا** = je ✅',
      },
      {
        enonce:      '**نَحْنُ** signifie ?',
        options:     [['Je'], ['Nous'], ['Ils']],
        reponse:     1,
        explication: '**نَحْنُ** = nous ✅',
      },
      {
        enonce:      '**هُوَ** / **هِيَ** — lequel signifie "elle" ?',
        options:     [['هُوَ'], ['هِيَ']],
        reponse:     1,
        explication: '**هِيَ** = elle. هُوَ = il ✅',
      },
      {
        enonce:      '**هُمْ** / **هُنَّ** — lequel désigne les **femmes** ?',
        options:     [['هُمْ'], ['هُنَّ']],
        reponse:     1,
        explication: '**هُنَّ** = elles (pluriel féminin). هُمْ = ils ✅',
      },
      {
        enonce:      'Dans **كِتَابِي** (mon livre), le pronom attaché **ي** signifie ?',
        options:     [['Mon / Ma (1ère pers.)'], ['Ton / Ta (masc.)'], ['Son / Sa']],
        reponse:     0,
        explication: '**ي** = pronom de 1ère personne singulier (mon/ma) ✅  Ex : قَلَمِي، بَيْتِي',
      },
      {
        enonce:      'Dans **كِتَابُكَ** (ton livre — masc.), le pronom attaché est ?',
        options:     [['كَ  (masc.)'], ['كِ  (fém.)'], ['هُ']],
        reponse:     0,
        explication: '**كَ** = ton/ta (masculin). كِ = ton/ta (féminin) ✅',
      },
      {
        enonce:      'Dans **كِتَابُهَا** (son livre — à elle), le pronom attaché **هَا** désigne ?',
        options:     [['Lui (masculin)'], ['Elle (féminin)']],
        reponse:     1,
        explication: '**هَا** = son (à elle). هُ = son (à lui) ✅',
      },
      {
        enonce:      '**أَنْتُمَا** signifie ?',
        options:     [['Vous (pluriel)'], ['Vous deux (duel)'], ['Tu (féminin)']],
        reponse:     1,
        explication: '**أَنْتُمَا** = vous deux (duel, masc. ou fém.) ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 7 — الحروف القمرية والشمسية / النكرة والمعرفة / المنادى
  // ─────────────────────────────────────────────────────────────────
  lecon7: {
    titre: 'Leçon 7 — القمرية / الشمسية / النكرة / المنادى',
    questions: [
      {
        enonce:      'Avec **أل** + lettre **قمرية**, le ل se prononce ?',
        options:     [['Il s\'assimile à la lettre suivante'], ['Normalement (لْ)']],
        reponse:     1,
        explication: 'Lettre قمرية → **أل** se prononce normalement : اَلْكِتَابُ, اَلْبَيْتُ ✅',
      },
      {
        enonce:      'Avec **أل** + lettre **شمسية**, le ل se prononce ?',
        options:     [['Il s\'assimile (shadda sur la lettre suivante)'], ['Normalement']],
        reponse:     0,
        explication: 'Lettre شمسية → le ل s\'assimile : اَلشَّمْسُ (al-shams → ash-shams) ✅',
      },
      {
        enonce:      'La lettre **ب** est-elle قمرية ou شمسية ?',
        options:     [['قمرية'], ['شمسية']],
        reponse:     0,
        explication: '**ب** est قمرية → اَلْبَابُ (le ل se prononce) ✅',
      },
      {
        enonce:      'La lettre **ش** est-elle قمرية ou شمسية ?',
        options:     [['قمرية'], ['شمسية']],
        reponse:     1,
        explication: '**ش** est شمسية → اَلشَّمْسُ (le ل s\'assimile) ✅',
      },
      {
        enonce:      '**بَيْتٌ** (avec tanwīn) est ?',
        options:     [['نكرة (indéfini)'], ['معرفة (défini)']],
        reponse:     0,
        explication: 'Tanwīn = **نكرة** (indéfini). اَلْبَيْتُ (avec أل) = معرفة ✅',
      },
      {
        enonce:      '**بَيْتُ الطَّالِبِ** est une معرفة de type ?',
        options:     [['معرفة بأل'], ['معرفة بالإضافة'], ['نكرة']],
        reponse:     1,
        explication: 'Défini par annexion (إضافة) → **معرفة بالإضافة** ✅',
      },
      {
        enonce:      'Dans **يَا زَيْدُ**, la voyelle finale du منادى est ?',
        options:     [['ضَمَّة (ُ)'], ['فَتْحَة (َ)'], ['كَسْرَة (ِ)']],
        reponse:     0,
        explication: 'يَا + علم مفرد → **مبني على الضم** ✅  Ex : يَا فَاطِمَةُ، يَا أُسْتَاذُ',
      },
      {
        enonce:      'Combien y a-t-il de lettres **شمسية** ?',
        options:     [['12'], ['14'], ['10']],
        reponse:     1,
        explication: '**14 lettres شمسية** : ت ث د ذ ر ز س ش ص ض ط ظ ل ن ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 8 — النعت والمنعوت + العدد 3-10  (Adjectif + Nombres)
  // ─────────────────────────────────────────────────────────────────
  lecon8: {
    titre: 'Leçon 8 — النعت والمنعوت / العدد',
    questions: [
      {
        enonce:      'Dans **الطَّالِبُ الْمُجْتَهِدُ**, quel est le نعت (adjectif) ?',
        options:     [['الطَّالِبُ'], ['الْمُجْتَهِدُ']],
        reponse:     1,
        explication: '**الْمُجْتَهِدُ** = نعت. الطَّالِبُ = منعوت (nom qualifié) ✅',
      },
      {
        enonce:      'Le نعت s\'accorde avec le منعوت en ?',
        options:     [['Genre et nombre uniquement'], ['Genre, nombre, cas et définitude (4 éléments)']],
        reponse:     1,
        explication: 'Le نعت s\'accorde en **4 éléments** : genre + nombre + cas + définitude ✅',
      },
      {
        enonce:      'Pour les nombres **3 à 10**, le nombre et le compté sont du même genre ?',
        options:     [['✅ Oui — même genre'], ['❌ Non — genre opposé (inversion)']],
        reponse:     1,
        explication: 'Inversion systématique ! 3 garçons = **ثَلَاثَةُ** أَوْلَادٍ (ثَلَاثَة fém. + أولاد masc.) ✅',
      },
      {
        enonce:      'Comment dit-on **"trois étudiants"** ?',
        options:     [['ثَلَاثُ طُلَّابٍ'], ['ثَلَاثَةُ طُلَّابٍ']],
        reponse:     1,
        explication: 'طُلَّاب est masculin → on utilise **ثَلَاثَة** (féminin) par inversion ✅',
      },
      {
        enonce:      'Comment dit-on **"quatre étudiantes"** ?',
        options:     [['أَرْبَعَةُ طَالِبَاتٍ'], ['أَرْبَعُ طَالِبَاتٍ']],
        reponse:     1,
        explication: 'طَالِبَات est féminin → on utilise **أَرْبَعُ** (masculin, sans ة) par inversion ✅',
      },
      {
        enonce:      'Le compté (المعدود) avec les nombres 3-10 est au ?',
        options:     [['Singulier مرفوع'], ['Pluriel مجرور (مضاف إليه)'], ['Duel مرفوع']],
        reponse:     1,
        explication: 'المعدود = **جمع مجرور** (pluriel génitif) car il est مضاف إليه ✅  Ex : ثَلَاثَةُ **طُلَّابٍ**',
      },
      {
        enonce:      'Comment dit-on **"cinq livres"** ?',
        options:     [['خَمْسَةُ كُتُبٍ'], ['خَمْسُ كُتُبٍ']],
        reponse:     0,
        explication: 'كُتُب est masculin → on utilise **خَمْسَة** (féminin) par inversion ✅',
      },
      {
        enonce:      'Le نعت doit-il suivre directement le منعوت ?',
        options:     [['✅ Oui — il vient juste après'], ['❌ Non — il peut être séparé']],
        reponse:     0,
        explication: 'Le **نعت** suit toujours directement le **منعوت** ✅',
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
        enonce:      'Le duel de **كِتَابٌ** au nominatif est ?',
        options:     [['كِتَابَانِ'], ['كِتَابَيْنِ']],
        reponse:     0,
        explication: '**كِتَابَانِ** = nominatif. كِتَابَيْنِ = accusatif/génitif ✅',
      },
      {
        enonce:      'La ة dans **طَالِبَةٌ** devient quoi au duel ?',
        options:     [['Elle reste ة'], ['Elle devient ت']],
        reponse:     1,
        explication: 'ة → **ت** au duel ✅  Ex : طَالِبَةٌ → طَالِبَتَانِ',
      },
      {
        enonce:      '**عِنْدِي** vs **لِي** — lequel exprime une possession physique/proche ?',
        options:     [['عِنْدِي'], ['لِي']],
        reponse:     0,
        explication: '**عِنْدِي** = possession physique (j\'ai près de moi). **لِي** = appartenance générale ✅',
      },
      {
        enonce:      'Comment dit-on **"j\'ai un frère"** (appartenance, pas physique) ?',
        options:     [['عِنْدِي أَخٌ'], ['لِي أَخٌ']],
        reponse:     1,
        explication: '**لِي أَخٌ** = j\'ai un frère (appartenance). عِنْدِي = physique/proche ✅',
      },
      {
        enonce:      'Le verbe s\'accorde-t-il avec un sujet féminin ?',
        options:     [['✅ Oui — il prend ـَتْ'], ['❌ Non — il reste identique']],
        reponse:     0,
        explication: 'Sujet féminin → le verbe prend **ـَتْ** : **كَتَبَتْ** فَاطِمَةُ ✅',
      },
      {
        enonce:      '**مَعَ** se construit avec ?',
        options:     [['Un pronom seul'], ['Un مضاف إليه (nom au génitif ou pronom attaché)']],
        reponse:     1,
        explication: '**مَعَ** + مضاف إليه ✅  Ex : مَعَ الطَّالِبِ / مَعِي / مَعَكِ',
      },
      {
        enonce:      '**لِمَنْ هَذَا ؟** signifie ?',
        options:     [['À qui est ceci ?'], ['Comment est ceci ?'], ['Où est ceci ?']],
        reponse:     0,
        explication: '**لِمَنْ** = à qui (لِ + مَنْ) ✅  Ex : لِمَنْ هَذَا الْكِتَابُ؟',
      },
      {
        enonce:      'Dans **جَاءَ هَذَا الطَّالِبُ**, le mot **الطَّالِبُ** est ?',
        options:     [['نعت (adjectif)'], ['بدل (apposition)'], ['خبر (prédicat)']],
        reponse:     1,
        explication: '**الطَّالِبُ** = بدل — il précise le pronom démonstratif هَذَا ✅',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  LEÇON 10 — مراجعة كاملة  (Révision générale — Leçons 1 à 9)
  // ─────────────────────────────────────────────────────────────────
  lecon10: {
    titre: 'Leçon 10 — مراجعة كاملة',
    questions: [
      {
        enonce:      'L1 — Pronom démonstratif (loin, fém.) pour **نَافِذَةٌ** ?',
        options:     [['هَذِهِ'], ['تِلْكَ'], ['ذَلِكَ']],
        reponse:     1,
        explication: '**تِلْكَ** = féminin loin ✅',
      },
      {
        enonce:      'L2 — "Quand ?" se dit ?',
        options:     [['أَيْنَ'], ['مَتَى'], ['كَيْفَ']],
        reponse:     1,
        explication: '**مَتَى** = quand ✅',
      },
      {
        enonce:      'L3 — **مَدَارِسُ** prend-il le tanwīn ?',
        options:     [['✅ Oui'], ['❌ Non — diptote (صيغة منتهى الجموع)']],
        reponse:     1,
        explication: 'مَدَارِسُ = ممنوع من الصرف → pas de tanwīn ✅',
      },
      {
        enonce:      'L4 — Dans **الطَّالِبُ فِي الْفَصْلِ**, le خبر est de type ?',
        options:     [['خبر مفرد'], ['خبر شبه جملة — جار ومجرور']],
        reponse:     1,
        explication: '**فِي الْفَصْلِ** = جار ومجرور → خبر شبه جملة ✅',
      },
      {
        enonce:      'L5 — Pronom relatif pour **الْكُتُبُ** (pluriel non-humain) ?',
        options:     [['الَّذِينَ'], ['الَّتِي'], ['اللَّتَانِ']],
        reponse:     1,
        explication: '**الَّتِي** = pluriel non-humain (même forme que fém. sg.) ✅',
      },
      {
        enonce:      'L6 — Dans **كِتَابُهُ** (son livre — à lui), le pronom **هُ** signifie ?',
        options:     [['Son (à lui)'], ['Son (à elle)']],
        reponse:     0,
        explication: '**هُ** = son (à lui). هَا = son (à elle) ✅',
      },
      {
        enonce:      'L7 — La lettre **ن** est quelle lettre ?',
        options:     [['قمرية'], ['شمسية']],
        reponse:     1,
        explication: '**ن** est شمسية → اَلنَّجْمُ (le ل s\'assimile) ✅',
      },
      {
        enonce:      'L8 — Comment dit-on **"trois filles"** ?',
        options:     [['ثَلَاثُ بَنَاتٍ'], ['ثَلَاثَةُ بَنَاتٍ']],
        reponse:     0,
        explication: 'بَنَات est féminin → on utilise **ثَلَاثُ** (masculin, sans ة) par inversion ✅',
      },
      {
        enonce:      'L9 — **عِنْدِي** vs **لِي** — lequel utilise-t-on pour une appartenance générale ?',
        options:     [['عِنْدِي'], ['لِي']],
        reponse:     1,
        explication: '**لِي** = appartenance générale (ex : لِي أَخٌ). عِنْدِي = proche/physique ✅',
      },
      {
        enonce:      'L9 — Duel féminin de **طَالِبَةٌ** au nominatif ?',
        options:     [['طَالِبَتَانِ'], ['طَالِبَتَيْنِ'], ['طَالِبَتَانِ  /  طَالِبَتَيْنِ (selon le cas)']],
        reponse:     0,
        explication: '**طَالِبَتَانِ** = nominatif. طَالِبَتَيْنِ = accusatif/génitif ✅',
      },
    ],
  },

};

// ── Choix pour les menus Discord (commandes slash) ───────────────────────────
// ► Ajouter ici chaque nouvelle leçon, avec le même value que dans LECONS ci-dessus
const LECON_CHOICES = [
  { name: 'Leçon 1 — أسماء الإشارة',             value: 'lecon1'  },
  { name: 'Leçon 2 — أدوات الاستفهام',            value: 'lecon2'  },
  { name: 'Leçon 3 — الممنوع من الصرف',           value: 'lecon3'  },
  { name: 'Leçon 4 — الجملة الاسمية',             value: 'lecon4'  },
  { name: 'Leçon 5 — الأسماء الموصولة',           value: 'lecon5'  },
  { name: 'Leçon 6 — الضمائر',                    value: 'lecon6'  },
  { name: 'Leçon 7 — القمرية / الشمسية / النكرة', value: 'lecon7'  },
  { name: 'Leçon 8 — النعت والمنعوت / العدد',     value: 'lecon8'  },
  { name: 'Leçon 9 — بعض القواعد',                value: 'lecon9'  },
  { name: 'Leçon 10 — مراجعة كاملة',              value: 'lecon10' },
];

module.exports = { LECONS, LECON_CHOICES };
