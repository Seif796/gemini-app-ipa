import UIKit

@objc(KeyboardViewController)
class KeyboardViewController: UIInputViewController {

    private enum LayoutMode {
        case arabic
        case english
        case symbols
    }

    private var currentMode: LayoutMode = .arabic
    private var isFrancoEnabled: Bool = true
    private var isFrancoToArEnabled: Bool = false
    private var isCaps: Bool = false
    
    private var mainStackView: UIStackView!
    private var topBarStack: UIStackView!
    private var rowsStackView: UIStackView!
    private var modeSwitchBtn: UIButton!
    private var francoToggleBtn: UIButton!
    
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
    
    // MARK: - Dictionaries
    private let arToFrDict: [String: String] = [
        "ازيك": "ezayak",
        "ازيكم": "ezayoko",
        "ازيكوا": "ezayoko",
        "عامل ايه": "3amel eh",
        "عاملة ايه": "3amla eh",
        "الحمد لله": "el7md lellah",
        "الحمدلله": "el7mdllah",
        "شكرا": "shokran",
        "شكراً": "shokran",
        "حبيبي": "7bibi",
        "حبيبتي": "7bebti",
        "تمام": "tamam",
        "يلا": "yalla",
        "صاحبي": "sa7by",
        "فينك": "fenak",
        "بحبك": "ba7ebak",
        "حاضر": "7ader",
        "معلش": "ma3lesh",
        "ماشي": "mashy",
        "كده": "keda",
        "مش": "msh",
        "خلاص": "5las",
        "والله": "wallah",
        "كويس": "kwayes",
        "وحشتني": "wa7ashtny",
        "صباح الخير": "9ba7 el 5air",
        "مساء الخير": "msa2 el 5air",
        "تصبح على خير": "te9ba7 3la 5air"
    ]
    
    private let frToArDict: [String: String] = [
        "ezayak": "ازيك",
        "ezayek": "ازيك",
        "ezayk": "ازيك",
        "3amel eh": "عامل ايه",
        "el7mdllah": "الحمد لله",
        "el7md lellah": "الحمد لله",
        "shokran": "شكراً",
        "7bibi": "حبيبي",
        "tamam": "تمام",
        "yalla": "يلا",
        "sa7by": "صاحبي",
        "sa7bi": "صاحبي",
        "fenak": "فينك",
        "ba7ebak": "بحبك",
        "7ader": "حاضر",
        "ma3lesh": "معلش",
        "mashy": "ماشي",
        "keda": "كده",
        "msh": "مش",
        "mesh": "مش",
        "5las": "خلاص",
        "wallah": "والله",
        "kwayes": "كويس",
        "wa7ashtny": "وحشتني"
    ]

    // Character maps
    private let arToFrMap: [String: String] = [
        "ع": "3", "ح": "7", "خ": "5", "ء": "2", "أ": "2", "إ": "2", "آ": "2", "ئ": "2", "ؤ": "2",
        "ط": "6", "ظ": "6'", "ص": "9", "ض": "9'", "ق": "9", "غ": "3'", "ش": "sh", "ث": "th",
        "ب": "b", "ت": "t", "ج": "g", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "س": "s",
        "ف": "f", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "a", "و": "w",
        "ي": "y", "ى": "a", "ا": "a", "لا": "la"
    ]

    private let frToArMap: [String: String] = [
        "3": "ع", "7": "ح", "5": "خ", "2": "أ", "6": "ط", "9": "ص", "8": "غ",
        "b": "ب", "t": "ت", "g": "ج", "d": "د", "z": "ز", "r": "ر", "s": "س",
        "f": "ف", "q": "ق", "k": "ك", "l": "ل", "m": "م", "n": "ن", "h": "ه",
        "w": "و", "y": "ي", "a": "ا", "e": "ي", "o": "و", "u": "و", "i": "ي",
        "c": "ك", "p": "ب", "v": "ف"
    ]

    // Layout Rows
    private let arRow1 = ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"]
    private let arRow2 = ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"]
    private let arRow3 = ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"]

    private let enRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
    private let enRow2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
    private let enRow3 = ["z", "x", "c", "v", "b", "n", "m"]

    private let symRow1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    private let symRow2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""]
    private let symRow3 = ["?", "!", "'", ".", ",", "#", "%", "*", "+", "="]

    override func viewDidLoad() {
        super.viewDidLoad()
        feedbackGenerator.prepare()
        setupUI()
    }

    private func setupUI() {
        view.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        
        mainStackView = UIStackView()
        mainStackView.axis = .vertical
        mainStackView.spacing = 5
        mainStackView.distribution = .fillProportionally
        mainStackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(mainStackView)
        
        NSLayoutConstraint.activate([
            mainStackView.topAnchor.constraint(equalTo: view.topAnchor, constant: 5),
            mainStackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 4),
            mainStackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -4),
            mainStackView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -5)
        ])
        
        // 1. Top Bar: Translate Button + Franco Mode + Quick Digits/Symbols (?, /, !)
        topBarStack = createTopBar()
        mainStackView.addArrangedSubview(topBarStack)
        
        // 2. Main Rows Container
        rowsStackView = UIStackView()
        rowsStackView.axis = .vertical
        rowsStackView.spacing = 5
        rowsStackView.distribution = .fillEqually
        mainStackView.addArrangedSubview(rowsStackView)
        
        renderCurrentLayout()
        
        // 3. Bottom Row: Globe + Layout Switch (123) + Quick Punctuation (?, /) + Space + Return
        let bottomRow = createBottomRow()
        mainStackView.addArrangedSubview(bottomRow)
    }

    private func createTopBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 34).isActive = true
        
        // 1. Bidirectional Instant Translate Button (عربي ⇄ فرانكو)
        let translateBtn = UIButton(type: .system)
        translateBtn.setTitle("🔄 ترجمة", for: .normal)
        translateBtn.setTitleColor(.white, for: .normal)
        translateBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 12)
        translateBtn.backgroundColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 0.85) // Emerald
        translateBtn.layer.cornerRadius = 8
        translateBtn.addTarget(self, action: #selector(handleTranslateButton), for: .touchUpInside)
        translateBtn.widthAnchor.constraint(equalToConstant: 68).isActive = true
        stack.addArrangedSubview(translateBtn)
        
        // 2. Franco Live Conversion Toggle
        francoToggleBtn = UIButton(type: .system)
        francoToggleBtn.setTitle("⚡ فرانكو", for: .normal)
        francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        francoToggleBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 11)
        francoToggleBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        francoToggleBtn.layer.cornerRadius = 8
        francoToggleBtn.addTarget(self, action: #selector(toggleFrancoMode), for: .touchUpInside)
        francoToggleBtn.widthAnchor.constraint(equalToConstant: 64).isActive = true
        stack.addArrangedSubview(francoToggleBtn)
        
        // 3. Quick Punctuation & Franco Digits (?, /, !, 3, 7, 5, 2)
        let quickStrip = ["?", "/", "!", "3", "7", "5", "2", "6", "9"]
        for symbol in quickStrip {
            let btn = UIButton(type: .system)
            btn.setTitle(symbol, for: .normal)
            btn.setTitleColor(symbol == "?" || symbol == "/" || symbol == "!" ? UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0) : UIColor.white, for: .normal)
            btn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 14)
            btn.backgroundColor = UIColor(white: 1.0, alpha: 0.08)
            btn.layer.cornerRadius = 7
            btn.addTarget(self, action: #selector(directInsertPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        
        return stack
    }

    private func renderCurrentLayout() {
        for subview in rowsStackView.arrangedSubviews {
            rowsStackView.removeArrangedSubview(subview)
            subview.removeFromSuperview()
        }
        
        switch currentMode {
        case .arabic:
            renderArabicLayout()
        case .english:
            renderEnglishLayout()
        case .symbols:
            renderSymbolsLayout()
        }
    }

    private func renderArabicLayout() {
        rowsStackView.addArrangedSubview(createKeyRow(items: arRow1))
        rowsStackView.addArrangedSubview(createKeyRow(items: arRow2))
        
        let row3 = UIStackView()
        row3.axis = .horizontal
        row3.spacing = 3
        row3.distribution = .fillProportionally
        
        for letter in arRow3 {
            let btn = createKeyButton(title: letter)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            row3.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3.addArrangedSubview(backBtn)
        
        rowsStackView.addArrangedSubview(row3)
    }

    private func renderEnglishLayout() {
        let row1 = isCaps ? enRow1.map { $0.uppercased() } : enRow1
        let row2 = isCaps ? enRow2.map { $0.uppercased() } : enRow2
        let row3 = isCaps ? enRow3.map { $0.uppercased() } : enRow3
        
        rowsStackView.addArrangedSubview(createKeyRow(items: row1))
        rowsStackView.addArrangedSubview(createKeyRow(items: row2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 4
        row3Stack.distribution = .fillProportionally
        
        let shiftBtn = createSpecialButton(title: isCaps ? "⬆" : "⇧", width: 42)
        shiftBtn.addTarget(self, action: #selector(shiftPressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(shiftBtn)
        
        for letter in row3 {
            let btn = createKeyButton(title: letter)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 42)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        rowsStackView.addArrangedSubview(row3Stack)
    }

    private func renderSymbolsLayout() {
        rowsStackView.addArrangedSubview(createKeyRow(items: symRow1))
        rowsStackView.addArrangedSubview(createKeyRow(items: symRow2))
        
        let row3Stack = UIStackView()
        row3Stack.axis = .horizontal
        row3Stack.spacing = 3
        row3Stack.distribution = .fillProportionally
        
        for sym in symRow3 {
            let btn = createKeyButton(title: sym)
            btn.addTarget(self, action: #selector(directInsertPressed(_:)), for: .touchUpInside)
            row3Stack.addArrangedSubview(btn)
        }
        
        let backBtn = createSpecialButton(title: "⌫", width: 44)
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        row3Stack.addArrangedSubview(backBtn)
        
        rowsStackView.addArrangedSubview(row3Stack)
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
        stack.spacing = 5
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 42).isActive = true
        
        // 1. Globe Button (Apple iOS keyboard switcher)
        let globeBtn = UIButton(type: .system)
        globeBtn.setTitle("🌐", for: .normal)
        globeBtn.titleLabel?.font = UIFont.systemFont(ofSize: 20)
        globeBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        globeBtn.layer.cornerRadius = 8
        globeBtn.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        globeBtn.widthAnchor.constraint(equalToConstant: 42).isActive = true
        stack.addArrangedSubview(globeBtn)
        
        // 2. Mode Switch Button (123 / عربي / ABC)
        modeSwitchBtn = UIButton(type: .system)
        updateModeSwitchTitle()
        modeSwitchBtn.setTitleColor(UIColor.white, for: .normal)
        modeSwitchBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 12)
        modeSwitchBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.16)
        modeSwitchBtn.layer.cornerRadius = 8
        modeSwitchBtn.addTarget(self, action: #selector(cycleLayoutMode), for: .touchUpInside)
        modeSwitchBtn.widthAnchor.constraint(equalToConstant: 46).isActive = true
        stack.addArrangedSubview(modeSwitchBtn)
        
        // 3. Quick '?' Button (requested by user)
        let questionBtn = createKeyButton(title: "?")
        questionBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        questionBtn.addTarget(self, action: #selector(directInsertPressed(_:)), for: .touchUpInside)
        questionBtn.widthAnchor.constraint(equalToConstant: 34).isActive = true
        stack.addArrangedSubview(questionBtn)

        // 4. Quick '/' Button (requested by user)
        let slashBtn = createKeyButton(title: "/")
        slashBtn.setTitleColor(UIColor(red: 251/255, green: 191/255, blue: 36/255, alpha: 1.0), for: .normal)
        slashBtn.addTarget(self, action: #selector(directInsertPressed(_:)), for: .touchUpInside)
        slashBtn.widthAnchor.constraint(equalToConstant: 34).isActive = true
        stack.addArrangedSubview(slashBtn)

        // 5. Spacebar
        let spaceBtn = UIButton(type: .system)
        spaceBtn.setTitle("مسافة • Space", for: .normal)
        spaceBtn.setTitleColor(UIColor(white: 0.85, alpha: 1.0), for: .normal)
        spaceBtn.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        spaceBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        spaceBtn.layer.cornerRadius = 8
        spaceBtn.addTarget(self, action: #selector(spacePressed), for: .touchUpInside)
        stack.addArrangedSubview(spaceBtn)
        
        // 6. Quick '.' Button
        let dotBtn = createKeyButton(title: ".")
        dotBtn.addTarget(self, action: #selector(directInsertPressed(_:)), for: .touchUpInside)
        dotBtn.widthAnchor.constraint(equalToConstant: 32).isActive = true
        stack.addArrangedSubview(dotBtn)

        // 7. Return / Send Button
        let returnBtn = UIButton(type: .system)
        returnBtn.setTitle("إرسال", for: .normal)
        returnBtn.setTitleColor(UIColor.white, for: .normal)
        returnBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 13)
        returnBtn.backgroundColor = UIColor(red: 2/255, green: 132/255, blue: 199/255, alpha: 1.0)
        returnBtn.layer.cornerRadius = 8
        returnBtn.addTarget(self, action: #selector(returnPressed), for: .touchUpInside)
        returnBtn.widthAnchor.constraint(equalToConstant: 62).isActive = true
        stack.addArrangedSubview(returnBtn)
        
        return stack
    }

    private func updateModeSwitchTitle() {
        switch currentMode {
        case .arabic:
            modeSwitchBtn?.setTitle("123", for: .normal)
        case .symbols:
            modeSwitchBtn?.setTitle("ABC", for: .normal)
        case .english:
            modeSwitchBtn?.setTitle("عربي", for: .normal)
        }
    }

    private func createKeyButton(title: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
        btn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        btn.layer.cornerRadius = 7
        btn.layer.borderWidth = 0.5
        btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.15).cgColor
        return btn
    }
    
    private func createSpecialButton(title: String, width: CGFloat) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        btn.backgroundColor = UIColor(white: 1.0, alpha: 0.20)
        btn.layer.cornerRadius = 7
        btn.widthAnchor.constraint(equalToConstant: width).isActive = true
        return btn
    }

    // MARK: - Instant Translation Actions

    @objc private func handleTranslateButton() {
        feedbackGenerator.impactOccurred()
        guard let context = textDocumentProxy.documentContextBeforeInput, !context.isEmpty else {
            return
        }

        let translatedText: String
        if hasArabicLetters(text: context) {
            translatedText = translateArabicToFranco(text: context)
        } else {
            translatedText = translateFrancoToArabic(text: context)
        }

        // Delete previous context and insert translated text
        for _ in 0..<context.count {
            textDocumentProxy.deleteBackward()
        }
        textDocumentProxy.insertText(translatedText)
    }

    private func hasArabicLetters(text: String) -> Bool {
        for scalar in text.unicodeScalars {
            if (0x0600...0x06FF).contains(scalar.value) || (0x0750...0x077F).contains(scalar.value) {
                return true
            }
        }
        return false
    }

    private func translateArabicToFranco(text: String) -> String {
        var result = text
        for (ar, fr) in arToFrDict {
            result = result.replacingOccurrences(of: ar, with: fr)
        }
        var output = ""
        for char in result {
            let str = String(char)
            output += arToFrMap[str] ?? str
        }
        return output
    }

    private func translateFrancoToArabic(text: String) -> String {
        var lower = text.lowercased()
        for (fr, ar) in frToArDict {
            lower = lower.replacingOccurrences(of: fr, with: ar)
        }
        
        // Multi-char Franco tokens
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
            output += frToArMap[str] ?? str
        }
        return output
    }

    // MARK: - Key Events

    @objc private func toggleFrancoMode() {
        feedbackGenerator.impactOccurred()
        isFrancoEnabled.toggle()
        if isFrancoEnabled {
            francoToggleBtn.setTitle("⚡ فرانكو", for: .normal)
            francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        } else {
            francoToggleBtn.setTitle("عادي", for: .normal)
            francoToggleBtn.setTitleColor(UIColor.lightGray, for: .normal)
        }
    }

    @objc private func cycleLayoutMode() {
        feedbackGenerator.impactOccurred()
        switch currentMode {
        case .arabic:
            currentMode = .symbols
        case .symbols:
            currentMode = .english
        case .english:
            currentMode = .arabic
        }
        updateModeSwitchTitle()
        renderCurrentLayout()
    }

    @objc private func shiftPressed() {
        feedbackGenerator.impactOccurred()
        isCaps.toggle()
        renderCurrentLayout()
    }

    @objc private func letterPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        guard let title = sender.currentTitle else { return }
        
        if currentMode == .arabic && isFrancoEnabled, let francoChar = arToFrMap[title] {
            textDocumentProxy.insertText(francoChar)
        } else if currentMode == .english && isFrancoToArEnabled, let arChar = frToArMap[title.lowercased()] {
            textDocumentProxy.insertText(arChar)
        } else {
            textDocumentProxy.insertText(title)
        }
    }

    @objc private func directInsertPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        if let title = sender.currentTitle {
            textDocumentProxy.insertText(title)
        }
    }

    @objc private func backspacePressed() {
        feedbackGenerator.impactOccurred()
        textDocumentProxy.deleteBackward()
    }

    @objc private func spacePressed() {
        feedbackGenerator.impactOccurred()
        textDocumentProxy.insertText(" ")
    }

    @objc private func returnPressed() {
        feedbackGenerator.impactOccurred()
        textDocumentProxy.insertText("\n")
    }
}
