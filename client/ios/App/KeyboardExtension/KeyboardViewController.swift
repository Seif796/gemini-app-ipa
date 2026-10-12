import UIKit

@objc(KeyboardViewController)
class KeyboardViewController: UIInputViewController {

    private enum LayoutMode {
        case franco    // English QWERTY with Franco numerals & prediction
        case arabic    // Arabic layout with real-time Franco word-converter
        case symbols   // Numbers & punctuation (?, /, !, @, #, etc.)
    }

    private var currentMode: LayoutMode = .franco
    private var isFrancoAutoConvert: Bool = true
    private var isCaps: Bool = false
    
    // UI Containers
    private var rootStackView: UIStackView!
    private var topControlBar: UIStackView!
    private var suggestionsBar: UIStackView!
    private var francoDigitsBar: UIStackView!
    private var keysContainerStack: UIStackView!
    private var bottomRowStack: UIStackView!
    
    private var modeSwitchBtn: UIButton!
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
    
    // Reverse Franco to Arabic Map
    private var reverseFrancoDict: [String: String] = [:]
    
    // Suggestions list for auto-complete bar
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

    // Arabic to Franco phonetic characters
    private let arToFrCharMap: [String: String] = [
        "ع": "3", "ح": "7", "خ": "5", "ء": "2", "أ": "2", "إ": "2", "آ": "2", "ئ": "2", "ؤ": "2",
        "ط": "6", "ظ": "6'", "ص": "9", "ض": "9'", "ق": "9", "غ": "3'", "ش": "sh", "ث": "th",
        "ب": "b", "ت": "t", "ج": "g", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "س": "s",
        "ف": "f", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "a", "و": "w",
        "ي": "y", "ى": "a", "ا": "a", "لا": "la"
    ]

    // Franco numerals to Arabic
    private let frToArCharMap: [String: String] = [
        "3": "ع", "7": "ح", "5": "خ", "2": "أ", "6": "ط", "9": "ص", "8": "غ",
        "b": "ب", "t": "ت", "g": "ج", "d": "د", "z": "ز", "r": "ر", "s": "س",
        "f": "ف", "q": "ق", "k": "ك", "l": "ل", "m": "م", "n": "ن", "h": "ه",
        "w": "و", "y": "ي", "a": "ا", "e": "ي", "o": "و", "u": "و", "i": "ي",
        "c": "ك", "p": "ب", "v": "ف"
    ]

    // Rows layout
    private let enRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
    private let enRow2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
    private let enRow3 = ["z", "x", "c", "v", "b", "n", "m"]

    private let arRow1 = ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"]
    private let arRow2 = ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"]
    private let arRow3 = ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"]

    private let symRow1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    private let symRow2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""]
    private let symRow3 = ["?", "!", "'", ".", ",", "#", "%", "*", "+", "="]

    // Dedicated Franco Numerals & Quick Punctuation
    private let francoQuickKeys = [
        ("3", "ع"), ("7", "ح"), ("5", "خ"), ("2", "ء"),
        ("6", "ط"), ("9", "ص"), ("8", "غ"), ("'", "همزة"),
        ("?", "استفهام"), ("/", "سلاش")
    ]

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
        // iOS Dark Mode System Keyboard Palette
        view.backgroundColor = UIColor(red: 22/255, green: 24/255, blue: 31/255, alpha: 1.0)
        
        rootStackView = UIStackView()
        rootStackView.axis = .vertical
        rootStackView.spacing = 4
        rootStackView.distribution = .fillProportionally
        rootStackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(rootStackView)
        
        NSLayoutConstraint.activate([
            rootStackView.topAnchor.constraint(equalTo: view.topAnchor, constant: 4),
            rootStackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 4),
            rootStackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -4),
            rootStackView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -5)
        ])
        
        // 1. Top Control Bar: Instant Bidirectional Translate + Mode Switch
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
        keysContainerStack.spacing = 4
        keysContainerStack.distribution = .fillEqually
        rootStackView.addArrangedSubview(keysContainerStack)
        
        renderCurrentLayout()
        
        // 5. Bottom Navigation & Action Row (Globe | 123 | ? | / | Spacebar | . | Return)
        bottomRowStack = createBottomRow()
        rootStackView.addArrangedSubview(bottomRowStack)
    }

    // MARK: - Bar Creators

    private func createTopControlBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 6
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 32).isActive = true
        
        // 🔄 Instant Translate Button (عربي ⇄ فرانكو)
        let translateBtn = UIButton(type: .system)
        translateBtn.setTitle("🔄 ترجمة فورية", for: .normal)
        translateBtn.setTitleColor(.white, for: .normal)
        translateBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 12)
        translateBtn.backgroundColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 0.9) // Emerald
        translateBtn.layer.cornerRadius = 7
        translateBtn.addTarget(self, action: #selector(handleTranslateTapped), for: .touchUpInside)
        translateBtn.widthAnchor.constraint(equalToConstant: 95).isActive = true
        stack.addArrangedSubview(translateBtn)
        
        // Mode Title / Status Pill
        francoToggleBtn = UIButton(type: .system)
        francoToggleBtn.setTitle("⚡ كيبورد الفرانكو الذكي", for: .normal)
        francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        francoToggleBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 11)
        francoToggleBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.08)
        francoToggleBtn.layer.cornerRadius = 7
        francoToggleBtn.addTarget(self, action: #selector(toggleFrancoSmartMode), for: .touchUpInside)
        stack.addArrangedSubview(francoToggleBtn)
        
        // Language Toggle button (AR / EN)
        let langBtn = UIButton(type: .system)
        langBtn.setTitle(currentMode == .franco ? "عربي ⇄" : "Franco ⇄", for: .normal)
        langBtn.setTitleColor(UIColor.white, for: .normal)
        langBtn.titleLabel?.font = UIFont.systemFont(ofSize: 11, weight: .bold)
        langBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        langBtn.layer.cornerRadius = 7
        langBtn.addTarget(self, action: #selector(switchPrimaryLanguage), for: .touchUpInside)
        langBtn.widthAnchor.constraint(equalToConstant: 72).isActive = true
        stack.addArrangedSubview(langBtn)
        
        return stack
    }

    private func createSuggestionsBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 5
        stack.distribution = .fillEqually
        stack.heightAnchor.constraint(equalToConstant: 30).isActive = true
        
        suggestionButtons = []
        let defaultSuggestions = ["ezayak", "3amel eh", "sa7by"]
        
        for text in defaultSuggestions {
            let btn = UIButton(type: .system)
            btn.setTitle(text, for: .normal)
            btn.setTitleColor(UIColor(red: 224/255, green: 242/255, blue: 254/255, alpha: 1.0), for: .normal)
            btn.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .semibold)
            btn.backgroundColor = UIColor(red: 35/255, green: 40/255, blue: 52/255, alpha: 1.0)
            btn.layer.cornerRadius = 6
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
        stack.heightAnchor.constraint(equalToConstant: 32).isActive = true
        
        for (digit, hint) in francoQuickKeys {
            let btn = UIButton(type: .system)
            let isSymbol = (digit == "?" || digit == "/")
            
            // Title with subscript styling
            btn.setTitle("\(digit)", for: .normal)
            btn.setTitleColor(isSymbol ? UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0) : UIColor.white, for: .normal)
            btn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 14)
            btn.backgroundColor = isSymbol ? UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 0.14) : UIColor(white: 1.0, alpha: 0.08)
            btn.layer.cornerRadius = 6
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
        case .franco:
            renderFrancoLayout()
        case .arabic:
            renderArabicLayout()
        case .symbols:
            renderSymbolsLayout()
        }
    }

    private func renderFrancoLayout() {
        let r1 = isCaps ? enRow1.map { $0.uppercased() } : enRow1
        let r2 = isCaps ? enRow2.map { $0.uppercased() } : enRow2
        let r3 = isCaps ? enRow3.map { $0.uppercased() } : enRow3
        
        keysContainerStack.addArrangedSubview(createKeyRow(items: r1))
        keysContainerStack.addArrangedSubview(createKeyRow(items: r2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 4
        row3Stack.distribution = .fillProportionally
        
        let shiftBtn = createSpecialButton(title: isCaps ? "⬆" : "⇧", width: 42)
        shiftBtn.addTarget(self, action: #selector(shiftPressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(shiftBtn)
        
        for l in r3 {
            let btn = createKeyButton(title: l)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        keysContainerStack.addArrangedSubview(row3Stack)
    }

    private func renderArabicLayout() {
        keysContainerStack.addArrangedSubview(createKeyRow(items: arRow1))
        keysContainerStack.addArrangedSubview(createKeyRow(items: arRow2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 3
        row3Stack.distribution = .fillProportionally
        
        for l in arRow3 {
            let btn = createKeyButton(title: l)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        keysContainerStack.addArrangedSubview(row3Stack)
    }

    private func renderSymbolsLayout() {
        keysContainerStack.addArrangedSubview(createKeyRow(items: symRow1))
        keysContainerStack.addArrangedSubview(createKeyRow(items: symRow2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 3
        row3Stack.distribution = .fillProportionally
        
        for sym in symRow3 {
            let btn = createKeyButton(title: sym)
            btn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        keysContainerStack.addArrangedSubview(row3Stack)
    }

    private func createKeyRow(items: [String]) -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 3
        stack.distribution = .fillEqually
        for item in items {
            let btn = createKeyButton(title: item)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        return stack
    }

    private func createBottomRow() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 42).isActive = true
        
        // 1. Globe Button (Apple iOS keyboard switcher)
        let globeBtn = UIButton(type: .system)
        globeBtn.setTitle("🌐", for: .normal)
        globeBtn.titleLabel?.font = UIFont.systemFont(ofSize: 20)
        globeBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        globeBtn.layer.cornerRadius = 7
        globeBtn.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        globeBtn.widthAnchor.constraint(equalToConstant: 40).isActive = true
        stack.addArrangedSubview(globeBtn)
        
        // 2. Mode Switcher (123 / Franco / عربي)
        modeSwitchBtn = UIButton(type: .system)
        updateModeSwitchTitle()
        modeSwitchBtn.setTitleColor(.white, for: .normal)
        modeSwitchBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 12)
        modeSwitchBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.16)
        modeSwitchBtn.layer.cornerRadius = 7
        modeSwitchBtn.addTarget(self, action: #selector(cycleLayoutMode), for: .touchUpInside)
        modeSwitchBtn.widthAnchor.constraint(equalToConstant: 44).isActive = true
        stack.addArrangedSubview(modeSwitchBtn)
        
        // 3. Quick '?' Key
        let qBtn = createSpecialButton(title: "?", width: 34)
        qBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        qBtn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
        stack.addArrangedSubview(qBtn)
        
        // 4. Quick '/' Key
        let sBtn = createSpecialButton(title: "/", width: 34)
        sBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        sBtn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
        stack.addArrangedSubview(sBtn)
        
        // 5. Wide Spacebar
        let spaceBtn = UIButton(type: .system)
        spaceBtn.setTitle("مسافة • Space (Franco)", for: .normal)
        spaceBtn.setTitleColor(UIColor(white: 0.88, alpha: 1.0), for: .normal)
        spaceBtn.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        spaceBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        spaceBtn.layer.cornerRadius = 7
        spaceBtn.addTarget(self, action: #selector(spacePressed), for: .touchUpInside)
        stack.addArrangedSubview(spaceBtn)
        
        // 6. Quick '.' Key
        let dotBtn = createSpecialButton(title: ".", width: 32)
        dotBtn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
        stack.addArrangedSubview(dotBtn)
        
        // 7. Send / Return Key
        let returnBtn = UIButton(type: .system)
        returnBtn.setTitle("إرسال", for: .normal)
        returnBtn.setTitleColor(.white, for: .normal)
        returnBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 13)
        returnBtn.backgroundColor = UIColor(red: 2/255, green: 132/255, blue: 199/255, alpha: 1.0)
        returnBtn.layer.cornerRadius = 7
        returnBtn.addTarget(self, action: #selector(returnPressed), for: .touchUpInside)
        returnBtn.widthAnchor.constraint(equalToConstant: 62).isActive = true
        stack.addArrangedSubview(returnBtn)
        
        return stack
    }

    private func createKeyButton(title: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
        btn.backgroundColor = UIColor(red: 46/255, green: 50/255, blue: 62/255, alpha: 1.0)
        btn.layer.cornerRadius = 6
        btn.layer.borderWidth = 0.5
        btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.12).cgColor
        return btn
    }

    private func createSpecialButton(title: String, width: CGFloat) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
        btn.backgroundColor = UIColor(red: 35/255, green: 38/255, blue: 48/255, alpha: 1.0)
        btn.layer.cornerRadius = 6
        btn.widthAnchor.constraint(equalToConstant: width).isActive = true
        return btn
    }

    private func updateModeSwitchTitle() {
        switch currentMode {
        case .franco:
            modeSwitchBtn?.setTitle("123", for: .normal)
        case .arabic:
            modeSwitchBtn?.setTitle("123", for: .normal)
        case .symbols:
            modeSwitchBtn?.setTitle("ABC", for: .normal)
        }
    }

    // MARK: - Smart Suggestions & Dictionary Engine

    private func updateSuggestions(for text: String) {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.isEmpty {
            updateSuggestionButtons(with: ["ezayak", "3amel eh", "sa7by"])
            return
        }

        // Check if exact match in suggestion map
        if let list = smartSuggestionsMap[clean] {
            updateSuggestionButtons(with: list)
            return
        }

        // Check dictionary for word
        if let direct = francoDictionary[clean] {
            updateSuggestionButtons(with: [direct, "\(direct) ya sa7by", "\(direct) gedan"])
            return
        }

        // Phonetic convert fallback
        let phonetic = convertWordPhonetically(clean)
        updateSuggestionButtons(with: [phonetic, "\(phonetic) ya ghaly", "\(phonetic) tamam"])
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
        
        // If word buffer is present, replace it
        if !currentWordBuffer.isEmpty {
            for _ in 0..<currentWordBuffer.count {
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
        guard let title = sender.currentTitle else { return }
        
        if currentMode == .arabic && isFrancoAutoConvert {
            currentWordBuffer.append(title)
            // Real-time phonetic mapping or dictionary preview
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

    @objc private func digitPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        if let title = sender.currentTitle {
            textDocumentProxy.insertText(title)
            currentWordBuffer.append(title)
        }
    }

    @objc private func spacePressed() {
        feedbackGenerator.impactOccurred()
        
        // Intelligent Word Autocorrect on Space in Arabic mode
        if currentMode == .arabic && isFrancoAutoConvert && !currentWordBuffer.isEmpty {
            if let authenticFranco = francoDictionary[currentWordBuffer] {
                // Delete previous phonetic letters and insert real Egyptian Franco slang
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

    @objc private func shiftPressed() {
        feedbackGenerator.impactOccurred()
        isCaps.toggle()
        renderCurrentLayout()
    }

    @objc private func switchPrimaryLanguage() {
        feedbackGenerator.impactOccurred()
        currentMode = (currentMode == .franco) ? .arabic : .franco
        updateModeSwitchTitle()
        renderCurrentLayout()
    }

    @objc private func cycleLayoutMode() {
        feedbackGenerator.impactOccurred()
        switch currentMode {
        case .franco:
            currentMode = .symbols
        case .arabic:
            currentMode = .symbols
        case .symbols:
            currentMode = .franco
        }
        updateModeSwitchTitle()
        renderCurrentLayout()
    }

    @objc private func toggleFrancoSmartMode() {
        feedbackGenerator.impactOccurred()
        isFrancoAutoConvert.toggle()
        if isFrancoAutoConvert {
            francoToggleBtn.setTitle("⚡ كيبورد الفرانكو الذكي", for: .normal)
            francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        } else {
            francoToggleBtn.setTitle("كتابة عادية", for: .normal)
            francoToggleBtn.setTitleColor(UIColor.lightGray, for: .normal)
        }
    }

    // MARK: - 🔄 Full Bidirectional Translation (One-Tap In WhatsApp)

    @objc private func handleTranslateTapped() {
        feedbackGenerator.impactOccurred()
        guard let context = textDocumentProxy.documentContextBeforeInput, !context.isEmpty else {
            return
        }

        let translated: String
        if hasArabicLetters(context) {
            translated = translateFullArabicToFranco(context)
        } else {
            translated = translateFullFrancoToArabic(context)
        }

        for _ in 0..<context.count {
            textDocumentProxy.deleteBackward()
        }
        textDocumentProxy.insertText(translated)
        currentWordBuffer = ""
    }

    private func hasArabicLetters(_ text: String) -> Bool {
        for scalar in text.unicodeScalars {
            if (0x0600...0x06FF).contains(scalar.value) || (0x0750...0x077F).contains(scalar.value) {
                return true
            }
        }
        return false
    }

    private func translateFullArabicToFranco(_ text: String) -> String {
        var result = text
        for (ar, fr) in francoDictionary {
            result = result.replacingOccurrences(of: ar, with: fr)
        }
        var output = ""
        for char in result {
            let str = String(char)
            output += arToFrCharMap[str] ?? str
        }
        return output
    }

    private func translateFullFrancoToArabic(_ text: String) -> String {
        var lower = text.lowercased()
        for (fr, ar) in reverseFrancoDict {
            lower = lower.replacingOccurrences(of: fr, with: ar)
        }
        
        // Multi-char Franco digrams
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
