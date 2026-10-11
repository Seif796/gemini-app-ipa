import UIKit

class KeyboardViewController: UIInputViewController {

    private var isFrancoEnabled: Bool = true
    private var isArabicMode: Bool = true
    private var containerStack: UIStackView!
    private var francoStatusLabel: UILabel!
    
    // Arabic to Franco Map
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
        "ق": "9",
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
        "ا": "a"
    ]

    private let arRow1 = ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"]
    private let arRow2 = ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"]
    private let arRow3 = ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"]

    override func viewDidLoad() {
        super.viewDidLoad()
        setupKeyboardUI()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
    }

    private func setupKeyboardUI() {
        view.backgroundColor = UIColor(red: 11/255, green: 15/255, blue: 25/255, alpha: 1.0)
        
        containerStack = UIStackView()
        containerStack.axis = .vertical
        containerStack.spacing = 6
        containerStack.distribution = .fillEqually
        containerStack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerStack)
        
        NSLayoutConstraint.activate([
            containerStack.topAnchor.constraint(equalTo: view.topAnchor, constant: 6),
            containerStack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 4),
            containerStack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -4),
            containerStack.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -6)
        ])
        
        // 1. Top Bar: Franco Mode Switch & Fast Digits
        let topBar = createTopBar()
        containerStack.addArrangedSubview(topBar)
        
        // 2. Keyboard Rows
        containerStack.addArrangedSubview(createRow(letters: arRow1))
        containerStack.addArrangedSubview(createRow(letters: arRow2))
        
        // 3. Row 3 with Backspace
        let row3 = createRow3()
        containerStack.addArrangedSubview(row3)
        
        // 4. Bottom Row (Globe, Spacebar, WhatsApp quick)
        let bottomRow = createBottomRow()
        containerStack.addArrangedSubview(bottomRow)
    }
    
    private func createTopBar() -> UIView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 5
        stack.distribution = .fillProportionally
        
        let toggleBtn = UIButton(type: .system)
        toggleBtn.setTitle("⚡ فرانكو: مفعل", for: .normal)
        toggleBtn.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        toggleBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 13)
        toggleBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.1)
        toggleBtn.layer.cornerRadius = 8
        toggleBtn.addTarget(self, action: #selector(toggleFrancoMode), for: .touchUpInside)
        stack.addArrangedSubview(toggleBtn)
        
        // Quick numbers (3, 7, 5, 2, 6, 9)
        let quickNumbers = ["3", "7", "5", "2", "6", "9"]
        for num in quickNumbers {
            let numBtn = UIButton(type: .system)
            numBtn.setTitle(num, for: .normal)
            numBtn.setTitleColor(UIColor.white, for: .normal)
            numBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 14)
            numBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.08)
            numBtn.layer.cornerRadius = 8
            numBtn.addTarget(self, action: #selector(keyPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(numBtn)
        }
        
        return stack
    }
    
    private func createRow(letters: [String]) -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.distribution = .fillEqually
        
        for l in letters {
            let btn = createKeyButton(title: l)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        return stack
    }
    
    private func createRow3() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.distribution = .fillProportionally
        
        for l in arRow3 {
            let btn = createKeyButton(title: l)
            btn.addTarget(self, action: #selector(letterPressed(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        
        // Backspace button
        let backBtn = UIButton(type: .system)
        backBtn.setTitle("⌫", for: .normal)
        backBtn.setTitleColor(.white, for: .normal)
        backBtn.titleLabel?.font = UIFont.systemFont(ofSize: 18)
        backBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.18)
        backBtn.layer.cornerRadius = 8
        backBtn.addTarget(self, action: #selector(backspacePressed), for: .touchUpInside)
        backBtn.widthAnchor.constraint(equalToConstant: 44).isActive = true
        stack.addArrangedSubview(backBtn)
        
        return stack
    }
    
    private func createBottomRow() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 6
        stack.distribution = .fillProportionally
        
        // Globe button to switch input methods
        let globeBtn = UIButton(type: .system)
        globeBtn.setTitle("🌐", for: .normal)
        globeBtn.titleLabel?.font = UIFont.systemFont(ofSize: 20)
        globeBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        globeBtn.layer.cornerRadius = 8
        globeBtn.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        globeBtn.widthAnchor.constraint(equalToConstant: 42).isActive = true
        stack.addArrangedSubview(globeBtn)
        
        // Spacebar
        let spaceBtn = UIButton(type: .system)
        spaceBtn.setTitle("مسافة • Space (Franco)", for: .normal)
        spaceBtn.setTitleColor(UIColor(white: 0.85, alpha: 1.0), for: .normal)
        spaceBtn.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        spaceBtn.backgroundColor = UIColor(white: 1.0, alpha: 0.12)
        spaceBtn.layer.cornerRadius = 8
        spaceBtn.addTarget(self, action: #selector(spacePressed), for: .touchUpInside)
        stack.addArrangedSubview(spaceBtn)
        
        // Return / Enter button
        let returnBtn = UIButton(type: .system)
        returnBtn.setTitle("إرسال", for: .normal)
        returnBtn.setTitleColor(UIColor.white, for: .normal)
        returnBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 13)
        returnBtn.backgroundColor = UIColor(red: 2/255, green: 132/255, blue: 199/255, alpha: 1.0)
        returnBtn.layer.cornerRadius = 8
        returnBtn.addTarget(self, action: #selector(returnPressed), for: .touchUpInside)
        returnBtn.widthAnchor.constraint(equalToConstant: 64).isActive = true
        stack.addArrangedSubview(returnBtn)
        
        return stack
    }
    
    private func createKeyButton(title: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
        btn.backgroundColor = UIColor(white: 1.0, alpha: 0.1)
        btn.layer.cornerRadius = 8
        btn.layer.borderWidth = 0.5
        btn.layer.borderColor = UIColor(white: 1.0, alpha: 0.15).cgColor
        return btn
    }

    @objc private func toggleFrancoMode(sender: UIButton) {
        isFrancoEnabled.toggle()
        if isFrancoEnabled {
            sender.setTitle("⚡ فرانكو: مفعل", for: .normal)
            sender.setTitleColor(UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), for: .normal)
        } else {
            sender.setTitle("عربي عادي", for: .normal)
            sender.setTitleColor(UIColor.lightGray, for: .normal)
        }
    }

    @objc private func letterPressed(_ sender: UIButton) {
        guard let title = sender.currentTitle else { return }
        
        if isFrancoEnabled, let francoChar = francoMap[title] {
            textDocumentProxy.insertText(francoChar)
        } else {
            textDocumentProxy.insertText(title)
        }
    }
    
    @objc private func keyPressed(_ sender: UIButton) {
        if let title = sender.currentTitle {
            textDocumentProxy.insertText(title)
        }
    }
    
    @objc private func backspacePressed() {
        textDocumentProxy.deleteBackward()
    }
    
    @objc private func spacePressed() {
        textDocumentProxy.insertText(" ")
    }
    
    @objc private func returnPressed() {
        textDocumentProxy.insertText("\n")
    }
}
