import UIKit

class KeyboardViewController: UIInputViewController {

    private enum LayoutMode {
        case arabic    // Arabic layout with visible Franco subtitles (3, 7, 5, etc.)
        case francoEn  // Franco QWERTY layout with English letters
        case symbols   // 123 numbers and punctuation (?, /, !, etc.)
    }

    private var currentMode: LayoutMode = .arabic
    private var isFrancoAutoConvert: Bool = true
    private var heightConstraint: NSLayoutConstraint?
    
    // UI Containers
    private var rootStackView: UIStackView!
    private var topControlBar: UIStackView!
    private var suggestionsBar: UIStackView!
    private var francoDigitsBar: UIStackView!
    private var keysContainerStack: UIStackView!
    private var bottomRowStack: UIStackView!
    
    private var modeSwitchBtn: UIButton!
    private var langSwitchBtn: UIButton!
    private var francoToggleBtn: UIButton!
    private var suggestionButtons: [UIButton] = []
    
    // Typing Buffer for word-level prediction & conversion
    private var currentWordBuffer: String = ""
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
    
    // MARK: - Comprehensive Egyptian Franco Dictionary
    private let francoDictionary: [String: String] = [
        "ازيك": "ezayak",
        "ازيكوا": "ezayoko",
        "ازيكم": "ezayoko",
        "عامل": "3amel",
        "عامل ايه": "3amel eh",
        "عاملة ايه": "3amla eh",
        "عاملين ايه": "3amleen eh",
        "اخبارك": "a5barak",
        "اخبارك ايه": "a5barak eh",
        "الحمدلله": "el7mdllah",
        "الحمد لله": "el7md lellah",
        "شكرا": "shokran",
        "شكراً": "shokran",
        "حبيبي": "7bibi",
        "حبيبتي": "7bebti",
        "وحشتني": "wa7ashtny",
        "وحشتيني": "wa7ashteeny",
        "وحشني": "wa7shny",
        "صباح الخير": "9ba7 el 5air",
        "مساء الخير": "msa2 el 5air",
        "صباح الفل": "9ba7 el fol",
        "صباح الورد": "9ba7 el ward",
        "تصبح على خير": "te9ba7 3la 5air",
        "تمام": "tamam",
        "يلا": "yalla",
        "فينك": "fenak",
        "فينكم": "feenko",
        "بحبك": "ba7ebak",
        "حاضر": "7ader",
        "معلش": "ma3lesh",
        "ان شاء الله": "in sha allah",
        "ماشي": "mashy",
        "ايوه": "aiwa",
        "لا": "la2",
        "لأ": "la2",
        "اه": "ah",
        "ليه": "leh",
        "كده": "keda",
        "مش": "msh",
        "عشان": "3ashan",
        "علشان": "3alashan",
        "مين": "meen",
        "اخويا": "a5oya",
        "اختي": "o5ty",
        "اصلي": "a9ly",
        "يا رب": "ya rab",
        "يارب": "ya rab",
        "سلام": "salam",
        "مع السلامة": "ma3 el salama",
        "باي": "bye",
        "مبروك": "mabrook",
        "كل سنة وانت طيب": "kol sana w enta 6ayeb",
        "صاحبي": "sa7by",
        "بجد": "begad",
        "قوي": "awy",
        "كتير": "keteer",
        "دلوقتي": "delwaty",
        "فين": "feen",
        "امتى": "emta",
        "براحة": "bra7a",
        "خلاص": "5las",
        "والله": "wallah",
        "بخير": "b5air",
        "حلو": "7elw",
        "حلوة": "7elwa",
        "جميل": "gmeel",
        "كويس": "kwayes",
        "كويسة": "kwaysa",
        "فرحان": "far7an",
        "تعبان": "ta3ban",
        "موجود": "mawgood",
        "مستنيك": "mstaneek",
        "هكلمك": "hakalmak",
        "رن عليا": "ren 3alaya",
        "كلمني": "kalemny",
        "يا غالي": "ya 3'aly",
        "يا برنس": "ya prince",
        "يا عم": "ya 3am",
        "حبيبي تسلم": "7bibi teslam",
        "تسلم": "teslam",
        "منور": "mnawar",
        "جامد": "gamed",
        "قشطة": "eshta",
        "عادي": "3ady",
        "طبعا": "tab3an",
        "اكيد": "akeed",
        "بسرعة": "bser3a",
        "ثواني": "sawany",
        "دقيقة": "de2ee2a",
        "وصلت": "wslt",
        "انت فين": "enta feen",
        "رايح": "raye7",
        "جاي": "gay"
    ]
    
    private var reverseFrancoDict: [String: String] = [:]
    
    // Quick suggestion choices
    private let smartSuggestionsMap: [String: [String]] = [
        "ازيك": ["ezayak", "ezayk", "ezayeko"],
        "عامل": ["3amel eh", "3amla eh", "3amleen"],
        "صاحبي": ["sa7by", "sa7bi", "ya sa7by"],
        "حبيبي": ["7bibi", "7bebe", "7bebti"],
        "تمام": ["tamam", "kolo tamam", "tmm"],
        "فينك": ["fenak", "feen", "feenko"],
        "وحشتني": ["wa7ashtny", "wa7shtny", "wa7ashteeny"],
        "صباح": ["9ba7 el 5air", "9ba7 el fol", "9ba7o"],
        "مساء": ["msa2 el 5air", "msa2o", "msa2 el fol"],
        "يلا": ["yalla", "yalla bena", "ylla"],
        "خلاص": ["5las", "5alas", "5lset"],
        "مش": ["msh", "mesh", "msh keda"],
        "كده": ["keda", "kda", "keda keda"],
        "والله": ["wallah", "walahy", "walah"],
        "معلش": ["ma3lesh", "ma3lsh", "wala yhemak"],
        "بحبك": ["ba7ebak", "ba7bik", "ba7bko"]
    ]

    // Arabic to Franco phonetic characters mapping
    private let arToFrCharMap: [String: String] = [
        "ع": "3", "ح": "7", "خ": "5", "ء": "2", "أ": "2", "إ": "2", "آ": "2", "ئ": "2", "ؤ": "2",
        "ط": "6", "ظ": "6'", "ص": "9", "ض": "9'", "ق": "9", "غ": "8", "ش": "sh", "ث": "th",
        "ب": "b", "ت": "t", "ج": "g", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "س": "s",
        "ف": "f", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "a", "و": "w",
        "ي": "y", "ى": "a", "ا": "a", "لا": "la"
    ]

    // Key Subtitles (displayed prominently on Arabic keys)
    private let arKeyHints: [String: String] = [
        "ع": "3", "ح": "7", "خ": "5", "ء": "2", "أ": "2", "إ": "2", "آ": "2", "ئ": "2", "ؤ": "2",
        "ط": "6", "ظ": "6'", "ص": "9", "ض": "9'", "ق": "9", "غ": "8", "ش": "sh", "ث": "th",
        "ب": "b", "ت": "t", "ج": "g", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "س": "s",
        "ف": "f", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "a", "و": "w",
        "ي": "y", "ى": "a", "ا": "a", "لا": "la"
    ]

    private let frToArCharMap: [String: String] = [
        "3": "ع", "7": "ح", "5": "خ", "2": "أ", "6": "ط", "9": "ص", "8": "غ",
        "b": "ب", "t": "ت", "g": "ج", "d": "د", "z": "ز", "r": "ر", "s": "س",
        "f": "ف", "q": "ق", "k": "ك", "l": "ل", "m": "م", "n": "ن", "h": "ه",
        "w": "و", "y": "ي", "a": "ا", "e": "ي", "o": "و", "u": "و", "i": "ي",
        "c": "ك", "p": "ب", "v": "ف"
    ]

    // Arabic Keyboard Layout
    private let arRow1 = ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"]
    private let arRow2 = ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"]
    private let arRow3 = ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"]

    // Franco English QWERTY Layout
    private let enRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
    private let enRow2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
    private let enRow3 = ["z", "x", "c", "v", "b", "n", "m"]

    // Symbols Layout
    private let symRow1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    private let symRow2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""]
    private let symRow3 = ["?", "!", "'", ".", ",", "#", "%", "*", "+", "="]

    // Dedicated Franco Numerals & Quick Punctuation
    private let francoQuickKeys = [
        ("3", "ع"), ("7", "ح"), ("5", "خ"), ("2", "ء"),
        ("6", "ط"), ("9", "ص"), ("8", "غ"), ("'", "همزة"),
        ("?", "استفهام"), ("/", "سلاش")
    ]

    override func updateViewConstraints() {
        super.updateViewConstraints()
        setupHeightConstraint()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        setupHeightConstraint()
    }

    private func setupHeightConstraint() {
        if heightConstraint == nil {
            let height: CGFloat = 285
            heightConstraint = view.heightAnchor.constraint(equalToConstant: height)
            heightConstraint?.priority = UILayoutPriority(999)
            heightConstraint?.isActive = true
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        feedbackGenerator.prepare()
        buildReverseDictionary()
        setupUI()
    }

    private func buildReverseDictionary() {
        for (ar, fr) in francoDictionary {
            reverseFrancoDict[fr.lowercased()] = ar
        }
        reverseFrancoDict["ezayk"] = "ازيك"
        reverseFrancoDict["sa7bi"] = "صاحبي"
        reverseFrancoDict["7bebe"] = "حبيبي"
        reverseFrancoDict["tmm"] = "تمام"
        reverseFrancoDict["walahy"] = "والله"
    }

    private func setupUI() {
        view.backgroundColor = UIColor(red: 18/255, green: 22/255, blue: 30/255, alpha: 1.0)
        
        rootStackView = UIStackView()
        rootStackView.axis = .vertical
        rootStackView.spacing = 3
        rootStackView.distribution = .fill
        rootStackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(rootStackView)
        
        NSLayoutConstraint.activate([
            rootStackView.topAnchor.constraint(equalTo: view.topAnchor, constant: 4),
            rootStackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 4),
            rootStackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -4),
            rootStackView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -4)
        ])
        
        // 1. Top Control Bar: Instant Bidirectional Translate + Franco Toggle
        topControlBar = createTopControlBar()
        rootStackView.addArrangedSubview(topControlBar)
        
        // 2. Predictive Suggestions Bar (Smart Franco Suggestions)
        suggestionsBar = createSuggestionsBar()
        rootStackView.addArrangedSubview(suggestionsBar)
        
        // 3. Dedicated Franco Numerals Bar [ 3 (ع) | 7 (ح) | 5 (خ) | ... | ? | / ]
        francoDigitsBar = createFrancoDigitsBar()
        rootStackView.addArrangedSubview(francoDigitsBar)
        
        // 4. Main Keyboard Rows
        keysContainerStack = UIStackView()
        keysContainerStack.axis = .vertical
        keysContainerStack.spacing = 3
        keysContainerStack.distribution = .fillEqually
        rootStackView.addArrangedSubview(keysContainerStack)
        
        renderCurrentLayout()
        
        // 5. Bottom Navigation & Action Row (Globe | 123 | عربي/EN | ? | / | Spacebar | Return)
        bottomRowStack = createBottomRow()
        rootStackView.addArrangedSubview(bottomRowStack)
    }

    // MARK: - Bar Creators

    private func createTopControlBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 6
        stack.distribution = .fill
        stack.heightAnchor.constraint(equalToConstant: 30).isActive = true
        
        // 🔄 Instant Translate Button (عربي ⇄ فرانكو)
        let translateBtn = UIButton(type: .system)
        translateBtn.setTitle("🔄 ترجمة فورية", for: .normal)
        translateBtn.setTitleColor(.white, for: .normal)
        translateBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 11)
        translateBtn.backgroundColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 0.9)
        translateBtn.layer.cornerRadius = 6
        translateBtn.addTarget(self, action: #selector(handleTranslateTapped), for: .touchUpInside)
        translateBtn.widthAnchor.constraint(equalToConstant: 105).isActive = true
        stack.addArrangedSubview(translateBtn)
        
        // Mode Title / Status Pill
        francoToggleBtn = UIButton(type: .system)
        francoToggleBtn.setTitle("⚡ تحويل فرانكو: مفعل", for: .normal)
        francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        francoToggleBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 11)
        francoToggleBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.08)
        francoToggleBtn.layer.cornerRadius = 6
        francoToggleBtn.addTarget(self, action: #selector(toggleFrancoSmartMode), for: .touchUpInside)
        stack.addArrangedSubview(francoToggleBtn)
        
        return stack
    }

    private func createSuggestionsBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.distribution = .fillEqually
        stack.heightAnchor.constraint(equalToConstant: 28).isActive = true
        
        suggestionButtons = []
        let defaultSuggestions = ["ezayak", "3amel eh", "sa7by"]
        
        for text in defaultSuggestions {
            let btn = UIButton(type: .system)
            btn.setTitle(text, for: .normal)
            btn.setTitleColor(UIColor(red: 224/255, green: 242/255, blue: 254/255, alpha: 1.0), for: .normal)
            btn.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .semibold)
            btn.backgroundColor = UIColor(red: 30/255, green: 35/255, blue: 46/255, alpha: 1.0)
            btn.layer.cornerRadius = 5
            btn.layer.borderWidth = 0.5
            btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.12).cgColor
            btn.addTarget(self, action: #selector(suggestionTapped(_:)), for: .touchUpInside)
            suggestionButtons.append(btn)
            stack.addArrangedSubview(btn)
        }
        
        return stack
    }

    private func createFrancoDigitsBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 3
        stack.distribution = .fillEqually
        stack.heightAnchor.constraint(equalToConstant: 28).isActive = true
        
        for (digit, hint) in francoQuickKeys {
            let btn = UIButton(type: .system)
            let isSymbol = (digit == "?" || digit == "/")
            
            btn.setTitle(digit, for: .normal)
            btn.setTitleColor(isSymbol ? UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0) : UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
            btn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 13)
            btn.backgroundColor = isSymbol ? UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 0.15) : UIColor(white: 1.0, alpha: 0.08)
            btn.layer.cornerRadius = 5
            btn.layer.borderWidth = 0.5
            btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.12).cgColor
            btn.accessibilityHint = hint
            btn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        
        return stack
    }

    // MARK: - Layout Renderers

    private func renderCurrentLayout() {
        for subview in keysContainerStack.arrangedSubviews {
            keysContainerStack.removeArrangedSubview(subview)
            subview.removeFromSuperview()
        }
        
        switch currentMode {
        case .arabic:
            renderArabicLayout()
        case .francoEn:
            renderFrancoEnLayout()
        case .symbols:
            renderSymbolsLayout()
        }
    }

    private func renderArabicLayout() {
        keysContainerStack.addArrangedSubview(createKeyRowArabic(items: arRow1))
        keysContainerStack.addArrangedSubview(createKeyRowArabic(items: arRow2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 3
        row3Stack.distribution = .fillProportionally
        
        for l in arRow3 {
            let hint = arKeyHints[l]
            let btn = createKeyButtonWithHint(main: l, hint: hint)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        keysContainerStack.addArrangedSubview(row3Stack)
    }

    private func renderFrancoEnLayout() {
        keysContainerStack.addArrangedSubview(createKeyRowSimple(items: enRow1))
        keysContainerStack.addArrangedSubview(createKeyRowSimple(items: enRow2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 3
        row3Stack.distribution = .fillProportionally
        
        for l in enRow3 {
            let btn = createSimpleButton(title: l)
            btn.addTarget(self, action: #selector(directLetterPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        keysContainerStack.addArrangedSubview(row3Stack)
    }

    private func renderSymbolsLayout() {
        keysContainerStack.addArrangedSubview(createKeyRowSimple(items: symRow1))
        keysContainerStack.addArrangedSubview(createKeyRowSimple(items: symRow2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 3
        row3Stack.distribution = .fillProportionally
        
        for sym in symRow3 {
            let btn = createSimpleButton(title: sym)
            btn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        keysContainerStack.addArrangedSubview(row3Stack)
    }

    private func createKeyRowArabic(items: [String]) -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 3
        stack.distribution = .fillEqually
        for item in items {
            let hint = arKeyHints[item]
            let btn = createKeyButtonWithHint(main: item, hint: hint)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        return stack
    }

    private func createKeyRowSimple(items: [String]) -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 3
        stack.distribution = .fillEqually
        for item in items {
            let btn = createSimpleButton(title: item)
            btn.addTarget(self, action: #selector(directLetterPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        return stack
    }

    // Professional Key with prominent Arabic letter + Franco subtitle in cyan
    private func createKeyButtonWithHint(main: String, hint: String?) -> UIButton {
        let btn = UIButton(type: .custom)
        btn.setTitle(main, for: .normal)
        btn.setTitleColor(.clear, for: .normal)
        btn.accessibilityLabel = main
        btn.backgroundColor = UIColor(red: 35/255, green: 40/255, blue: 52/255, alpha: 1.0)
        btn.layer.cornerRadius = 6
        btn.layer.borderWidth = 0.5
        btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.14).cgColor
        
        let container = UIStackView()
        container.axis = .vertical
        container.alignment = .center
        container.distribution = .fillProportionally
        container.spacing = 0
        container.isUserInteractionEnabled = false
        container.translatesAutoresizingMaskIntoConstraints = false
        btn.addSubview(container)
        
        NSLayoutConstraint.activate([
            container.centerXAnchor.constraint(equalTo: btn.centerXAnchor),
            container.centerYAnchor.constraint(equalTo: btn.centerYAnchor),
            container.leadingAnchor.constraint(greaterThanOrEqualTo: btn.leadingAnchor, constant: 1),
            container.trailingAnchor.constraint(lessThanOrEqualTo: btn.trailingAnchor, constant: -1)
        ])
        
        let arLabel = UILabel()
        arLabel.text = main
        arLabel.textColor = .white
        arLabel.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        container.addArrangedSubview(arLabel)
        
        if let h = hint, !h.isEmpty {
            let frLabel = UILabel()
            frLabel.text = h
            let isDigit = ["3", "7", "5", "2", "6", "9", "8"].contains(h)
            frLabel.textColor = isDigit ? UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0) : UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
            frLabel.font = UIFont.systemFont(ofSize: isDigit ? 10 : 8, weight: .black)
            container.addArrangedSubview(frLabel)
        }
        
        return btn
    }

    private func createSimpleButton(title: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        btn.backgroundColor = UIColor(red: 35/255, green: 40/255, blue: 52/255, alpha: 1.0)
        btn.layer.cornerRadius = 6
        btn.layer.borderWidth = 0.5
        btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.12).cgColor
        return btn
    }

    private func createSpecialButton(title: String, width: CGFloat) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .semibold)
        btn.backgroundColor = UIColor(red: 26/255, green: 30/255, blue: 40/255, alpha: 1.0)
        btn.layer.cornerRadius = 6
        btn.widthAnchor.constraint(equalToConstant: width).isActive = true
        return btn
    }

    private func createBottomRow() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 3
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 38).isActive = true
        
        // 1. Globe Button (Apple iOS keyboard switcher)
        let globeBtn = UIButton(type: .system)
        globeBtn.setTitle("🌐", for: .normal)
        globeBtn.titleLabel?.font = UIFont.systemFont(ofSize: 18)
        globeBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.10)
        globeBtn.layer.cornerRadius = 6
        globeBtn.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        globeBtn.widthAnchor.constraint(equalToConstant: 36).isActive = true
        stack.addArrangedSubview(globeBtn)
        
        // 2. Layout Mode Switcher (عربي ⇄ Franco EN)
        langSwitchBtn = UIButton(type: .system)
        langSwitchBtn.setTitle(currentMode == .francoEn ? "عربي" : "EN", for: .normal)
        langSwitchBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        langSwitchBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 11)
        langSwitchBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        langSwitchBtn.layer.cornerRadius = 6
        langSwitchBtn.addTarget(self, action: #selector(toggleLanguageMode), for: .touchUpInside)
        langSwitchBtn.widthAnchor.constraint(equalToConstant: 40).isActive = true
        stack.addArrangedSubview(langSwitchBtn)
        
        // 3. Mode Switcher (123 / حروف)
        modeSwitchBtn = UIButton(type: .system)
        modeSwitchBtn.setTitle(currentMode == .symbols ? "حروف" : "123", for: .normal)
        modeSwitchBtn.setTitleColor(.white, for: .normal)
        modeSwitchBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 11)
        modeSwitchBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        modeSwitchBtn.layer.cornerRadius = 6
        modeSwitchBtn.addTarget(self, action: #selector(toggleSymbolsMode), for: .touchUpInside)
        modeSwitchBtn.widthAnchor.constraint(equalToConstant: 38).isActive = true
        stack.addArrangedSubview(modeSwitchBtn)
        
        // 4. Quick '?' Key
        let qBtn = createSpecialButton(title: "?", width: 30)
        qBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        qBtn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
        stack.addArrangedSubview(qBtn)
        
        // 5. Quick '/' Key
        let sBtn = createSpecialButton(title: "/", width: 30)
        sBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        sBtn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
        stack.addArrangedSubview(sBtn)
        
        // 6. Wide Spacebar
        let spaceBtn = UIButton(type: .system)
        spaceBtn.setTitle("مسافة • Space (Franco ⚡)", for: .normal)
        spaceBtn.setTitleColor(UIColor(white: 0.90, alpha: 1.0), for: .normal)
        spaceBtn.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        spaceBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.10)
        spaceBtn.layer.cornerRadius = 6
        spaceBtn.addTarget(self, action: #selector(spacePressed), for: .touchUpInside)
        stack.addArrangedSubview(spaceBtn)
        
        // 7. Quick '.' Key
        let dotBtn = createSpecialButton(title: ".", width: 28)
        dotBtn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
        stack.addArrangedSubview(dotBtn)
        
        // 8. Send / Return Key
        let returnBtn = UIButton(type: .system)
        returnBtn.setTitle("إرسال", for: .normal)
        returnBtn.setTitleColor(.white, for: .normal)
        returnBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 12)
        returnBtn.backgroundColor = UIColor(red: 2/255, green: 132/255, blue: 199/255, alpha: 1.0)
        returnBtn.layer.cornerRadius = 6
        returnBtn.addTarget(self, action: #selector(returnPressed), for: .touchUpInside)
        returnBtn.widthAnchor.constraint(equalToConstant: 54).isActive = true
        stack.addArrangedSubview(returnBtn)
        
        return stack
    }

    // MARK: - Smart Suggestions Engine

    private func updateSuggestions(for text: String) {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.isEmpty {
            updateSuggestionButtons(with: ["ezayak", "3amel eh", "sa7by"])
            return
        }

        if let list = smartSuggestionsMap[clean] {
            updateSuggestionButtons(with: list)
            return
        }

        if let direct = francoDictionary[clean] {
            updateSuggestionButtons(with: [direct, "\(direct) ya sa7by", "\(direct) gedan"])
            return
        }

        let phonetic = convertWordPhonetically(clean)
        updateSuggestionButtons(with: [phonetic, "\(phonetic) ya ghaly", "\(phonetic) تمام"])
    }

    private func updateSuggestionButtons(with list: [String]) {
        for (i, btn) in suggestionButtons.enumerated() {
            if i < list.count {
                btn.setTitle(list[i], for: .normal)
                btn.isHidden = false
            } else {
                btn.isHidden = true
            }
        }
    }

    @objc private func suggestionTapped(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        guard let choice = sender.currentTitle else { return }
        
        if !currentWordBuffer.isEmpty {
            let previousTypedLen = convertWordPhonetically(currentWordBuffer).count
            for _ in 0..<previousTypedLen {
                textDocumentProxy.deleteBackward()
            }
            currentWordBuffer = ""
        }
        
        textDocumentProxy.insertText(choice + " ")
        updateSuggestions(for: "")
    }

    // MARK: - Key Actions

    @objc private func letterPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        let title = sender.accessibilityLabel ?? sender.currentTitle ?? ""
        guard !title.isEmpty else { return }
        
        if isFrancoAutoConvert {
            currentWordBuffer.append(title)
            if let mapped = arToFrCharMap[title] {
                textDocumentProxy.insertText(mapped)
            } else {
                textDocumentProxy.insertText(title)
            }
            updateSuggestions(for: currentWordBuffer)
        } else {
            textDocumentProxy.insertText(title)
            currentWordBuffer.append(title)
            updateSuggestions(for: currentWordBuffer)
        }
    }

    @objc private func directLetterPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        guard let title = sender.currentTitle else { return }
        textDocumentProxy.insertText(title)
        currentWordBuffer.append(title)
        updateSuggestions(for: currentWordBuffer)
    }

    @objc private func digitPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        if let title = sender.currentTitle {
            textDocumentProxy.insertText(title)
            currentWordBuffer.append(title)
        }
    }

    @objc private func spacePressed() {
        feedbackGenerator.impactOccurred()
        
        // Intelligent Word Autocorrect on Space
        if isFrancoAutoConvert && !currentWordBuffer.isEmpty {
            if let authenticFranco = francoDictionary[currentWordBuffer] {
                let previousTypedLen = convertWordPhonetically(currentWordBuffer).count
                for _ in 0..<previousTypedLen {
                    textDocumentProxy.deleteBackward()
                }
                textDocumentProxy.insertText(authenticFranco)
            }
        }
        
        textDocumentProxy.insertText(" ")
        currentWordBuffer = ""
        updateSuggestions(for: "")
    }

    @objc private func backspacePressed() {
        feedbackGenerator.impactOccurred()
        textDocumentProxy.deleteBackward()
        if !currentWordBuffer.isEmpty {
            currentWordBuffer.removeLast()
            updateSuggestions(for: currentWordBuffer)
        }
    }

    @objc private func returnPressed() {
        feedbackGenerator.impactOccurred()
        textDocumentProxy.insertText("\n")
        currentWordBuffer = ""
        updateSuggestions(for: "")
    }

    @objc private func toggleSymbolsMode() {
        feedbackGenerator.impactOccurred()
        if currentMode == .symbols {
            currentMode = .arabic
        } else {
            currentMode = .symbols
        }
        updateModeButtons()
        renderCurrentLayout()
    }

    @objc private func toggleLanguageMode() {
        feedbackGenerator.impactOccurred()
        if currentMode == .francoEn {
            currentMode = .arabic
        } else {
            currentMode = .francoEn
        }
        updateModeButtons()
        renderCurrentLayout()
    }

    private func updateModeButtons() {
        langSwitchBtn?.setTitle(currentMode == .francoEn ? "عربي" : "EN", for: .normal)
        modeSwitchBtn?.setTitle(currentMode == .symbols ? "حروف" : "123", for: .normal)
    }

    @objc private func toggleFrancoSmartMode() {
        feedbackGenerator.impactOccurred()
        isFrancoAutoConvert.toggle()
        if isFrancoAutoConvert {
            francoToggleBtn.setTitle("⚡ تحويل فرانكو: مفعل", for: .normal)
            francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        } else {
            francoToggleBtn.setTitle("📝 كتابة عربي أصلية", for: .normal)
            francoToggleBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        }
    }

    @objc private func handleTranslateTapped() {
        feedbackGenerator.impactOccurred()
        
        guard let proxy = textDocumentProxy as? UITextDocumentProxy else { return }
        
        let beforeContext = proxy.documentContextBeforeInput ?? ""
        let trimmed = beforeContext.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if trimmed.isEmpty {
            textDocumentProxy.insertText("ezayak 3amel eh ya sa7by")
            return
        }
        
        let isArabic = trimmed.range(of: "\\p{Arabic}", options: .regularExpression) != nil
        let translated: String
        
        if isArabic {
            translated = translateFullArabicToFranco(trimmed)
        } else {
            translated = translateFullFrancoToArabic(trimmed)
        }
        
        for _ in 0..<beforeContext.count {
            proxy.deleteBackward()
        }
        
        proxy.insertText(translated)
        currentWordBuffer = ""
        updateSuggestions(for: "")
    }

    // MARK: - Translation Algorithms

    private func translateFullArabicToFranco(_ text: String) -> String {
        var result = text
        for (ar, fr) in francoDictionary {
            result = result.replacingOccurrences(of: ar, with: fr)
        }
        
        var phoneticResult = ""
        for char in result {
            let str = String(char)
            phoneticResult += arToFrCharMap[str] ?? str
        }
        return phoneticResult
    }

    private func translateFullFrancoToArabic(_ text: String) -> String {
        var lower = text.lowercased()
        for (fr, ar) in reverseFrancoDict {
            lower = lower.replacingOccurrences(of: fr, with: ar)
        }
        
        lower = lower.replacingOccurrences(of: "3'", with: "غ")
        lower = lower.replacingOccurrences(of: "9'", with: "ض")
        lower = lower.replacingOccurrences(of: "6'", with: "ظ")
        lower = lower.replacingOccurrences(of: "sh", with: "ش")
        lower = lower.replacingOccurrences(of: "th", with: "ث")
        lower = lower.replacingOccurrences(of: "kh", with: "خ")
        lower = lower.replacingOccurrences(of: "gh", with: "غ")
        lower = lower.replacingOccurrences(of: "la", with: "لا")
        
        var output = ""
        for char in lower {
            let str = String(char)
            output += frToArCharMap[str] ?? str
        }
        return output
    }

    private func convertWordPhonetically(_ word: String) -> String {
        var out = ""
        for char in word {
            let s = String(char)
            out += arToFrCharMap[s] ?? s
        }
        return out
    }
}
