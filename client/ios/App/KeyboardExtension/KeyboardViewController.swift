import UIKit

@objc(KeyboardViewController)
class KeyboardViewController: UIInputViewController {

    private var isFrancoEnabled: Bool = true
    private var isEnglishMode: Bool = false
    private var isCaps: Bool = false
    
    private var mainStackView: UIStackView!
    private var topBarStack: UIStackView!
    private var rowsStackView: UIStackView!
    
    private var francoToggleBtn: UIButton!
    private var langToggleBtn: UIButton!
    
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
    
    // Arabic to Franco Phonetic Mapping
    private let francoMap: [String: String] = [
        "ع": "3",
        "ح": "7",
        "خ": "5",
        "ء": "2",
        "أ": "2",
        "إ": "2",
        "آ": "2",
        "ئ": "2",
        "ؤ": "2",
        "ط": "6",
        "ظ": "6'",
        "ص": "9",
        "ض": "9'",
        "ق": "q",
        "غ": "3'",
        "ش": "sh",
        "ث": "th",
        "ب": "b",
        "ت": "t",
        "ج": "g",
        "د": "d",
        "ذ": "z",
        "ر": "r",
        "ز": "z",
        "س": "s",
        "ف": "f",
        "ك": "k",
        "ل": "l",
        "م": "m",
        "ن": "n",
        "ه": "h",
        "ة": "a",
        "و": "w",
        "ي": "y",
        "ى": "a",
        "ا": "a",
        "لا": "la"
    ]

    // Arabic Layout
    private let arRow1 = ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"]
    private let arRow2 = ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"]
    private let arRow3 = ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"]

    // English Layout
    private let enRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
    private let enRow2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
    private let enRow3 = ["z", "x", "c", "v", "b", "n", "m"]

    override func viewDidLoad() {
        super.viewDidLoad()
        feedbackGenerator.prepare()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        
        mainStackView = UIStackView()
        mainStackView.axis = .vertical
        mainStackView.spacing = 6
        mainStackView.distribution = .fillProportionally
        mainStackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(mainStackView)
        
        NSLayoutConstraint.activate([
            mainStackView.topAnchor.constraint(equalTo: view.topAnchor, constant: 6),
            mainStackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 4),
            mainStackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -4),
            mainStackView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -6)
        ])
        
        // 1. Top bar: Franco Switch + Language Switch + Quick Franco Digits
        topBarStack = createTopBar()
        mainStackView.addArrangedSubview(topBarStack)
        
        // 2. Rows container
        rowsStackView = UIStackView()
        rowsStackView.axis = .vertical
        rowsStackView.spacing = 5
        rowsStackView.distribution = .fillEqually
        mainStackView.addArrangedSubview(rowsStackView)
        
        renderKeyboardLayout()
        
        // 3. Bottom Row: Globe + Space + Return
        let bottomRow = createBottomRow()
        mainStackView.addArrangedSubview(bottomRow)
    }
    
    private func createTopBar() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 34).isActive = true
        
        // Franco Toggle Button
        francoToggleBtn = UIButton(type: .system)
        francoToggleBtn.setTitle("⚡ فرانكو: مفعل", for: .normal)
        francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        francoToggleBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 12)
        francoToggleBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        francoToggleBtn.layer.cornerRadius = 8
        francoToggleBtn.addTarget(self, action: #selector(toggleFrancoMode), for: .touchUpInside)
        stack.addArrangedSubview(francoToggleBtn)
        
        // Quick Franco Digits (3, 7, 5, 2, 6, 9)
        let quickDigits = ["3", "7", "5", "2", "6", "9"]
        for digit in quickDigits {
            let btn = UIButton(type: .system)
            btn.setTitle(digit, for: .normal)
            btn.setTitleColor(UIColor.white, for: .normal)
            btn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 14)
            btn.backgroundColor = UIColor(white: 1.0, alpha: 0.08)
            btn.layer.cornerRadius = 7
            btn.addTarget(self, action: #selector(digitPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        
        // Language layout toggle button (AR / EN)
        langToggleBtn = UIButton(type: .system)
        langToggleBtn.setTitle("English", for: .normal)
        langToggleBtn.setTitleColor(UIColor(white: 0.9, alpha: 1.0), for: .normal)
        langToggleBtn.titleLabel?.font = UIFont.systemFont(ofSize: 11, weight: .semibold)
        langToggleBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        langToggleBtn.layer.cornerRadius = 8
        langToggleBtn.addTarget(self, action: #selector(toggleLanguage), for: .touchUpInside)
        langToggleBtn.widthAnchor.constraint(equalToConstant: 58).isActive = true
        stack.addArrangedSubview(langToggleBtn)
        
        return stack
    }
    
    private func renderKeyboardLayout() {
        // Clear existing rows
        for subview in rowsStackView.arrangedSubviews {
            rowsStackView.removeArrangedSubview(subview)
            subview.removeFromSuperview()
        }
        
        if isEnglishMode {
            renderEnglishLayout()
        } else {
            renderArabicLayout()
        }
    }
    
    private func renderArabicLayout() {
        rowsStackView.addArrangedSubview(createKeyRow(items: arRow1))
        rowsStackView.addArrangedSubview(createKeyRow(items: arRow2))
        
        // Row 3 with Backspace
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
    
    private func createKeyRow(items: [String]) -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 3
        stack.distribution = .fillEqually
        for letter in items {
            let btn = createKeyButton(title: letter)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        return stack
    }
    
    private func createBottomRow() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 6
        stack.distribution = .fillProportionally
        stack.heightAnchor.constraint(equalToConstant: 42).isActive = true
        
        // Globe button (switches between iOS keyboards)
        let globeBtn = UIButton(type: .system)
        globeBtn.setTitle("🌐", for: .normal)
        globeBtn.titleLabel?.font = UIFont.systemFont(ofSize: 20)
        globeBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        globeBtn.layer.cornerRadius = 8
        globeBtn.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        globeBtn.widthAnchor.constraint(equalToConstant: 44).isActive = true
        stack.addArrangedSubview(globeBtn)
        
        // Spacebar
        let spaceBtn = UIButton(type: .system)
        spaceBtn.setTitle("مسافة • Franco Space", for: .normal)
        spaceBtn.setTitleColor(UIColor(white: 0.85, alpha: 1.0), for: .normal)
        spaceBtn.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        spaceBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        spaceBtn.layer.cornerRadius = 8
        spaceBtn.addTarget(self, action: #selector(spacePressed), for: .touchUpInside)
        stack.addArrangedSubview(spaceBtn)
        
        // Return / Send button
        let returnBtn = UIButton(type: .system)
        returnBtn.setTitle("إرسال", for: .normal)
        returnBtn.setTitleColor(UIColor.white, for: .normal)
        returnBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 13)
        returnBtn.backgroundColor = UIColor(red: 2/255, green: 132/255, blue: 199/255, alpha: 1.0)
        returnBtn.layer.cornerRadius = 8
        returnBtn.addTarget(self, action: #selector(returnPressed), for: .touchUpInside)
        returnBtn.widthAnchor.constraint(equalToConstant: 68).isActive = true
        stack.addArrangedSubview(returnBtn)
        
        return stack
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

    // MARK: - Actions
    
    @objc private func toggleFrancoMode() {
        feedbackGenerator.impactOccurred()
        isFrancoEnabled.toggle()
        if isFrancoEnabled {
            francoToggleBtn.setTitle("⚡ فرانكو: مفعل", for: .normal)
            francoToggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        } else {
            francoToggleBtn.setTitle("عربي عادي", for: .normal)
            francoToggleBtn.setTitleColor(UIColor.lightGray, for: .normal)
        }
    }
    
    @objc private func toggleLanguage() {
        feedbackGenerator.impactOccurred()
        isEnglishMode.toggle()
        langToggleBtn.setTitle(isEnglishMode ? "عربي" : "English", for: .normal)
        renderKeyboardLayout()
    }
    
    @objc private func shiftPressed() {
        feedbackGenerator.impactOccurred()
        isCaps.toggle()
        renderKeyboardLayout()
    }

    @objc private func letterPressed(_ sender: UIButton) {
        feedbackGenerator.impactOccurred()
        guard let title = sender.currentTitle else { return }
        
        if !isEnglishMode && isFrancoEnabled, let francoChar = francoMap[title] {
            textDocumentProxy.insertText(francoChar)
        } else {
            textDocumentProxy.insertText(title)
        }
    }
    
    @objc private func digitPressed(_ sender: UIButton) {
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
